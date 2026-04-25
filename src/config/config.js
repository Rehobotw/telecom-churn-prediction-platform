require('dotenv').config();

const config = {
  PORT: process.env.PORT || 3000,
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:5000',
  CUSTOMERS_FILE: process.env.CUSTOMERS_FILE || './src/data/customers.json',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
};

module.exports = config;