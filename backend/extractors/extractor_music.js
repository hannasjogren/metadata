import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pool from '../../database/connection.js';
import * as musicMetadata from 'music-metadata';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const audioDir = path.join(__dirname, '../audio');

async function run() {
  if (!fs.existsSync(audioDir)) {
    console.error('Mappen "audio" saknas.');
    process.exit(1);
  }

  const files = fs.readdirSync(audioDir);

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

  for (let file of files) {
    try {
      const filePath = path.join(audioDir, file);
      const metadata = await musicMetadata.parseFile(filePath);

      await pool.query(
        `INSERT INTO music_metadata (
          filename, artist, title, year, label, duration, bitrate, filetype
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          file,
          metadata.common.artist || null,
          metadata.common.title || null,
          metadata.common.year || null,
          metadata.common.label || null,
          metadata.format.duration || null,
          metadata.format.bitrate || null,
          path.extname(file).slice(1)
        ]
      );

      console.log(`${file} sparad`);
    } catch (err) {
      console.error(`Fil ${file} kunde inte sparas:`, err.message);
    }
  }

  process.exit();
}

run();