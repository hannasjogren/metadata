// extractors/pdf.js
const fs = require("fs");
const pdfParse = require("pdf-parse");

module.exports = async function extractPdfMetadata(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);

  const info = data.info || {};
  const text = data.text || "";

  return {
    fileType: "pdf",
    fileName: filePath.split(/[/\\]/).pop(),
    date: parsePdfDate(info.CreationDate),
    author: info.Author || null,
    title: info.Title || null,
    artist: null, 
    latitude: null, 
    longitude: null,
    contentPreview: text.slice(0, 300),
    text_content: text,
  };
};

function parsePdfDate(pdfDate) {
  if (!pdfDate || typeof pdfDate !== "string") return null;

  const match = pdfDate.match(/^D:(\d{4})(\d{2})(\d{2})/);
  if (match) {
    const [_, year, month, day] = match;
    return new Date(`${year}-${month}-${day}`);
  }

  return null;
}
