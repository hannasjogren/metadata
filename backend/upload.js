// upload.js
// Tar emot uppladdad fil, extraherar metadata och sparar i databasen

const db = require("./db/connection");
const extractImageMetadata = require("./extractors/image");
const extractPdfMetadata = require("./extractors/pdf");
const extractAudioMetadata = require("./extractors/audio");
const extractOfficeMetadata = require("./extractors/office");

module.exports = async (req, res) => {
  const file = req.file;
  let metadata;

  try {
    // Väljer rätt extraktor beroende på filtyp
    if (file.mimetype.startsWith("image/")) {
      metadata = extractImageMetadata(file.path);
    } else if (file.mimetype === "application/pdf") {
      metadata = await extractPdfMetadata(file.path);
    } else if (file.mimetype.startsWith("audio/")) {
      metadata = await extractAudioMetadata(file.path);
    } else if (file.mimetype.includes("word") || file.mimetype.includes("excel")) {
      metadata = await extractOfficeMetadata(file.path);
    } else {
      return res.status(400).send("⚠ Filtyp stöds ej.");
    }

    // Sparar metadata i databasen
    await db.execute(
      `INSERT INTO metadata 
        (fileName, fileType, latitude, longitude, date, author, title, artist, contentPreview)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        metadata.fileName,
        metadata.fileType,
        metadata.latitude || null,
        metadata.longitude || null,
        metadata.date || null,
        metadata.author || null,
        metadata.title || null,
        metadata.artist || null,
        metadata.contentPreview || null,
      ]
    );

    res.send("✅ Metadata sparad!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Fel vid metadataextraktion.");
  }
};
