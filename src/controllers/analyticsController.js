const mlService = require('../services/mlService');

const getAnalytics = async (req, res, next) => {
  try {
    const analytics = await mlService.getAnalytics();

    res.json({
      success: true,
      data: analytics,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnalytics,
};