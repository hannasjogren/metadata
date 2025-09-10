import fs from 'fs';
import pdfParseModule from 'pdf-parse';
const pdfParse = pdfParseModule.default;

export default async function extractPdfMetadata(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  let pdfData;

  try {
    pdfData = await pdfParse(dataBuffer);
  } catch (err) {
    console.error('Fel vid PDF-parsning:', err);
    pdfData = {};
  }

  const info = pdfData?.metadata || {};
  const textContent = pdfData?.text || '';

  const creationDate = info.CreationDate ? parsePdfDate(info.CreationDate) : null;
  const author = info.Author || null;
  const title = info.Title || null;

  return {
    fileType: 'pdf',
    fileName: filePath.split(/[/\\]/).pop(),
    date: creationDate,
    author: author,
    title: title,
    artist: null,
    latitude: null,
    longitude: null,
    contentPreview: textContent.slice(0, 300),
    text_content: textContent,
  };
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
