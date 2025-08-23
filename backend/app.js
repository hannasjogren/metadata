// app.js
// Startar Express-servern och kopplar ihop alla delar

const express = require("express");
const multer = require("multer");
const path = require("path");

const uploadHandler = require("./upload");
const searchRoutes = require("./routes/search");

const app = express();

// Multer används för att hantera uppladdade filer, sparas tillfälligt i ./uploads
const upload = multer({ dest: "uploads/" });

app.use(express.json()); // Gör så att servern kan ta emot JSON-data

// Serverar frontend-filerna (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "../frontend/public")));

// Route för filuppladdning
app.post("/upload", upload.single("file"), uploadHandler);

// Route för sökning
app.use("/search", searchRoutes);

// Starta servern
app.listen(3000, () =>
  console.log("Servern körs på http://localhost:3000")
);
