const authService = require('../services/authService');
const config = require('../config/config');
const { createSessionToken } = require('../services/sessionService');
const emailService = require('../services/emailService');

const baseSessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.COOKIE_SECURE,
  path: '/',
};

const setSessionCookie = (res, email, rememberMe = false) => {
  const maxAge = rememberMe ? config.REMEMBER_ME_TTL_MS : undefined;
  res.cookie(
    config.SESSION_COOKIE_NAME,
    createSessionToken(email, maxAge ?? config.SESSION_TTL_MS),
    {
      ...baseSessionCookieOptions,
      ...(maxAge ? { maxAge } : {}),
    }
  );
};

const clearSessionCookie = (res) => {
  res.clearCookie(config.SESSION_COOKIE_NAME, {
    ...baseSessionCookieOptions,
    maxAge: undefined,
  });
};

const login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const valid = await authService.verifyCredentials(email, password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const normalizedEmail = authService.normalizeEmail(email);
    setSessionCookie(res, normalizedEmail, Boolean(rememberMe));
    res.json({
      success: true,
      data: {
        email: normalizedEmail,
        rememberMe: Boolean(rememberMe),
      },
    });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const profile = await authService.getPublicProfile();
    res.json({
      success: true,
      data: {
        authenticated: true,
        email: req.auth.email,
        profile,
      },
    });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    clearSessionCookie(res);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

const updateEmail = async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const normalizedEmail = authService.normalizeEmail(email);
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    if (!isValidEmail) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address' });
    }

    const updated = await authService.updateEmail(normalizedEmail);
    setSessionCookie(res, updated.email);
    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (
      typeof currentPassword !== 'string' ||
      typeof newPassword !== 'string' ||
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }

    await authService.updatePassword(currentPassword, newPassword);
    setSessionCookie(res, req.auth.email);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const normalizedEmail = authService.normalizeEmail(email);
    const isValidEmail = emailService.isValidEmail(normalizedEmail);
    if (!isValidEmail) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address' });
    }

    const reset = await authService.requestPasswordReset(normalizedEmail, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || 'unknown',
    });
    res.json({
      success: true,
      data: reset,
      message: 'If the account exists, a reset code has been sent by email',
    });
  } catch (err) {
    console.error('[auth] forgot-password email delivery failed:', err?.message || err);
    return res.json({
      success: true,
      data: { email: authService.normalizeEmail(req.body?.email || '') },
      message: 'If the account exists, a reset code has been sent by email',
    });
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

const sendTestEmail = async (req, res, next) => {
  try {
    const { toEmail, subject } = req.body || {};
    const recipient = typeof toEmail === 'string' && toEmail.trim() ? toEmail.trim().toLowerCase() : req.auth.email;
    if (!emailService.isValidEmail(recipient)) {
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

const resetPassword = async (req, res, next) => {
  try {
    const { email, resetCode, newPassword } = req.body || {};
    if (
      typeof email !== 'string' ||
      !email.trim() ||
      typeof resetCode !== 'string' ||
      !resetCode.trim() ||
      typeof newPassword !== 'string' ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message: 'Email, reset code, and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }

    const updated = await authService.resetPassword(email, resetCode.trim(), newPassword);
    clearSessionCookie(res);
    res.json({
      success: true,
      data: updated,
      message: 'Password updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  logout,
  me,
  requestPasswordReset,
  resetPassword,
  sendTestEmail,
  updateEmail,
  updatePreferences,
  updatePassword,
};
