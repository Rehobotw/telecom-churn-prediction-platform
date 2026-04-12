require('dotenv').config();

const config = {
  PORT: process.env.PORT || 3000,
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  CUSTOMERS_FILE: process.env.CUSTOMERS_FILE || './src/data/customers.json',
  // CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

module.exports = config;