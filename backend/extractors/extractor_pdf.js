import fs from 'fs'; // Filsystemmodul för att läsa, kopiera och kontrollera filer
import path from 'path'; // Hanterar filvägar
import { fileURLToPath } from 'url'; // Konverterar import.meta.url till filväg
import pool from '../../database/connection.js'; // Databasanslutning via MySQL-pool
import extractPdfMetadata from './pdf.js'; // Funktion för att extrahera metadata från PDF-filer

// Hämta aktuell filväg och mapp
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Definierar sökvägen till mappen där PDF-filerna ligger
const pdfDir = path.join(__dirname, '../pdf');

// Definierar sökvägen till mappen där filerna ska kopieras till (uploads)
const uploadDir = path.join(__dirname, '../../uploads');

/**
 * Huvudfunktion som kör importen av PDF-filer
 */
async function main() {
  console.log('Startar PDF-import...');
  console.log('Sökväg till pdfDir:', pdfDir);

  // Kontrollera att mappen med PDF-filer finns
  if (!fs.existsSync(pdfDir)) {
    console.error('Katalog för pdf saknas:', pdfDir);
    return;
  }

  // Skapa uploads-mappen om den inte finns
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Filtrera ut endast PDF-filer från katalogen
  const files = fs.readdirSync(pdfDir).filter(f => f.toLowerCase().endsWith('.pdf'));
  console.log('Hittade PDF-filer:', files);

  // Loopar igenom varje PDF-fil
  for (const file of files) {
    const sourcePath = path.join(pdfDir, file);   // Full sökväg till originalfil
    const targetPath = path.join(uploadDir, file); // Full sökväg till kopierad fil

    try {
      // Kontrollera om filen redan finns i databasen
      const [existing] = await pool.query(
        'SELECT id FROM pdf_metadata WHERE filename = ?',
        [file]
      );

      // Hoppar över filen om den redan är sparad
      if (existing.length > 0) {
        console.log('Hoppar över (redan sparad):', file);
        continue;
      }

      // Kopiera filen till uploads-mappen
      fs.copyFileSync(sourcePath, targetPath);

      // Extrahera metadata från PDF-filen
      const metadata = await extractPdfMetadata(sourcePath);
      console.log('Extraherad metadata:', metadata);

      // Konvertera datum till MySQL-format (YYYY-MM-DD)
      const mysqlDate = metadata.date instanceof Date
        ? metadata.date.toISOString().slice(0, 10)
        : null;

      // Spara metadata i databasen
      await pool.query(
        `INSERT INTO pdf_metadata (
          filename, stored_name, title, author, creation_date,
          content_preview, text_content, filetype
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          metadata.fileName,                  // Filnamn
          metadata.fileName,                  // Sparat namn (samma som original)
          metadata.title || null,             // Titel från dokumentet
          metadata.author || null,            // Författare
          mysqlDate,                          // Skapelsedatum
          metadata.contentPreview || null,    // Förhandsvisning av innehåll
          metadata.text_content || null,      // Fullständig text
          metadata.fileType || 'pdf'          // Filtyp
        ]
      );

      // Bekräftelse i terminalen
      console.log('Sparad:', file);

    } catch (err) {
      // Felhantering vid misslyckad metadataextraktion eller databasoperation
      console.error(`Fel vid PDF-parsning (${file}):`, err);
    }
  }

  // Slutmeddelande när alla filer är behandlade
  console.log('Färdig med alla PDF-filer.');
}

// Startar huvudfunktionen
main();
