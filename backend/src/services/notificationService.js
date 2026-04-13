const authService = require('./authService');
const emailService = require('./emailService');
const { renderTemplate } = require('./templateService');
const config = require('../config/config');

const formatPercent = (value) => `${(Number(value || 0) * 100).toFixed(1)}%`;

const uniqueEmails = (emails) => [...new Set(emails.map((value) => String(value).trim().toLowerCase()).filter(Boolean))];

const getRecipients = async () => {
  const profile = await authService.getPublicProfile();
  const configured = profile.preferences?.notificationEmails || [];
  const fallback = profile.email ? [profile.email] : [];
  return uniqueEmails([...configured, ...fallback]).filter(emailService.isValidEmail);
};

const sendHighRiskAlert = async (prediction) => {
  const profile = await authService.getPublicProfile();
  if (!profile.preferences?.highRiskAlerts) {
    return;
  }

  const probability = Number(prediction.churnProbability ?? prediction.probability ?? 0);
  if (prediction.riskLevel !== 'High' && probability < config.HIGH_RISK_THRESHOLD) {
    return;
  }

  const recipients = await getRecipients();
  if (recipients.length === 0) {
    return;
  }

  const html = await renderTemplate('alert_notification.html', {
    customer_name: prediction.name || prediction.customerName || prediction.email || 'Unknown',
    risk_level: prediction.riskLevel || 'High',
    churn_probability: formatPercent(probability),
    prediction: prediction.churnPrediction || prediction.prediction ? 'Will Churn' : 'Will Not Churn',
    generated_at: new Date(prediction.predictionDate || Date.now()).toLocaleString(),
  });

  await Promise.allSettled(
    recipients.map((recipient) =>
      emailService.sendEmail(recipient, 'High Risk Churn Alert', html)
    )
  );
};

const summarizeResults = (results) => {
  const totalCount = results.length;
  const highCount = results.filter((item) => item.riskLevel === 'High').length;
  const mediumCount = results.filter((item) => item.riskLevel === 'Medium').length;
  const lowCount = results.filter((item) => item.riskLevel === 'Low').length;
  const avgProbability =
    totalCount > 0
      ? results.reduce((sum, item) => sum + Number(item.churnProbability ?? item.probability ?? 0), 0) / totalCount
      : 0;

  return {
    totalCount,
    highCount,
    mediumCount,
    lowCount,
    avgProbability,
  };
};

const sendPredictionSummary = async (results, predictionType) => {
  const profile = await authService.getPublicProfile();
  if (!profile.preferences?.dailyReports) {
    return;
  }

  const recipients = await getRecipients();
  if (recipients.length === 0) {
    return;
  }

  const summary = summarizeResults(results);
  const html = await renderTemplate('prediction_summary.html', {
    prediction_type: predictionType,
    generated_at: new Date().toLocaleString(),
    total_count: summary.totalCount,
    high_count: summary.highCount,
    medium_count: summary.mediumCount,
    low_count: summary.lowCount,
    average_probability: formatPercent(summary.avgProbability),
  });

  await Promise.allSettled(
    recipients.map((recipient) =>
      emailService.sendEmail(recipient, 'Churn Prediction Summary', html)
    )
  );
};

const notifySinglePrediction = async (prediction) => {
  await Promise.allSettled([
    sendHighRiskAlert(prediction),
    sendPredictionSummary([prediction], 'Single prediction'),
  ]);
};

const notifyBatchPrediction = async (predictions) => {
  const highRiskRows = predictions.filter((item) => item.riskLevel === 'High');

  await Promise.allSettled([
    ...highRiskRows.map((prediction) => sendHighRiskAlert(prediction)),
    sendPredictionSummary(predictions, 'Batch prediction'),
  ]);
};

module.exports = {
  notifySinglePrediction,
  notifyBatchPrediction,
};
