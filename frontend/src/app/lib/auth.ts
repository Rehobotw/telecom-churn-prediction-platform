export type AccountPreferences = {
  highRiskAlerts: boolean;
  dailyReports: boolean;
  notificationEmails: string[];
  autoRetrain?: "Off" | "Weekly" | "Monthly" | "Quarterly";
};

export type AccountProfile = {
  email: string;
  preferences: AccountPreferences;
};

type ForgotPasswordResponse = {
  email: string;
};

type SessionState = {
  authenticated: boolean;
  email: string;
  timestamp: string;
};

const API_BASE_URL = ((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const PREFERENCES_STORAGE_KEY = "churn-insights-account-preferences";
const SESSION_STORAGE_KEY = "churn-insights-auth";
const REMEMBER_EMAIL_STORAGE_KEY = "churn-insights-remember-email";

const defaultPreferences: AccountPreferences = {
  highRiskAlerts: true,
  dailyReports: false,
  notificationEmails: ["admin@gmail.com"],
  autoRetrain: "Monthly",
};

async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const raw = await response.text();
    let message = raw;
    try {
      const parsed = JSON.parse(raw) as { message?: string };
      message = parsed.message || raw;
    } catch {}
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function getStoredPreferences(): AccountPreferences {
  if (!canUseStorage()) {
    return defaultPreferences;
  }

  const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(defaultPreferences));
    return defaultPreferences;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AccountPreferences>;
    const merged: AccountPreferences = {
      highRiskAlerts: parsed.highRiskAlerts ?? defaultPreferences.highRiskAlerts,
      dailyReports: parsed.dailyReports ?? defaultPreferences.dailyReports,
      notificationEmails: parsed.notificationEmails?.filter(Boolean) ?? defaultPreferences.notificationEmails,
      autoRetrain: parsed.autoRetrain ?? defaultPreferences.autoRetrain,
    };
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(defaultPreferences));
    return defaultPreferences;
  }
}

export async function updateAccountPreferences(preferences: AccountPreferences) {
  const response = await authRequest<{ success: boolean; data: AccountPreferences }>(
    "/api/auth/preferences",
    {
      method: "PATCH",
      body: JSON.stringify(preferences),
    },
  );

  if (canUseStorage()) {
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(response.data));
  }

  return response.data;
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
    return JSON.parse(raw) as SessionState;
  } catch {
    return null;
  }
}

export function setAuthenticatedSession(email: string) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      authenticated: true,
      email: email.trim().toLowerCase(),
      timestamp: new Date().toISOString(),
    } satisfies SessionState),
  );
}

function clearAuthenticatedSessionHint() {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function isAuthenticated() {
  return Boolean(getAuthenticatedSession()?.authenticated);
}

export async function authenticate(email: string, password: string, rememberMe = false) {
  const response = await authRequest<{ success: boolean; data: { email: string; rememberMe: boolean } }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
      rememberMe,
    }),
  });

  setAuthenticatedSession(response.data.email);
  return response.data;
}

export async function validateAuthenticatedSession() {
  try {
    const response = await authRequest<{
      success: boolean;
      data: { authenticated: boolean; email: string; profile: { email: string; preferences: AccountPreferences } };
    }>("/api/auth/me");

    setAuthenticatedSession(response.data.email);

    if (canUseStorage()) {
      window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(response.data.profile.preferences));
    }

    return response.data;
  } catch {
    clearAuthenticatedSessionHint();
    return null;
  }
}

export async function clearAuthenticatedSession() {
  try {
    await authRequest("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({}),
    });
  } finally {
    clearAuthenticatedSessionHint();
  }
}

export async function getAccountProfile(): Promise<AccountProfile> {
  const session = await validateAuthenticatedSession();
  if (!session) {
    throw new Error("Authentication required");
  }

  return {
    email: session.profile.email,
    preferences: session.profile.preferences ?? getStoredPreferences(),
  };
}

export async function updateAccountEmail(nextEmail: string) {
  const response = await authRequest<{ success: boolean; data: { email: string } }>("/api/auth/email", {
    method: "PATCH",
    body: JSON.stringify({ email: nextEmail.trim().toLowerCase() }),
  });
  setAuthenticatedSession(response.data.email);
  return response.data;
}

export async function updateAccountPassword(currentPassword: string, newPassword: string) {
  await authRequest("/api/auth/password", {
    method: "PATCH",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function requestPasswordReset(email: string) {
  const response = await authRequest<{ success: boolean; data: ForgotPasswordResponse; message?: string }>(
    "/api/auth/forgot-password",
    {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    },
  );

  return response.data;
}

export async function resetPassword(email: string, resetCode: string, newPassword: string) {
  const response = await authRequest<{ success: boolean; data: { email: string }; message?: string }>(
    "/api/auth/reset-password",
    {
      method: "POST",
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        resetCode: resetCode.trim(),
        newPassword,
      }),
    },
  );

  return response.data;
}

export { REMEMBER_EMAIL_STORAGE_KEY };
