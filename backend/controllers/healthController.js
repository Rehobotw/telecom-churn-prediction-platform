function healthCheck(req, res) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'telecom-churn-backend',
  });
}

module.exports = {
  healthCheck,
};

