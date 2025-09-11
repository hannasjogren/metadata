import express from 'express'; // Webbramverk för att skapa HTTP-server
import cors from 'cors'; // Hanterar CORS-policy för att tillåta externa förfrågningar
import path from 'path'; // Hanterar filvägar
import fs from 'fs'; // Filsystemmodul för att läsa och skriva filer
import { fileURLToPath } from 'url'; // Konverterar import.meta.url till filväg
import pool from '../database/connection.js'; // Databasanslutning via MySQL-pool
import extractPdfMetadata from './extractors/pdf.js'; // Funktion för att extrahera metadata från PDF
import exifr from 'exifr'; // Bibliotek för att extrahera EXIF-data från bilder
import mime from 'mime-types'; // Identifierar MIME-typ baserat på filändelse
import multer from 'multer'; // Hanterar filuppladdning via formulär

// Hämta aktuell filväg och mapp
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serverar frontend-filer (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '../frontend')));

// Serverar uppladdade filer
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serverar ljudfiler
app.use('/audio', express.static(path.join(__dirname, '../audio')));

// Serverar kontorsfiler
app.use('/office', express.static(path.join(__dirname, '../office')));

// Konfigurerar uppladdningsmapp
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir });

/**
 * Endpoint för att ta emot och hantera filuppladdning
 */
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Ingen fil mottagen' });

    const { originalname: filename, filename: storedName, mimetype: filetype } = file;

    // Hantering av PDF-filer
    if (filetype.includes('pdf')) {
      const metadata = await extractPdfMetadata(file.path);

      const [existing] = await pool.query(
        'SELECT id FROM pdf_metadata WHERE filename = ?',
        [filename]
      );
      if (existing.length > 0) {
        return res.status(200).json({ message: 'PDF redan i databasen' });
      }

      const mysqlDate = metadata.date instanceof Date
        ? metadata.date.toISOString().slice(0, 10)
        : null;

      await pool.query(
        `INSERT INTO pdf_metadata (
          filename, stored_name, title, author, creation_date,
          content_preview, text_content, filetype
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          filename,
          storedName,
          metadata.title || null,
          metadata.author || null,
          mysqlDate,
          metadata.contentPreview || null,
          metadata.text_content || null,
          metadata.fileType || 'pdf'
        ]
      );

      return res.status(200).json({ message: 'PDF uppladdad och metadata sparad' });
    }

    // Hantering av bildfiler
    const metadata = await exifr.parse(file.path);

    const [existing] = await pool.query(
      'SELECT id FROM image_metadata WHERE filename = ?',
      [filename]
    );
    if (existing.length > 0) {
      return res.status(200).json({ message: 'Bild redan i databasen' });
    }

    await pool.query(
      `INSERT INTO image_metadata (
        filename, stored_name, make, model, software, modify_date, date_original, create_date,
        exposure_time, f_number, iso, focal_length, focal_length_35mm,
        lens_make, lens_model, gps_latitude, gps_longitude, gps_altitude,
        gps_direction, gps_speed, image_width, image_height, filetype
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        filename,
        storedName,
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
        filetype
      ]
    );

    res.status(200).json({ message: 'Bild uppladdad och metadata sparad' });
  } catch (error) {
    console.error('Fel vid uppladdning:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint för att söka metadata baserat på modell, datumintervall och filtyp
 */
app.get('/api/search', async (req, res) => {
  const { model, date_gt, date_lt, filetype } = req.query;

  try {
    const imageConditions = [];
    const imageValues = [];
    const pdfConditions = [];
    const pdfValues = [];

    let images = [];
    let pdfs = [];

    // Sökning i bildmetadata
    if (!filetype || filetype === 'image') {
      if (model) {
        imageConditions.push('model LIKE ?');
        imageValues.push(`%${model}%`);
      }
      if (date_gt) {
        imageConditions.push('date_original >= ?');
        imageValues.push(date_gt);
      }
      if (date_lt) {
        imageConditions.push('date_original <= ?');
        imageValues.push(date_lt);
      }

      const where = imageConditions.length ? ` WHERE ${imageConditions.join(' AND ')}` : '';
      [images] = await pool.query(`SELECT * FROM image_metadata${where} ORDER BY uploaded_at DESC`, imageValues);
    }

    // Sökning i PDF-metadata
    if (!filetype || filetype === 'pdf') {
      if (date_gt) {
        pdfConditions.push('creation_date >= ?');
        pdfValues.push(date_gt);
      }
      if (date_lt) {
        pdfConditions.push('creation_date <= ?');
        pdfValues.push(date_lt);
      }

      const where = pdfConditions.length ? ` WHERE ${pdfConditions.join(' AND ')}` : '';
      [pdfs] = await pool.query(`SELECT * FROM pdf_metadata${where} ORDER BY created_at DESC`, pdfValues);
    }

    // Returnerar sammanslagen lista
    res.json([...images, ...pdfs]);
  } catch (error) {
    console.error('Fel vid sökning:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint för att hämta metadata om musikfiler
 */
app.get('/api/music', async (req, res) => {
  try {
    const [tracks] = await pool.query('SELECT * FROM music_metadata ORDER BY filename');
    res.json(tracks);
  } catch (err) {
    console.error('Fel vid hämtning av musikmetadata:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Endpoint för att hämta metadata om kontorsfiler
 */
app.get('/api/office', async (req, res) => {
  try {
    const [files] = await pool.query('SELECT * FROM office_metadata ORDER BY filename');
    res.json(files);
  } catch (err) {
    console.error('Fel vid hämtning av kontorsfiler:', err);
    res.status(500).json({ error: err.message });
  }
});

// Startar servern på port 3001
app.listen(3001, () => {
  console.log('Servern körs på http://localhost:3001');
});
