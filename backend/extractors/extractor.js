import exifr from 'exifr';
import fs from 'fs';
import path from 'path';
import pool from '../../database/connection.js';

// Källmapp: backend/images
const imageDir = path.resolve('../images');

// Målmapp: uploads i projektets rot
const uploadDir = path.resolve('../../uploads');

async function main() {
  const images = fs.readdirSync(imageDir);

  for (const image of images) {
    if (image.toLowerCase().endsWith('.jpg') || image.toLowerCase().endsWith('.jpeg')) {
      const sourcePath = path.join(imageDir, image);
      const targetPath = path.join(uploadDir, image);

      try {
        const [existing] = await pool.query(
          'SELECT id FROM image_metadata WHERE filename = ?',
          [image]
        );
        if (existing.length > 0) {
          console.log('Hoppar över (redan sparad):', image);
          continue;
        }

        fs.copyFileSync(sourcePath, targetPath);
        const metadata = await exifr.parse(sourcePath);

        await pool.query(
          `INSERT INTO image_metadata (
            filename, stored_name, make, model, software, modify_date, date_original, create_date,
            exposure_time, f_number, iso, focal_length, focal_length_35mm,
            lens_make, lens_model, gps_latitude, gps_longitude, gps_altitude,
            gps_direction, gps_speed, image_width, image_height, filetype
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            image,
            image,
            metadata.Make || null,
            metadata.Model || null,
            metadata.Software || null,
            metadata.ModifyDate || null,
            metadata.DateTimeOriginal || null,
            metadata.CreateDate || null,
            metadata.ExposureTime || null,
            metadata.FNumber || null,
            metadata.ISO || null,
            metadata.FocalLength || null,
            metadata.FocalLengthIn35mmFormat || null,
            metadata.LensMake || null,
            metadata.LensModel || null,
            metadata.latitude || null,
            metadata.longitude || null,
            metadata.GPSAltitude || null,
            metadata.GPSImgDirection || null,
            metadata.GPSSpeed || null,
            metadata.ExifImageWidth || null,
            metadata.ExifImageHeight || null,
            'image/jpeg'
          ]
        );

        console.log('Sparad:', image);
      } catch (error) {
        console.error(`Fel vid ${image}:`, error.message || error);
      }
    }
  }

  console.log('Färdig med alla bilder.');
}

main();
