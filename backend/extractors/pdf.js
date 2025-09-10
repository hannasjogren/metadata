import fs from 'fs';
import path from 'path';
import pkg from 'pdfjs-dist/legacy/build/pdf.js'; // CommonJS modul
const { getDocument } = pkg;

export default async function extractPdfMetadata(filePath) {
  try {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const pdfDoc = await getDocument({ data }).promise;

    let textContent = '';
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str);
      textContent += strings.join(' ') + '\n';
    }

    const info = pdfDoc._pdfInfo || {};
    const author = info.Author || null;
    const title = info.Title || null;
    const creationDateRaw = info.CreationDate || null;
    const date = parsePdfDate(creationDateRaw);

    return {
      fileType: 'pdf',
      fileName: path.basename(filePath),
      date,
      author,
      title,
      artist: null,
      latitude: null,
      longitude: null,
      contentPreview: textContent.slice(0, 300),
      text_content: textContent
    };
  } catch (err) {
    console.error('Fel vid PDF-parsning:', err);
    return {
      fileType: 'pdf',
      fileName: path.basename(filePath),
      date: null,
      author: null,
      title: null,
      artist: null,
      latitude: null,
      longitude: null,
      contentPreview: '',
      text_content: ''
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
