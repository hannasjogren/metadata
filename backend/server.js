import express from 'express';
import cors from 'cors';
import multer from 'multer';
import exifr from 'exifr';
import path from 'path';
import fs from 'fs';
import pool from '../database/connection.js';
import extractPdfMetadata from './extractors/pdf.js';

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: path.resolve('./uploads') });
app.use('/uploads', express.static(path.resolve('./uploads')));

// === UPLOAD ===
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Ingen fil mottagen' });

    const filename = file.originalname;
    const storedName = file.filename;
    const filetype = file.mimetype;

    // PDF
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
          metadata.fileName,
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

    // BILD
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

// === PDF TEXT VIEW ===
app.get('/pdf/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const [rows] = await pool.query(
      'SELECT text_content FROM pdf_metadata WHERE filename = ?',
      [filename]
    );
    if (!rows.length) return res.status(404).send('PDF hittades inte');

    const text = rows[0].text_content || '';
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<pre style="white-space: pre-wrap; word-wrap: break-word;">${text}</pre>`);
  } catch (err) {
    console.error('Fel vid visning av PDF:', err);
    res.status(500).send('Fel vid visning av PDF');
  }
});

// === SEARCH ===
app.get('/api/search', async (req, res) => {
  const { model, date_gt, date_lt, filetype } = req.query;

  try {
    const imageConditions = [];
    const imageValues = [];
    const pdfConditions = [];
    const pdfValues = [];

    let images = [];
    let pdfs = [];

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
      [pdfs] = await pool.query(`SELECT * FROM pdf_metadata${where} ORDER BY uploaded_at DESC`, pdfValues);
    }

    res.json([...images, ...pdfs]);
  } catch (error) {
    console.error('Fel vid sökning:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Servern körs på http://localhost:3001');
});
