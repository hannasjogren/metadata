import fs from 'fs'; // Filsystemmodul för att läsa och skriva filer
import path from 'path'; // Hanterar filvägar
import { createRequire } from 'module'; // Används för att importera CommonJS-moduler i ES-moduler
import { createCanvas } from 'canvas'; // Skapar en canvas för att rendera PDF-sidor som bilder

// Importerar pdfjs-dist via require eftersom det är en CommonJS-modul
const require = createRequire(import.meta.url);
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

/**
 * Extraherar metadata, textinnehåll och genererar en miniatyrbild från en PDF-fil
 * @param {string} filePath - Fullständig sökväg till PDF-filen
 * @returns {object} - Ett objekt med metadata och innehåll
 */
export default async function extractPdfMetadata(filePath) {
  try {
    // Laddar PDF-dokumentet
    const data = await pdfjsLib.getDocument(filePath).promise;

    // Hämtar metadata (titel, författare, skapelsedatum)
    const meta = await data.getMetadata();

    const textContent = [];

    // Loopar igenom varje sida och extraherar textinnehåll
    for (let i = 1; i <= data.numPages; i++) {
      const page = await data.getPage(i);
      const text = await page.getTextContent();
      const pageText = text.items.map(t => t.str).join(' ');
      textContent.push(pageText);
    }

    // Hämtar första sidan för att generera en miniatyrbild
    const page = await data.getPage(1);
    const viewport = page.getViewport({ scale: 0.2 }); // Skalar ner för att få en liten bild

    // Skapar en canvas med rätt storlek
    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext('2d');

    // Renderar sidan till canvas
    await page.render({ canvasContext: ctx, viewport }).promise;

    // Sparar canvasen som PNG-bild
    const thumbnailName = path.basename(filePath, '.pdf') + '_thumb.png';
    const thumbnailPath = path.join(path.dirname(filePath), thumbnailName);
    fs.writeFileSync(thumbnailPath, canvas.toBuffer());

    // Returnerar extraherad metadata och innehåll
    return {
      fileType: 'pdf',
      fileName: path.basename(filePath),
      date: parsePdfDate(meta.info.CreationDate),
      author: meta.info.Author || null,
      title: meta.info.Title || null,
      contentPreview: textContent.join(' ').slice(0, 300), // Förhandsvisning av text
      text_content: textContent.join(' '), // Fullständig text från alla sidor
      thumbnail: thumbnailName // Filnamn på genererad miniatyrbild
    };
  } catch (err) {
    // Felhantering vid misslyckad parsning
    console.error('Fel vid PDF-parsning:', err);
    return {
      fileType: 'pdf',
      fileName: path.basename(filePath),
      date: null,
      author: null,
      title: null,
      contentPreview: '',
      text_content: '',
      thumbnail: null
    };
  }
}

/**
 * Konverterar PDF-datumsträng till JavaScript Date-objekt
 * @param {string} pdfDate - Datumsträng i PDF-format (t.ex. D:20230911)
 * @returns {Date|null} - Ett Date-objekt eller null om formatet är ogiltigt
 */
function parsePdfDate(pdfDate) {
  if (!pdfDate || typeof pdfDate !== 'string') return null;

  // Matchar formatet D:YYYYMMDD
  const match = pdfDate.match(/^D:(\d{4})(\d{2})(\d{2})/);
  if (match) {
    const [_, year, month, day] = match;
    return new Date(`${year}-${month}-${day}`);
  }

  return null;
}
