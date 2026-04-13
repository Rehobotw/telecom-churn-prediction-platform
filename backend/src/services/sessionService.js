const crypto = require('crypto');
const config = require('../config/config');

const sign = (value) => crypto.createHmac('sha256', config.AUTH_SECRET).update(value).digest('base64url');

const createSessionToken = (email) => {
  const payload = Buffer.from(
    JSON.stringify({
      sub: String(email).trim().toLowerCase(),
      exp: Date.now() + config.SESSION_TTL_MS,
    })
  ).toString('base64url');

  return `${payload}.${sign(payload)}`;
};

const verifySessionToken = (token) => {
  if (!token || !token.includes('.')) {
    return null;
  }

  const [payload, signature] = token.split('.');
  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);

  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!decoded?.sub || typeof decoded.exp !== 'number' || decoded.exp <= Date.now()) {
      return null;
    }
    return { email: String(decoded.sub).trim().toLowerCase(), expiresAt: decoded.exp };
  } catch {
    return null;
  }
};

module.exports = {
  createSessionToken,
  verifySessionToken,
};
