require('dotenv').config();

const path = require('path');

const config = {
  PORT: Number(process.env.PORT) || 3000,
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  CUSTOMERS_FILE:
    process.env.CUSTOMERS_FILE || path.resolve(__dirname, '..', 'data', 'customers.json'),
  UPLOADS_DIR: process.env.UPLOADS_DIR || path.resolve(__dirname, '..', '..', 'uploads'),
  MAX_UPLOAD_SIZE_BYTES: Number(process.env.MAX_UPLOAD_SIZE_BYTES) || 10 * 1024 * 1024,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

module.exports = config;
