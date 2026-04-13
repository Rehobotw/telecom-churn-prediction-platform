require('dotenv').config();

const crypto = require('crypto');
const path = require('path');

const parseList = (value, fallback) =>
  (value || fallback)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const config = {
  PORT: Number(process.env.PORT) || 3000,
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  CUSTOMERS_FILE:
    process.env.CUSTOMERS_FILE || path.resolve(__dirname, '..', 'data', 'customers.json'),
  AUTH_FILE: process.env.AUTH_FILE || path.resolve(__dirname, '..', 'data', 'auth.json'),
  UPLOADS_DIR: process.env.UPLOADS_DIR || path.resolve(__dirname, '..', '..', 'uploads'),
  MAX_UPLOAD_SIZE_BYTES: Number(process.env.MAX_UPLOAD_SIZE_BYTES) || 10 * 1024 * 1024,
  CORS_ORIGINS: parseList(process.env.CORS_ORIGIN, 'http://localhost:5173,http://localhost'),
  ADMIN_EMAIL: (process.env.ADMIN_EMAIL || 'admin@gmail.com').trim().toLowerCase(),
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
  AUTH_SECRET: process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex'),
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME || 'churn_session',
  SESSION_TTL_MS: Number(process.env.SESSION_TTL_MS) || 1000 * 60 * 60 * 8,
  REMEMBER_ME_TTL_MS: Number(process.env.REMEMBER_ME_TTL_MS) || 1000 * 60 * 60 * 24 * 30,
  COOKIE_SECURE: process.env.COOKIE_SECURE === 'true',
  EMAIL_HOST: process.env.EMAIL_HOST || '',
  EMAIL_PORT: Number(process.env.EMAIL_PORT) || 587,
  EMAIL_USERNAME: process.env.EMAIL_USERNAME || '',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || '',
  EMAIL_FROM: process.env.EMAIL_FROM || '',
  EMAIL_RETRY_ATTEMPTS: Number(process.env.EMAIL_RETRY_ATTEMPTS) || 2,
  RESET_CODE_TTL_MINUTES: Number(process.env.RESET_CODE_TTL_MINUTES) || 15,
  RESET_REQUEST_WINDOW_MS: Number(process.env.RESET_REQUEST_WINDOW_MS) || 15 * 60 * 1000,
  RESET_REQUEST_MAX_ATTEMPTS: Number(process.env.RESET_REQUEST_MAX_ATTEMPTS) || 5,
  HIGH_RISK_THRESHOLD: Number(process.env.HIGH_RISK_THRESHOLD) || 0.67,
};

module.exports = config;
