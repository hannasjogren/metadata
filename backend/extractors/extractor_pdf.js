import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../../database/connection.js';
import extractPdfMetadata from './pdf.js';

// Hitta __dirname i ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sökvägar
const pdfDir = path.join(__dirname, '../pdf');           // meta/backend/pdf
const uploadDir = path.join(__dirname, '../../uploads'); // meta/uploads

async function main() {
  console.log('Startar PDF-import...');
  console.log('Sökväg till pdfDir:', pdfDir);

  if (!fs.existsSync(pdfDir)) {
    console.error('Katalog för pdf saknas:', pdfDir);
    return;
  }

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const files = fs.readdirSync(pdfDir).filter(f => f.toLowerCase().endsWith('.pdf'));
  console.log('Hittade PDF-filer:', files);

  for (const file of files) {
    const sourcePath = path.join(pdfDir, file);
    const targetPath = path.join(uploadDir, file);

    try {
      // Kontrollera om fil redan finns i databasen
      const [existing] = await pool.query(
        'SELECT id FROM pdf_metadata WHERE filename = ?',
        [file]
      );
      if (existing.length > 0) {
        console.log('Hoppar över (redan sparad):', file);
        continue;
      }

      // Kopiera filen till uploadDir
      fs.copyFileSync(sourcePath, targetPath);

      // Extrahera metadata
      const metadata = await extractPdfMetadata(sourcePath);
      console.log('Extraherad metadata:', metadata);

      // Säkerställ att date är i MySQL-format YYYY-MM-DD
      const mysqlDate = metadata.date instanceof Date ? metadata.date.toISOString().slice(0, 10) : null;

      // Säker insert i databasen
      await pool.query(
        `INSERT INTO pdf_metadata (
          filename, stored_name, title, author, creation_date,
          content_preview, text_content, filetype
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          metadata.fileName,
          metadata.fileName,
          metadata.title || null,
          metadata.author || null,
          mysqlDate,
          metadata.contentPreview || null,
          metadata.text_content || null,
          metadata.fileType || 'pdf'
        ]
      );

      console.log('Sparad:', file);

    } catch (err) {
      console.error(`Fel vid ${file}:`, err.message || err);
    }
  }

  console.log('Färdig med alla PDF-filer.');
}

main();
