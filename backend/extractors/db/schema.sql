-- schema.sql
-- Skapar tabell för metadata
CREATE DATABASE IF NOT EXISTS metadata_db;
USE metadata_db;

DROP TABLE IF EXISTS metadata;

CREATE TABLE metadata (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fileName VARCHAR(255),
  fileType VARCHAR(50),
  data LONGBLOB NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  date DATETIME,
  author VARCHAR(255),
  title VARCHAR(255),
  artist VARCHAR(255),
  contentPreview TEXT,
  FULLTEXT(title, author, contentPreview), -- För bättre sökningar
  SPATIAL INDEX(lat_lon_idx (latitude, longitude))
);
