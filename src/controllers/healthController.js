const getHealth = (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'telecom-churn-backend',
      timestamp: new Date().toISOString(),
    },
  });
};

module.exports = {
  getHealth,
};