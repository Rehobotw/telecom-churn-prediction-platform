export type AccountPreferences = {
  highRiskAlerts: boolean;
  dailyReports: boolean;
  notificationEmails: string[];
  autoRetrain?: "Off" | "Weekly" | "Monthly" | "Quarterly";
};

export type AccountProfile = {
  email: string;
  password: string;
  preferences: AccountPreferences;
};

const DEFAULT_ADMIN_EMAIL =
  ((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_ADMIN_EMAIL ?? "admin@gmail.com")
    .trim()
    .toLowerCase();
const DEFAULT_ADMIN_PASSWORD =
  (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_ADMIN_PASSWORD ??
  (import.meta.env.DEV ? "admin123" : "change-me-before-production");

const ACCOUNT_STORAGE_KEY = "churn-insights-account-profile";
const SESSION_STORAGE_KEY = "churn-insights-auth";
const REMEMBER_EMAIL_STORAGE_KEY = "churn-insights-remember-email";

const defaultProfile: AccountProfile = {
  email: DEFAULT_ADMIN_EMAIL,
  password: DEFAULT_ADMIN_PASSWORD,
  preferences: {
    highRiskAlerts: true,
    dailyReports: false,
    notificationEmails: [DEFAULT_ADMIN_EMAIL],
    autoRetrain: "Monthly",
  },
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getStoredProfile(): AccountProfile {
  if (!canUseStorage()) {
    return defaultProfile;
  }

  const raw = window.localStorage.getItem(ACCOUNT_STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(defaultProfile));
    return defaultProfile;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AccountProfile>;
    const merged: AccountProfile = {
      email: parsed.email || defaultProfile.email,
      password: parsed.password || defaultProfile.password,
      preferences: {
        highRiskAlerts:
          parsed.preferences?.highRiskAlerts ?? defaultProfile.preferences.highRiskAlerts,
        dailyReports: parsed.preferences?.dailyReports ?? defaultProfile.preferences.dailyReports,
        notificationEmails:
          parsed.preferences?.notificationEmails?.filter(Boolean) ??
          defaultProfile.preferences.notificationEmails,
        autoRetrain: parsed.preferences?.autoRetrain ?? defaultProfile.preferences.autoRetrain,
      },
    };
    window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(defaultProfile));
    return defaultProfile;
  }
}

export function saveStoredProfile(profile: AccountProfile) {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(profile));
}

export function authenticate(email: string, password: string) {
  const profile = getStoredProfile();
  const normalizedEmail = email.trim().toLowerCase();
  return normalizedEmail === profile.email.toLowerCase() && password === profile.password;
}

export function setAuthenticatedSession(email: string) {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      authenticated: true,
      email,
      timestamp: new Date().toISOString(),
    }),
  );
}

export function clearAuthenticatedSession() {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function getAuthenticatedSession() {
  if (!canUseStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as { authenticated: boolean; email: string; timestamp: string };
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getAuthenticatedSession()?.authenticated);
}

export function updateAccountEmail(nextEmail: string) {
  const profile = getStoredProfile();
  const updated = {
    ...profile,
    email: nextEmail.trim().toLowerCase(),
  };
  saveStoredProfile(updated);
  const session = getAuthenticatedSession();
  if (session?.authenticated) {
    setAuthenticatedSession(updated.email);
  }
  return updated;
}

export function updateAccountPassword(nextPassword: string) {
  const profile = getStoredProfile();
  const updated = {
    ...profile,
    password: nextPassword,
  };
  saveStoredProfile(updated);
  return updated;
}

export function updateAccountPreferences(preferences: AccountPreferences) {
  const profile = getStoredProfile();
  const updated = {
    ...profile,
    preferences,
  };
  saveStoredProfile(updated);
  return updated;
}

export { REMEMBER_EMAIL_STORAGE_KEY };
