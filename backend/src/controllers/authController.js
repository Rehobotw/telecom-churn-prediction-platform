const authService = require('../services/authService');
const emailService = require('../services/emailService');
const notificationService = require('../services/notificationService');

const getPreferences = async (req, res, next) => {
  try {
    const preferences = await authService.getPreferences();
    res.json({
      success: true,
      data: preferences,
    });
  } catch (err) {
    next(err);
  }
};

const updatePreferences = async (req, res, next) => {
  try {
    const preferences = await authService.updatePreferences(req.body || {});
    res.json({
      success: true,
      data: preferences,
      message: 'Notification settings updated',
    });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const preferences = await authService.getPreferences();
    res.json({
      success: true,
      data: {
        authenticated: false,
        profile: {
          email: '',
          preferences,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

const sendTestEmail = async (req, res, next) => {
  try {
    const { toEmail, subject } = req.body || {};
    const recipient = typeof toEmail === 'string' && toEmail.trim() ? toEmail.trim().toLowerCase() : undefined;
    if (!recipient || !emailService.isValidEmail(recipient)) {
      return res.status(400).json({ success: false, message: 'Enter a valid recipient email address' });
    }

    await emailService.sendEmail(
      recipient,
      typeof subject === 'string' && subject.trim() ? subject.trim() : 'Churn Insights SMTP Test',
      '<p>This is a test email from Churn Insights SMTP integration.</p>'
    );

    res.json({
      success: true,
      data: {
        toEmail: recipient,
      },
      message: 'Test email delivered successfully',
    });
  } catch (err) {
    next(err);
  }
};

const sendNotificationAlert = async (req, res, next) => {
  try {
    const { toEmail, subject, message } = req.body || {};
    const normalizedToEmail =
      typeof toEmail === 'string' && toEmail.trim()
        ? toEmail.trim().toLowerCase()
        : undefined;

    if (normalizedToEmail && !emailService.isValidEmail(normalizedToEmail)) {
      return res.status(400).json({ success: false, message: 'Enter a valid recipient email address' });
    }

    const result = await notificationService.sendManualAlert({
      toEmail: normalizedToEmail,
      subject: typeof subject === 'string' && subject.trim() ? subject.trim() : undefined,
      message: typeof message === 'string' && message.trim() ? message.trim() : undefined,
    });

    res.json({
      success: true,
      data: result,
      message: 'Notification alert delivered successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPreferences,
  updatePreferences,
  sendNotificationAlert,
  sendTestEmail,
  me,
};

