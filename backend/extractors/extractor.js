import exifr from 'exifr';
import fs from 'fs';
import path from 'path';
import pool from '../../database/connection.js';

const imageDir = path.resolve('../images');

async function main() {
  const images = fs.readdirSync(imageDir);

  for (const image of images) {
    if (image.toLowerCase().endsWith('.jpg') || image.toLowerCase().endsWith('.jpeg')) {
      console.log('Kontrollerar:', image);

      try {
        const [existing] = await pool.query(
          'SELECT id FROM files WHERE filename = ?',
          [image]
        );

        if (existing.length > 0) {
          console.log('Hoppar över (redan sparad):', image);
          continue;
        }

        const metadata = await exifr.parse(path.join(imageDir, image));
        const jsonData = JSON.stringify(metadata);

        await pool.query(
          'INSERT INTO files (filename, filepath, filetype, metadata) VALUES (?, ?, ?, ?)',
          [image, path.join(imageDir, image), 'image/jpeg', jsonData]
        );

        console.log('Sparad:', image);
      } catch (error) {
        console.error('Fel vid hantering av', image, ':', error.message);
      }
    }
  }

  console.log('Färdig med alla bilder.');
}

main();