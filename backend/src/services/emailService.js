const nodemailer = require('nodemailer');
const config = require('../config/config');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let transporter;

const getFromAddress = () => config.EMAIL_FROM || config.EMAIL_USERNAME || config.ADMIN_EMAIL;

const isEmailConfigured = () =>
  Boolean(
    config.EMAIL_HOST &&
      config.EMAIL_PORT &&
      getFromAddress()
  );

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const secure = typeof config.EMAIL_SECURE === 'boolean'
    ? config.EMAIL_SECURE
    : config.EMAIL_PORT === 465;

  transporter = nodemailer.createTransport({
    host: config.EMAIL_HOST,
    port: config.EMAIL_PORT,
    secure,
    ...(config.EMAIL_USERNAME && config.EMAIL_PASSWORD
      ? {
          auth: {
            user: config.EMAIL_USERNAME,
            pass: config.EMAIL_PASSWORD,
          },
        }
      : {}),
    requireTLS: !secure,
    tls: {
      rejectUnauthorized: config.EMAIL_TLS_REJECT_UNAUTHORIZED !== 'false',
    },
  });

  return transporter;
};

const isValidEmail = (email) => EMAIL_REGEX.test(String(email || '').trim().toLowerCase());

const sendEmail = async (toEmail, subject, htmlContent) => {
  const normalizedTo = String(toEmail || '').trim().toLowerCase();

  if (!isValidEmail(normalizedTo)) {
    const error = new Error('Invalid recipient email address');
    error.status = 400;
    throw error;
  }

  if (!isEmailConfigured()) {
    const error = new Error('Email delivery is not configured on this server');
    error.status = 503;
    throw error;
  }

  const fromAddress = getFromAddress();

  const maxAttempts = Math.max(1, Number(config.EMAIL_RETRY_ATTEMPTS) || 1);
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await getTransporter().sendMail({
        from: fromAddress,
        to: normalizedTo,
        subject,
        html: htmlContent,
      });
      console.info(`[email] sent to ${normalizedTo} (attempt ${attempt}/${maxAttempts})`);
      return { delivered: true, to: normalizedTo };
    } catch (err) {
      lastError = err;
      console.error(`[email] send failed to ${normalizedTo} (attempt ${attempt}/${maxAttempts})`, err?.message || err);
    }
  }

  const error = new Error('Unable to deliver email at this time');
  error.status = 502;
  error.cause = lastError;
  throw error;
};

module.exports = {
  isEmailConfigured,
  isValidEmail,
  sendEmail,
  send_email: sendEmail,
};
