import fs from 'fs';
import pool from '../../database/connection.js';
import * as musicMetadata from 'music-metadata';

const files = fs.readdirSync('music');

await pool.query(
    `CREATE TABLE IF NOT EXISTS music_metadata 
    (filename TEXT,
     artist TEXT, 
     title TEXT, 
     year YEAR, 
     label TEXT, 
     duration FLOAT, 
     bitrate INT,
     filetype TEXT)`
)

for (let file of files) {
    try {

  let metadata = await musicMetadata.parseFile('./music/' + file)


  await pool.query(
    `INSERT INTO music_metadata (filename, artist, title, year, label, duration, bitrate, filetype) VALUES (?,?,?,?,?,?,?,?)`,
     [
        file,
        metadata.common.artist || null,
        metadata.common.title || null,
        metadata.common.year || null,
        metadata.common.label || null,
        metadata.format.duration || null,
        metadata.format.bitrate || null,
        file.split(".").pop(),
     ]
  );
    console.log(file + 'Saved')
    } catch (err) {
        console.error(`File ${file}: not saved`, err.message)
    }
}

process.exit();