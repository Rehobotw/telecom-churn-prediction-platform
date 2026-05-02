const authService = require('./authService');
const customerService = require('./customerService');
const emailService = require('./emailService');
const { renderTemplate } = require('./templateService');
const config = require('../config/config');

const formatPercent = (value) => `${(Number(value || 0) * 100).toFixed(1)}%`;

const uniqueEmails = (emails) => [...new Set(emails.map((value) => String(value).trim().toLowerCase()).filter(Boolean))];

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildTemplateValues = (values) =>
  Object.fromEntries(Object.entries(values).map(([key, value]) => [key, escapeHtml(value)]));

const getRecipients = async () => {
  const profile = await authService.getPublicProfile();
  const configured = profile.preferences?.notificationEmails || [];
  return uniqueEmails([...configured, profile.email]).filter(emailService.isValidEmail);
};

const sendAlertEmail = async (recipients, subject, values) => {
  const html = await renderTemplate('alert_notification.html', buildTemplateValues(values));
  const deliveries = await Promise.allSettled(
    recipients.map((recipient) => emailService.sendEmail(recipient, subject, html))
  );

  const delivered = [];
  const failed = [];

  deliveries.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      delivered.push(result.value.to);
      return;
    }

    failed.push({
      to: recipients[index],
      message: result.reason?.message || 'Unable to deliver email',
    });
  });

  return { delivered, failed };
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

  const result = await sendAlertEmail(recipients, 'High Risk Churn Alert', {
    alert_title: 'High Risk Churn Alert',
    alert_summary: 'A customer has crossed the configured churn-risk threshold and should be reviewed by the retention team.',
    alert_badge: 'High priority',
    customer_name: prediction.name || prediction.customerName || prediction.email || 'Unknown',
    risk_level: prediction.riskLevel || 'High',
    churn_probability: formatPercent(probability),
    prediction: prediction.churnPrediction || prediction.prediction ? 'Likely to churn' : 'Not likely to churn',
    generated_at: new Date(prediction.predictionDate || Date.now()).toLocaleString(),
    action_text: 'Recommended action: review account history, contact the customer, and prepare a targeted retention offer.',
  });

  if (result.delivered.length === 0 && result.failed.length > 0) {
    const error = new Error(result.failed[0].message);
    error.status = 502;
    throw error;
  }

  return result;
};

const sendManualAlert = async ({ toEmail, subject, message } = {}) => {
  const profile = await authService.getPublicProfile();
  const recipients = toEmail
    ? uniqueEmails([toEmail]).filter(emailService.isValidEmail)
    : await getRecipients();

  if (recipients.length === 0) {
    const error = new Error('Add a valid notification recipient before sending an alert');
    error.status = 400;
    throw error;
  }

  const result = await sendAlertEmail(
    recipients,
    subject || 'Churn Insights Notification Alert',
    {
      alert_title: 'Churn Insights Notification',
      alert_summary: message || 'A platform notification was sent from Churn Insights.',
      alert_badge: 'Notification',
      customer_name: 'General notification',
      risk_level: 'Informational',
      churn_probability: 'N/A',
      prediction: 'Review requested',
      generated_at: new Date().toLocaleString(),
      action_text: 'Please review this notification and take any required follow-up action.',
    }
  );

  if (result.delivered.length === 0) {
    const error = new Error(result.failed[0]?.message || 'Unable to deliver notification alert');
    error.status = 502;
    throw error;
  }

  return {
    ...result,
    requestedBy: profile.email,
  };
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

const sendPredictionSummary = async (results, predictionType, subject = 'Churn Prediction Summary') => {
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
      emailService.sendEmail(recipient, subject, html)
    )
  );
};

const sendDailyReport = async () => {
  const customers = await customerService.getCustomers();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todaysPredictions = customers.filter((item) => {
    const predictionTime = Date.parse(item.predictionDate || '');
    return Number.isFinite(predictionTime) && predictionTime >= startOfDay.getTime();
  });

  await sendPredictionSummary(todaysPredictions, 'Daily report', 'Churn Insights Daily Report');
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
  sendDailyReport,
  notifySinglePrediction,
  notifyBatchPrediction,
  sendManualAlert,
};
