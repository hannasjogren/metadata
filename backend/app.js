// app.js
// Startar Express-servern och kopplar ihop alla delar

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Tillåt frontend från Live Server (port 5500)
app.use(cors({ origin: "http://127.0.0.1:5500" }));

// Hantera JSON och formulärdata
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sätt upp lagring för uppladdade filer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "app/images"),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// Uppladdningsroute
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: "Ingen fil mottagen" });
  // Här kan du extrahera metadata och spara i databas
  res.json({ success: true });
});

// Förhandsvisning av fil
app.get("/preview/:filename", (req, res) => {
  const filePath = path.join(__dirname, "app", "images", req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).send("Filen hittades inte");
  res.sendFile(filePath);
});

// Nedladdning
app.get("/download/:filename", (req, res) => {
  const filePath = path.join(__dirname, "app", "images", req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).send("Filen hittades inte");
  res.download(filePath);
});

// Starta servern
app.listen(PORT, () => {
  console.log(`Servern körs på http://localhost:${PORT}`);
});
