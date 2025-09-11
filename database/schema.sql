-- Skapar tabellen för att lagra filinformation och metadata
CREATE TABLE image_metadata (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  make VARCHAR(255),
  model VARCHAR(255),
  software VARCHAR(255),
  modify_date DATETIME,
  date_original DATETIME,
  create_date DATETIME,
  exposure_time VARCHAR(50),
  f_number FLOAT,
  iso INT,
  focal_length FLOAT,
  focal_length_35mm FLOAT,
  lens_make VARCHAR(255),
  lens_model VARCHAR(255),
  gps_latitude DOUBLE,
  gps_longitude DOUBLE,
  gps_altitude DOUBLE,
  gps_direction DOUBLE,
  gps_speed DOUBLE,
  image_width INT,
  image_height INT,
  filetype VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pdf_metadata (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(1024) NOT NULL,
  stored_name VARCHAR(1024) NOT NULL,
  title VARCHAR(512),
  author VARCHAR(512),
  creation_date DATE,
  content_preview TEXT,
  text_content LONGTEXT,
  filetype VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS music_metadata (
      filename TEXT,
      artist TEXT,
      title TEXT,
      year YEAR,
      label TEXT,
      duration FLOAT,
      bitrate INT,
      filetype TEXT
    );

CREATE TABLE IF NOT EXISTS office_metadata (
      filename TEXT,
      filetype TEXT,
      content_preview TEXT
    );
