// Author: Jenny Hua
const path = require('path');

const PORT = Number(process.env.PORT) || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'comp307-booking-secret';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const STORE_PATH = path.join(__dirname, 'data', 'store.json');

module.exports = {
  PORT,
  JWT_SECRET,
  APP_URL,
  STORE_PATH,
};
