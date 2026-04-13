const mlService = require('../services/mlService');
const customerService = require('../services/customerService');

const toCamelTrend = (trend = []) =>
  trend.map((item) => ({
    month: item.month || item.period || '',
    churnRate: Number(item.churnRate ?? item.churn_rate ?? 0),
    retentionRate:
      item.retentionRate !== undefined
        ? Number(item.retentionRate)
        : 1 - Number(item.churnRate ?? item.churn_rate ?? 0),
  }));

const cleanFeatureName = (feature = '') =>
  String(feature)
    .replace(/^num__/, '')
    .replace(/^cat__/, '')
    .replace(/\.0$/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ');

const formatModelType = (value) =>
  String(value || '')
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getAnalytics = async (req, res, next) => {
  try {
    const analytics = await mlService.getAnalytics();
    const customers = await customerService.getCustomers();
    const recentPredictions = [...customers]
      .sort(
        (a, b) =>
          new Date(b.predictionDate || 0).getTime() - new Date(a.predictionDate || 0).getTime()
      )
      .slice(0, 5);
    const today = new Date().toISOString().slice(0, 10);
    const predictionsToday = customers.filter((customer) =>
      String(customer.predictionDate || '').startsWith(today)
    ).length;

    res.json({
      success: true,
      data: {
        totalCustomers: Number(analytics.total_customers ?? 0),
        churnRate: Number(analytics.churn_rate ?? 0),
        retentionRate: Number(analytics.retention_rate ?? 0),
        predictionsToday,
        modelType: formatModelType(analytics.selected_model),
        trendData: toCamelTrend(analytics.trend),
        featureImportance: (analytics.feature_importance || []).slice(0, 8).map((item) => ({
          feature: cleanFeatureName(item.feature),
          importance: Number(item.importance ?? 0),
        })),
        recentPredictions,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnalytics,
};
