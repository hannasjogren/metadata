import path from 'path'; // Hanterar filvägar
import { fileURLToPath } from 'url'; // Konverterar import.meta.url till filväg
import fs from 'fs'; // Filsystemmodul för att läsa och kontrollera filer
import mammoth from 'mammoth'; // Extraherar text från DOCX-filer
import xlsx from 'xlsx'; // Läser innehåll från XLSX-filer
import unzipper from 'unzipper'; // Packar upp PPTX-filer (ZIP-format)
import xml2js from 'xml2js'; // Tolkar XML-innehåll från PowerPoint
import pool from '../../database/connection.js'; // Databasanslutning via MySQL-pool

// Hämta aktuell filväg och mapp
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Definierar sökvägen till mappen där kontorsfilerna ligger
const officeDir = path.join(__dirname, '../office');

/**
 * Extraherar text från DOCX-fil med hjälp av mammoth
 */
async function extractDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value.trim().slice(0, 1000); // Begränsar till 1000 tecken
}

/**
 * Extraherar text från första kalkylbladet i en XLSX-fil
 */
function extractXlsx(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetNames = workbook.SheetNames;
  const firstSheet = workbook.Sheets[sheetNames[0]];
  const data = xlsx.utils.sheet_to_json(firstSheet, { header: 1 });
  return data.flat().slice(0, 20).join(' | '); // Tar de första 20 cellerna
}

/**
 * Extraherar text från alla slides i en PPTX-fil
 */
async function extractPptx(filePath) {
  const texts = [];
  const zip = fs.createReadStream(filePath).pipe(unzipper.Parse({ forceStream: true }));

  for await (const entry of zip) {
    // Identifierar XML-filer som innehåller slide-innehåll
    if (entry.path.startsWith('ppt/slides/slide') && entry.path.endsWith('.xml')) {
      const content = await entry.buffer();
      const parsed = await xml2js.parseStringPromise(content);

      // Navigerar till textinnehåll i varje form
      const shapes = parsed['p:sld']?.['p:cSld']?.[0]?.['p:spTree']?.[0]?.['p:sp'] || [];
      for (const shape of shapes) {
        const paragraphs = shape['p:txBody']?.[0]?.['a:p'] || [];
        for (const p of paragraphs) {
          const runs = p['a:r'] || [];
          for (const r of runs) {
            const text = r['a:t']?.[0];
            if (text) texts.push(text);
          }
        }
      }
    } else {
      entry.autodrain(); // Hoppar över irrelevanta filer
    }
  }

  return texts.join(' | ').slice(0, 1000); // Begränsar till 1000 tecken
}

/**
 * Huvudfunktion som kör extraktionen och sparar metadata i databasen
 */
async function run() {
  // Kontrollera att mappen med kontorsfiler finns
  if (!fs.existsSync(officeDir)) {
    console.error('Mappen "office" saknas.');
    process.exit(1);
  }

  // Läs in alla filer i mappen
  const files = fs.readdirSync(officeDir);

  // Skapa tabellen i databasen om den inte redan finns
  await pool.query(`
    CREATE TABLE IF NOT EXISTS office_metadata (
      filename TEXT,
      filetype TEXT,
      content_preview TEXT
    )
  `);

  // Loopar igenom varje fil
  for (let file of files) {
    try {
      const filePath = path.join(officeDir, file);
      const ext = path.extname(file).toLowerCase(); // Filändelse
      let preview = '';

      // Välj rätt extraktionsmetod beroende på filtyp
      if (ext === '.docx') {
        preview = await extractDocx(filePath);
      } else if (ext === '.xlsx') {
        preview = extractXlsx(filePath);
      } else if (ext === '.pptx') {
        preview = await extractPptx(filePath);
      } else {
        console.log(`Skippade ${file} – okänd filtyp`);
        continue;
      }

      // Spara metadata i databasen
      await pool.query(
        `INSERT INTO office_metadata (filename, filetype, content_preview) VALUES (?, ?, ?)`,
        [file, ext.slice(1), preview]
      );

      // Bekräftelse i terminalen
      console.log(`${file} sparad`);
    } catch (err) {
      // Felhantering vid misslyckad extraktion eller databasoperation
      console.error(`Fil ${file} kunde inte sparas:`, err.message);
    }
  }

  // Avslutar processen när alla filer är behandlade
  process.exit();
}

// Startar huvudfunktionen
run();