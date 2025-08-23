// connection.js
// Skapar MySQL-anslutning via dotenv

const mysql = require("mysql2");
require("dotenv").config(); // Läser in .env-filen

// Connection pool för att hantera flera queries effektivt
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectionLimit: 10, // Hanterar flera samtidiga queries
});

module.exports = pool.promise();
