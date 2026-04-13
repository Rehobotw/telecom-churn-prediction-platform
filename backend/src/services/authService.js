const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const hashPassword = (password, salt) =>
  crypto.scryptSync(String(password), salt, 64).toString('hex');

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
  await writeAuthProfile(profile);
};

module.exports = {
  getPublicProfile,
  normalizeEmail,
  verifyCredentials,
  updateEmail,
  updatePassword,
};
