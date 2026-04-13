const config = require('../config/config');
const { verifySessionToken } = require('../services/sessionService');

const parseCookies = (cookieHeader = '') =>
  cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const separatorIndex = part.indexOf('=');
      if (separatorIndex === -1) {
        return cookies;
      }
      const name = part.slice(0, separatorIndex).trim();
      const value = decodeURIComponent(part.slice(separatorIndex + 1).trim());
      cookies[name] = value;
      return cookies;
    }, {});

const attachAuth = (req, res, next) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[config.SESSION_COOKIE_NAME];
  const session = verifySessionToken(token);
  req.auth = session;
  next();
};

const requireAuth = (req, res, next) => {
  if (!req.auth?.email) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  next();
};

module.exports = {
  attachAuth,
  requireAuth,
};
