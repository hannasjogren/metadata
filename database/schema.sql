-- Skapar tabellen för att lagra filinformation och metadata
CREATE TABLE IF NOT EXISTS files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL UNIQUE,
  filepath TEXT,
  filetype VARCHAR(50),
  metadata JSON,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
