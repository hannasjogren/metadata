// Extraherar EXIF-data från bildfiler (GPS, tid m.m.)
const fs = require('fs');
const exif = require('exif-parser');


module.exports = function extractImageMetadata(filePath) {
// Läser hela filen till minnet – OK för demo, men för stora filer kan stream vara bättre
const buffer = fs.readFileSync(filePath);
const parser = exif.create(buffer);
const result = parser.parse();


// exif-parser returnerar GPS i decimalt format om det finns
const lat = result.tags.GPSLatitude ?? null;
const lon = result.tags.GPSLongitude ?? null;


return {
fileType: 'image',
fileName: filePath.split(/[/\\]/).pop(),
latitude: lat,
longitude: lon,
date: result.tags.DateTimeOriginal ? new Date(result.tags.DateTimeOriginal * 1000) : null,
};
};