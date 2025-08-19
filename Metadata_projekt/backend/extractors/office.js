// Extraherar textinnehåll från Office-dokument (Word)

const mammoth = require('mammoth');

module.exports = async function extractOfficeMetadata(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });

  return {
    fileType: 'office',
    fileName: filePath.split('/').pop(),
    contentPreview: result.value.slice(0, 100) // Förhandsvisning av text
  };
};