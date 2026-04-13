const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

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
    expiresAt: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
  };
};

const generateResetCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');

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
      },
      null,
      2
    )
  );
};

const getPublicProfile = async () => {
  const profile = await readAuthProfile();
  return { email: profile.email };
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
  profile.passwordReset = null;
  await writeAuthProfile(profile);
  return { email: profile.email };
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

const requestPasswordReset = async (email) => {
  const profile = await readAuthProfile();
  const normalizedEmail = normalizeEmail(email);

  if (normalizedEmail !== profile.email) {
    const error = new Error('No account found for that email address');
    error.status = 404;
    throw error;
  }

  const code = generateResetCode();
  profile.passwordReset = createResetRecord(code);
  await writeAuthProfile(profile);

  return {
    email: profile.email,
    resetCode: code,
    expiresAt: profile.passwordReset.expiresAt,
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
  getPublicProfile,
  normalizeEmail,
  requestPasswordReset,
  resetPassword,
  verifyCredentials,
  updateEmail,
  updatePassword,
};
