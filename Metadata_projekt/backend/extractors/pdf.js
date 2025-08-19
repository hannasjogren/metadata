// Extraherar metadata från PDF-filer

const fs = require('fs');
const pdfParse = require('pdf-parse');

module.exports = async function extractPdfMetadata(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);

  return {
    fileType: 'pdf',
    fileName: filePath.split('/').pop(),
    date: data.info.CreationDate || null,
    author: data.info.Author || null,
    title: data.info.Title || null
  };
};