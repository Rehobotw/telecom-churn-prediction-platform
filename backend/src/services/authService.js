const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');
const { renderTemplate } = require('./templateService');
const emailService = require('./emailService');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const resetRequestTracker = new Map();

const DEFAULT_PREFERENCES = {
  highRiskAlerts: true,
  dailyReports: false,
  notificationEmails: [],
  autoRetrain: 'Monthly',
};

const hashPassword = (password, salt) =>
  crypto.scryptSync(String(password), salt, 64).toString('hex');

const hashSecret = (value, salt) =>
  crypto.scryptSync(String(value), salt, 64).toString('hex');

const createPasswordRecord = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  return {
    salt,
    hash: hashPassword(password, salt),
  };
};

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const createResetRecord = (code) => {
  const salt = crypto.randomBytes(16).toString('hex');
  return {
    salt,
    hash: hashSecret(code, salt),
    expiresAt: new Date(Date.now() + 1000 * 60 * config.RESET_CODE_TTL_MINUTES).toISOString(),
  };
};

const generateResetCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');

const buildResetLink = (email, code) => {
  try {
    const resetUrl = new URL(config.RESET_LINK_PATH, config.FRONTEND_BASE_URL);
    resetUrl.searchParams.set('resetEmail', normalizeEmail(email));
    resetUrl.searchParams.set('resetCode', code);
    return resetUrl.toString();
  } catch {
    const params = new URLSearchParams({
      resetEmail: normalizeEmail(email),
      resetCode: code,
    });
    return `${config.RESET_LINK_PATH || '/login'}?${params.toString()}`;
  }
};

const sanitizeNotificationEmails = (emails = []) =>
  [...new Set((Array.isArray(emails) ? emails : [])
    .map((email) => normalizeEmail(email))
    .filter((email) => EMAIL_REGEX.test(email)))];

const buildPreferences = (preferences) => ({
  highRiskAlerts:
    typeof preferences?.highRiskAlerts === 'boolean'
      ? preferences.highRiskAlerts
      : DEFAULT_PREFERENCES.highRiskAlerts,
  dailyReports:
    typeof preferences?.dailyReports === 'boolean'
      ? preferences.dailyReports
      : DEFAULT_PREFERENCES.dailyReports,
  notificationEmails: (() => {
    const sanitized = sanitizeNotificationEmails(preferences?.notificationEmails);
    return sanitized;
  })(),
  autoRetrain:
    typeof preferences?.autoRetrain === 'string' && preferences.autoRetrain.trim()
      ? preferences.autoRetrain
      : DEFAULT_PREFERENCES.autoRetrain,
});

const consumeResetQuota = (email, ipAddress = 'unknown') => {
  const key = `${normalizeEmail(email)}:${String(ipAddress)}`;
  const now = Date.now();
  const windowStart = now - config.RESET_REQUEST_WINDOW_MS;
  const history = (resetRequestTracker.get(key) || []).filter((timestamp) => timestamp >= windowStart);

  if (history.length >= config.RESET_REQUEST_MAX_ATTEMPTS) {
    const error = new Error('Too many reset requests. Please try again later.');
    error.status = 429;
    throw error;
  }

  history.push(now);
  resetRequestTracker.set(key, history);
};

const ensureAuthFile = async () => {
  try {
    await fs.access(config.AUTH_FILE);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }

    const defaultProfile = {
      email: config.ADMIN_EMAIL,
      password: createPasswordRecord(config.ADMIN_PASSWORD),
      passwordReset: null,
      preferences: buildPreferences(DEFAULT_PREFERENCES),
    };

    await fs.mkdir(path.dirname(config.AUTH_FILE), { recursive: true });
    await fs.writeFile(config.AUTH_FILE, JSON.stringify(defaultProfile, null, 2));
  }
};

const readAuthProfile = async () => {
  await ensureAuthFile();
  const raw = await fs.readFile(config.AUTH_FILE, 'utf8');
  const profile = JSON.parse(raw);

  if (
    !profile ||
    typeof profile.email !== 'string' ||
    !profile.password ||
    typeof profile.password.salt !== 'string' ||
    typeof profile.password.hash !== 'string'
  ) {
    throw new Error('Stored auth profile is invalid');
  }

  return {
    email: normalizeEmail(profile.email),
    password: profile.password,
    passwordReset:
      profile.passwordReset &&
      typeof profile.passwordReset.salt === 'string' &&
      typeof profile.passwordReset.hash === 'string' &&
      typeof profile.passwordReset.expiresAt === 'string'
        ? profile.passwordReset
        : null,
    preferences: buildPreferences(profile.preferences),
  };
};

