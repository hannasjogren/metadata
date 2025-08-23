// Extraherar metadata + text från PDF (för fulltext)
const fs = require('fs');
const pdfParse = require('pdf-parse');


module.exports = async function extractPdfMetadata(filePath) {
const buffer = fs.readFileSync(filePath);
const data = await pdfParse(buffer);


const info = data.info || {};
const text = data.text || '';


return {
fileType: 'pdf',
fileName: filePath.split(/[/\\]/).pop(),
date: info.CreationDate ? new Date(info.CreationDate) : null,
author: info.Author || null,
title: info.Title || null,
contentPreview: text ? text.slice(0, 300) : null, // kort snippet
text_content: text || null
};
};