// Hanterar sökningar i metadata-tabellen

const express = require('express');
const db = require('../db/connection');
const router = express.Router();

router.get('/', async (req, res) => {
  const { fileType, fileName, latMin, latMax, lonMin, lonMax } = req.query;

  let query = 'SELECT * FROM metadata WHERE 1=1';
  const params = [];

  if (fileType) {
    query += ' AND fileType = ?';
    params.push(fileType);
  }

  if (fileName) {
    query += ' AND fileName LIKE ?';
    params.push(`%${fileName}%`);
  }

  if (latMin && latMax) {
    query += ' AND latitude BETWEEN ? AND ?';
    params.push(latMin, latMax);
  }

  if (lonMin && lonMax) {
    query += ' AND longitude BETWEEN ? AND ?';
    params.push(lonMin, lonMax);
  }

  const [rows] = await db.execute(query, params);
  res.json(rows); // Returnerar resultatet som JSON
});

module.exports = router;