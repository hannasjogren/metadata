// Extraherar EXIF-data från bildfiler

const fs = require('fs');
const exif = require('exif-parser');

module.exports = function extractImageMetadata(filePath) {
  const buffer = fs.readFileSync(filePath);
  const parser = exif.create(buffer);
  const result = parser.parse();

  return {
    fileType: 'image',
    fileName: filePath.split('/').pop(),
    latitude: result.tags.GPSLatitude || null,
    longitude: result.tags.GPSLongitude || null,
    date: result.tags.DateTimeOriginal || null
  };
};