import express from 'express';
import cors from 'cors';
import multer from 'multer';
import exifr from 'exifr';
import pool from '../database/connection.js'; // justera om du flyttar server.js
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

// Justerad sökväg till uploads-mappen i projektets rot
const upload = multer({ dest: path.resolve('../uploads') });
app.use('/uploads', express.static(path.resolve('../uploads')));

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Ingen fil mottagen' });

    const metadata = await exifr.parse(file.path);
    const filename = file.originalname;
    const storedName = file.filename;
    const filetype = file.mimetype;

    const [existing] = await pool.query(
      'SELECT id FROM image_metadata WHERE filename = ?',
      [filename]
    );
    if (existing.length > 0) {
      return res.status(200).json({ message: 'Filen finns redan i databasen' });
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

    res.status(200).json({ message: 'Filen uppladdad och metadata sparad' });
  } catch (error) {
    console.error('Fel vid uppladdning:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/files', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM image_metadata ORDER BY uploaded_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/search', async (req, res) => {
  const { model, date_gt, date_lt, filetype } = req.query;
  const conditions = [];
  const values = [];

  if (model) {
    conditions.push('model LIKE ?');
    values.push(`%${model}%`);
  }
  if (date_gt) {
    conditions.push('date_original >= ?');
    values.push(date_gt);
  }
  if (date_lt) {
    conditions.push('date_original <= ?');
    values.push(date_lt);
  }
  if (filetype) {
    conditions.push('filetype LIKE ?');
    values.push(`%${filetype}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await pool.query(`SELECT * FROM image_metadata ${where} ORDER BY uploaded_at DESC`, values);
  res.json(rows);
});

app.listen(3001, () => {
  console.log('Backend körs på http://localhost:3001');
});
