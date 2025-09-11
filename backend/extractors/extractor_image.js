import exifr from 'exifr'; // Bibliotek för att läsa EXIF-metadata från bildfiler
import fs from 'fs';       // Filsystemmodul för att läsa och kopiera filer
import path from 'path';   // Modul för att hantera filvägar
import pool from '../../database/connection.js'; // Databasanslutning via MySQL-pool

// Definierar sökvägen till mappen där originalbilderna ligger
const imageDir = path.resolve('../images');

// Definierar sökvägen till mappen där bilderna ska kopieras till (uploads)
const uploadDir = path.resolve('../../uploads');

async function main() {
  // Läser in alla filer i bildmappen
  const images = fs.readdirSync(imageDir);

  // Loopar igenom varje fil i mappen
  for (const image of images) {
    // Filtrerar ut endast JPEG-bilder (.jpg eller .jpeg)
    if (image.toLowerCase().endsWith('.jpg') || image.toLowerCase().endsWith('.jpeg')) {
      const sourcePath = path.join(imageDir, image);   // Full sökväg till originalfil
      const targetPath = path.join(uploadDir, image);  // Full sökväg till kopierad fil

      try {
        // Kontrollerar om filen redan finns i databasen
        const [existing] = await pool.query(
          'SELECT id FROM image_metadata WHERE filename = ?',
          [image]
        );

        // Hoppar över filen om den redan är sparad
        if (existing.length > 0) {
          console.log('Hoppar över (redan sparad):', image);
          continue;
        }

        // Kopierar filen till uploads-mappen
        fs.copyFileSync(sourcePath, targetPath);

        // Extraherar metadata från bilden
        const metadata = await exifr.parse(sourcePath);

        // Sparar metadata i databasen
        await pool.query(
          `INSERT INTO image_metadata (
            filename, stored_name, make, model, software, modify_date, date_original, create_date,
            exposure_time, f_number, iso, focal_length, focal_length_35mm,
            lens_make, lens_model, gps_latitude, gps_longitude, gps_altitude,
            gps_direction, gps_speed, image_width, image_height, filetype
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            image,                        // Originalfilens namn
            image,                        // Sparat filnamn (samma som original)
            metadata.Make || null,       // Kameratillverkare
            metadata.Model || null,      // Kameramodell
            metadata.Software || null,   // Använd mjukvara
            metadata.ModifyDate || null, // Datum då bilden modifierades
            metadata.DateTimeOriginal || null, // Ursprungligt fotodatum
            metadata.CreateDate || null,       // Skapelsedatum
            metadata.ExposureTime || null,     // Exponeringstid
            metadata.FNumber || null,          // Bländartal
            metadata.ISO || null,              // ISO-värde
            metadata.FocalLength || null,      // Brännvidd
            metadata.FocalLengthIn35mmFormat || null, // Brännvidd i 35mm-format
            metadata.LensMake || null,         // Objektivtillverkare
            metadata.LensModel || null,        // Objektivmodell
            metadata.latitude || null,         // GPS-latitud
            metadata.longitude || null,        // GPS-longitud
            metadata.GPSAltitude || null,      // GPS-höjd
            metadata.GPSImgDirection || null,  // Riktning
            metadata.GPSSpeed || null,         // Hastighet
            metadata.ExifImageWidth || null,   // Bildbredd
            metadata.ExifImageHeight || null,  // Bildhöjd
            'image/jpeg'                       // Filtyp
          ]
        );

        // Bekräftelse i terminalen
        console.log('Sparad:', image);
      } catch (error) {
        // Felhantering vid misslyckad metadataextraktion eller databasoperation
        console.error(`Fel vid ${image}:`, error.message || error);
      }
    }
  }

  // Slutmeddelande när alla bilder är behandlade
  console.log('Färdig med alla bilder.');
}

// Startar huvudfunktionen
main();