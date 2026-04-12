const mlService = require('../services/mlService');

const getMetrics = async (req, res, next) => {
  try {
    const metrics = await mlService.getMetrics();

    res.json({
      success: true,
      data: metrics,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMetrics,
};