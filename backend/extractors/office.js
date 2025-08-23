// Extraherar text från DOCX (andra Office-format kan läggas till)
const mammoth = require('mammoth');


module.exports = async function extractOfficeMetadata(filePath) {
const { value } = await mammoth.extractRawText({ path: filePath });
const text = value || '';
return {
fileType: 'office',
fileName: filePath.split(/[/\\]/).pop(),
contentPreview: text ? text.slice(0, 300) : null,
text_content: text || null
};
};