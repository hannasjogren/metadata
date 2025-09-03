import express from 'express';
import cors from 'cors';
import pool from '../database/connection.js';

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint för att hämta alla filer
app.get('/api/files', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM files');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Starta servern
app.listen(3001, () => {
  console.log('Backend körs på http://localhost:3001');
});