const writeAuthProfile = async (profile) => {
  await fs.mkdir(path.dirname(config.AUTH_FILE), { recursive: true });
  await fs.writeFile(
    config.AUTH_FILE,
    JSON.stringify(
      {
        email: normalizeEmail(profile.email),
        password: profile.password,
        passwordReset: profile.passwordReset ?? null,
        preferences: buildPreferences(profile.preferences),
      },
      null,
      2
    )
  );
};

const getPublicProfile = async () => {
  const profile = await readAuthProfile();
  return {
    email: profile.email,
    preferences: profile.preferences,
  };
};

const verifyCredentials = async (email, password) => {
  const profile = await readAuthProfile();
  if (normalizeEmail(email) !== profile.email) {
    return false;
  }

  const candidateHash = hashPassword(password, profile.password.salt);
  return safeEqual(candidateHash, profile.password.hash);
};

const updateEmail = async (nextEmail) => {
  const profile = await readAuthProfile();
  profile.email = normalizeEmail(nextEmail);
  profile.preferences = buildPreferences(profile.preferences);
  profile.passwordReset = null;
  await writeAuthProfile(profile);
  return { email: profile.email };
};

const updatePreferences = async (nextPreferences) => {
  const profile = await readAuthProfile();
  const merged = {
    ...profile.preferences,
    ...(nextPreferences || {}),
  };

  profile.preferences = buildPreferences(merged);
  await writeAuthProfile(profile);

  return profile.preferences;
};

const updatePassword = async (currentPassword, nextPassword) => {
  const profile = await readAuthProfile();
  const currentHash = hashPassword(currentPassword, profile.password.salt);
  if (!safeEqual(currentHash, profile.password.hash)) {
    const error = new Error('Current password is incorrect');
    error.status = 400;
    throw error;
  }

  profile.password = createPasswordRecord(nextPassword);
  profile.passwordReset = null;
  await writeAuthProfile(profile);
};

const requestPasswordReset = async (email, metadata = {}) => {
  consumeResetQuota(email, metadata.ipAddress);

  const profile = await readAuthProfile();
  const normalizedEmail = normalizeEmail(email);

  if (normalizedEmail !== profile.email) {
    return {
      email: normalizedEmail,
    };
  }

  const code = generateResetCode();
  profile.passwordReset = createResetRecord(code);
  await writeAuthProfile(profile);

  const html = await renderTemplate('password_reset.html', {
    reset_code: code,
    reset_link: buildResetLink(profile.email, code),
    expiry_minutes: config.RESET_CODE_TTL_MINUTES,
  });

  try {
    await emailService.sendEmail(
      profile.email,
      'Your Churn Insights Password Reset Code',
      html
    );
  } catch (err) {
    if (config.EXPOSE_RESET_CODE_IN_RESPONSE) {
      return {
        email: profile.email,
        delivery: 'fallback',
        resetCode: code,
      };
    }

    profile.passwordReset = null;
    await writeAuthProfile(profile);

    const error = new Error(
      err.status === 503
        ? 'Email delivery is not configured. Please configure SMTP before sending reset codes.'
        : err.message || 'Unable to send reset email. Please make sure SMTP is configured correctly.'
    );
    error.status = err.status || 502;
    error.expose = true;
    throw error;
  }

  return {
    email: profile.email,
    delivery: 'email',
  };
};

const resetPassword = async (email, resetCode, nextPassword) => {
  const profile = await readAuthProfile();
  const normalizedEmail = normalizeEmail(email);

  if (normalizedEmail !== profile.email) {
    const error = new Error('Invalid reset request');
    error.status = 400;
    throw error;
  }

  if (!profile.passwordReset) {
    const error = new Error('No active password reset request was found');
    error.status = 400;
    throw error;
  }

  if (Date.parse(profile.passwordReset.expiresAt) <= Date.now()) {
    profile.passwordReset = null;
    await writeAuthProfile(profile);
    const error = new Error('Reset code has expired. Request a new code and try again');
    error.status = 400;
    throw error;
  }

  const candidateHash = hashSecret(resetCode, profile.passwordReset.salt);
  if (!safeEqual(candidateHash, profile.passwordReset.hash)) {
    const error = new Error('Invalid reset code');
    error.status = 400;
    throw error;
  }

  profile.password = createPasswordRecord(nextPassword);
  profile.passwordReset = null;
  await writeAuthProfile(profile);

  return { email: profile.email };
};

module.exports = {
  DEFAULT_PREFERENCES,
  getPublicProfile,
  normalizeEmail,
  requestPasswordReset,
  resetPassword,
  updatePreferences,
  verifyCredentials,
  updateEmail,
  updatePassword,
};
