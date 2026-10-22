const attachAuth = (req, res, next) => {
  next();
};

const requireAuth = (req, res, next) => {
  next();
};

module.exports = {
  attachAuth,
  requireAuth,
};

