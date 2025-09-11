import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { createCanvas } from 'canvas'; // <-- canvas

const require = createRequire(import.meta.url);
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

export default async function extractPdfMetadata(filePath) {
  try {
    const data = await pdfjsLib.getDocument(filePath).promise;
    const meta = await data.getMetadata();
    const textContent = [];

    // Extrahera text
    for (let i = 1; i <= data.numPages; i++) {
      const page = await data.getPage(i);
      const text = await page.getTextContent();
      const pageText = text.items.map(t => t.str).join(' ');
      textContent.push(pageText);
    }

    // Generera thumbnail från första sidan
    const page = await data.getPage(1);
    const viewport = page.getViewport({ scale: 0.2 }); // liten skala
    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext('2d');

    await page.render({ canvasContext: ctx, viewport }).promise;
    const thumbnailName = path.basename(filePath, '.pdf') + '_thumb.png';
    const thumbnailPath = path.join(path.dirname(filePath), thumbnailName);
    fs.writeFileSync(thumbnailPath, canvas.toBuffer());

    return {
      fileType: 'pdf',
      fileName: path.basename(filePath),
      date: parsePdfDate(meta.info.CreationDate),
      author: meta.info.Author || null,
      title: meta.info.Title || null,
      contentPreview: textContent.join(' ').slice(0, 300),
      text_content: textContent.join(' '),
      thumbnail: thumbnailName
    };
  } catch (err) {
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

function parsePdfDate(pdfDate) {
  if (!pdfDate || typeof pdfDate !== 'string') return null;
  const match = pdfDate.match(/^D:(\d{4})(\d{2})(\d{2})/);
  if (match) {
    const [_, year, month, day] = match;
    return new Date(`${year}-${month}-${day}`);
  }
  return null;
}
