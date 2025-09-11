# Metadata-sökning – Backend & Frontend  
**Grupp 4** (Hanna, Carl, Valmir & Omid)

## Projektbeskrivning

Detta projekt är ett komplett system för att ladda upp filer, extrahera metadata och söka i en databas baserat på filinformation. Systemet består av en backend (Node.js + Express + MySQL) och en enkel frontend (HTML + JavaScript).

## Syfte

Projektet är utvecklat för att:

- Extrahera metadata från olika filtyper: bilder, PDF, ljudfiler och Office-dokument
- Spara metadata i en MySQL-databas
- Möjliggöra sökning baserat på filtyp, namn, datum, geografisk plats m.m.
- Visa sökresultat i ett webbaserat gränssnitt med kartstöd

## Teknikstack

| Del       | Tekniker                                                                 |
|-----------|--------------------------------------------------------------------------|
| Backend   | Node.js, Express, MySQL                                                  |
| Metadata  | exifr, exiftool-vendored, pdfjs-dist, pdf-parse, music-metadata, mammoth, xlsx, pptx-parser, unzipper, xml2js |
| Frontend  | HTML, JavaScript (vanilla), Leaflet.js                                   |
| Databas   | MySQL                                                                    |

## Installation

### 1. Klona projektet
git clone https://github.com/ditt-användarnamn/metadata.git
cd metadata

### 2. Installera beroenden
npm install

### 3. Skapa en .env-fil i projektets rot

### 4. Skapa databas och tabeller
Använd connection.js och kör extraktorskript för att skapa och fylla tabellerna

### 5. Starta server med node server.js

# Metadata-extraktion

Projektet använder följande bibliotek för att extrahera metadata från olika filtyper:

| Filtyp         | Bibliotek                                                                 |
|----------------|---------------------------------------------------------------------------|
| Bilder         | `exifr`, `exiftool-vendored`                                              |
| PDF            | `pdfjs-dist`, `pdf-parse`                                                 |
| Ljudfiler      | `music-metadata`                                                          |
| Office-dokument| `mammoth`, `xlsx`, `pptx-parser`, `unzipper`, `xml2js`                    |
| Bildgenerering | `canvas`                                                                  |
