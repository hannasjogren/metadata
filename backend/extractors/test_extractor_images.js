// Importerar exifr för att extrahera metadata från bildfiler
import exifr from 'exifr';
 
// Importerar Node.js inbyggda filsystemmodul
import fs from 'fs';
 
// Importerar path-modulen för att hantera sökvägar
import path from 'path';
 
// Anger sökvägen till bildmappen
const imageDir = path.resolve('../images');
 
// Läser alla filnamn i bildmappen
const images = fs.readdirSync(imageDir);
 
// Loopar igenom varje fil i mappen
for (const image of images) {
  // Kontrollera att filen har rätt bildformat (.jpg eller .jpeg)
  if (image.toLowerCase().endsWith('.jpg') || image.toLowerCase().endsWith('.jpeg')) {
    // Skriv ut filnamnet
    console.log('IMAGE:', image);
 
    try {
      // Extrahera metadata från bilden
      const metadata = await exifr.parse(path.join(imageDir, image));
 
      // Konvertera metadata till JSON-sträng
      const jsonData = JSON.stringify(metadata, null, 2);
 
      // Skriv ut metadata till konsolen
      console.log(jsonData);
 
      // Här kan du lägga till kod för att spara metadata i databasen
      // Exempel:
      // await query('INSERT INTO files (filename, metadata) VALUES (?, ?)', [image, jsonData]);
 
    } catch (error) {
      // Hantera fel vid metadataextraktion
      console.error(`Fel vid läsning av ${image}:`, error.message);
    }
  }
}
 