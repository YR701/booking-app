/* Author: Yongrong Yang */
const path = require('path');
const dotenv = require('../be/node_modules/dotenv');

dotenv.config({ path: path.join(__dirname, '../be/.env') });
dotenv.config();
const mysql = require('../be/node_modules/mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

module.exports = pool;
