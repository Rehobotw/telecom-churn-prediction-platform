const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT_PREFERENCES = {
  highRiskAlerts: true,
  dailyReports: false,
  notificationEmails: [],
  autoRetrain: 'Monthly',
};

const sanitizeNotificationEmails = (emails = []) =>
  [...new Set((Array.isArray(emails) ? emails : [])
    .map((email) => normalizeEmail(email))
    .filter((email) => EMAIL_REGEX.test(email)))];

const buildPreferences = (preferences) => ({
  highRiskAlerts:
    typeof preferences?.highRiskAlerts === 'boolean'
      ? preferences.highRiskAlerts
      : DEFAULT_PREFERENCES.highRiskAlerts,
  dailyReports:
    typeof preferences?.dailyReports === 'boolean'
      ? preferences.dailyReports
      : DEFAULT_PREFERENCES.dailyReports,
  notificationEmails: sanitizeNotificationEmails(preferences?.notificationEmails),
  autoRetrain:
    typeof preferences?.autoRetrain === 'string' && preferences.autoRetrain.trim()
      ? preferences.autoRetrain
      : DEFAULT_PREFERENCES.autoRetrain,
});

const ensureAuthFile = async () => {
  try {
    await fs.access(config.AUTH_FILE);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }

    const defaultProfile = {
      email: config.ADMIN_EMAIL || '',
      preferences: buildPreferences(DEFAULT_PREFERENCES),
    };

    await fs.mkdir(path.dirname(config.AUTH_FILE), { recursive: true });
    await fs.writeFile(config.AUTH_FILE, JSON.stringify(defaultProfile, null, 2));
  }
};

const readAuthProfile = async () => {
  await ensureAuthFile();
  try {
    const raw = await fs.readFile(config.AUTH_FILE, 'utf8');
    const profile = JSON.parse(raw);
    return {
      email: normalizeEmail(profile?.email || config.ADMIN_EMAIL || ''),
      preferences: buildPreferences(profile?.preferences),
    };
  } catch {
    return {
      email: normalizeEmail(config.ADMIN_EMAIL || ''),
      preferences: buildPreferences(DEFAULT_PREFERENCES),
    };
  }
};

const writeAuthProfile = async (profile) => {
  await fs.mkdir(path.dirname(config.AUTH_FILE), { recursive: true });
  await fs.writeFile(
    config.AUTH_FILE,
    JSON.stringify(
      {
        email: normalizeEmail(profile.email || config.ADMIN_EMAIL || ''),
        preferences: buildPreferences(profile.preferences),
      },
      null,
      2
    )
  );
};

const getPreferences = async () => {
  const profile = await readAuthProfile();
  return profile.preferences;
};

const getPublicProfile = async () => {
  const profile = await readAuthProfile();
  return {
    email: profile.email,
    preferences: profile.preferences,
  };
};

const updatePreferences = async (nextPreferences) => {
  const profile = await readAuthProfile();
  profile.preferences = buildPreferences({
    ...profile.preferences,
    ...(nextPreferences || {}),
  });
  await writeAuthProfile(profile);
  return profile.preferences;
};

module.exports = {
  DEFAULT_PREFERENCES,
  normalizeEmail,
  sanitizeNotificationEmails,
  buildPreferences,
  getPreferences,
  getPublicProfile,
  updatePreferences,
};
