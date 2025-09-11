import path from 'path'; // Hanterar filvägar
import { fileURLToPath } from 'url'; // Konverterar import.meta.url till filväg
import fs from 'fs'; // Filsystemmodul för att läsa och kontrollera filer
import pool from '../../database/connection.js'; // Databasanslutning via MySQL-pool
import * as musicMetadata from 'music-metadata'; // Bibliotek för att läsa metadata från ljudfiler

// Hämta aktuell filväg och mapp
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Definierar sökvägen till mappen där ljudfilerna ligger
const audioDir = path.join(__dirname, '../audio');

async function run() {
  // Kontrollera att mappen med ljudfiler finns
  if (!fs.existsSync(audioDir)) {
    console.error('Mappen "audio" saknas.');
    process.exit(1);
  }

  // Läs in alla filer i ljudmappen
  const files = fs.readdirSync(audioDir);

  // Skapa tabellen i databasen om den inte redan finns
  await pool.query(`
    CREATE TABLE IF NOT EXISTS music_metadata (
      filename TEXT,
      artist TEXT,
      title TEXT,
      year YEAR,
      label TEXT,
      duration FLOAT,
      bitrate INT,
      filetype TEXT
    )
  `);

  // Loopar igenom varje fil i mappen
  for (let file of files) {
    try {
      const filePath = path.join(audioDir, file); // Full sökväg till filen

      // Extrahera metadata från ljudfilen
      const metadata = await musicMetadata.parseFile(filePath);

      // Spara metadata i databasen
      await pool.query(
        `INSERT INTO music_metadata (
          filename, artist, title, year, label, duration, bitrate, filetype
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          file,                                 // Filnamn
          metadata.common.artist || null,       // Artistnamn
          metadata.common.title || null,        // Titel
          metadata.common.year || null,         // År
          metadata.common.label || null,        // Skivbolag
          metadata.format.duration || null,     // Speltid i sekunder
          metadata.format.bitrate || null,      // Bitrate i bits per sekund
          path.extname(file).slice(1)           // Filtyp (t.ex. mp3)
        ]
      );

      // Bekräftelse i terminalen
      console.log(`${file} sparad`);
    } catch (err) {
      // Felhantering vid misslyckad metadataextraktion eller databasoperation
      console.error(`Fil ${file} kunde inte sparas:`, err.message);
    }
  }

  // Avslutar processen när alla filer är behandlade
  process.exit();
}

// Startar huvudfunktionen
run();
