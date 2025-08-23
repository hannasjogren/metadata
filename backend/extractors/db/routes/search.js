// search.js
// Hanterar sökningar i metadata-tabellen

const express = require("express");
const db = require("../db/connection");
const router = express.Router();

router.get("/", async (req, res) => {
  const {
    fileType,
    fileName,
    author,
    title,
    artist,
    date_gt,
    date_lt,
    q, // fulltext-sökning
  } = req.query;

  let query = "SELECT *, MATCH(title, author, contentPreview) AGAINST(?) AS relevance FROM metadata WHERE 1=1";
  const params = [q || ""]; // alltid med relevance

  if (fileType) {
    query += " AND fileType = ?";
    params.push(fileType);
  }
  if (fileName) {
    query += " AND fileName LIKE ?";
    params.push(`%${fileName}%`);
  }
  if (author) {
    query += " AND author LIKE ?";
    params.push(`%${author}%`);
  }
  if (title) {
    query += " AND title LIKE ?";
    params.push(`%${title}%`);
  }
  if (artist) {
    query += " AND artist LIKE ?";
    params.push(`%${artist}%`);
  }
  if (date_gt) {
    query += " AND date > ?";
    params.push(date_gt);
  }
  if (date_lt) {
    query += " AND date < ?";
    params.push(date_lt);
  }
  if (q) {
    query += " AND MATCH(title, author, contentPreview) AGAINST(? IN NATURAL LANGUAGE MODE)";
    params.push(q);
  }

  query += " ORDER BY relevance DESC";

  try {
    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Fel vid sökning.");
  }
});

module.exports = router;
