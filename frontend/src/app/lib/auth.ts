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

const API_BASE_URL = ((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const PREFERENCES_STORAGE_KEY = "churn-insights-account-preferences";

export const defaultPreferences: AccountPreferences = {
  highRiskAlerts: true,
  dailyReports: false,
  notificationEmails: [],
  autoRetrain: "Monthly",
};

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
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

export function getStoredPreferences(): AccountPreferences {
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

export async function getAccountPreferences(): Promise<AccountPreferences> {
  try {
    const response = await apiRequest<{ success: boolean; data: AccountPreferences }>(
      "/api/auth/preferences"
    );
    if (canUseStorage() && response.data) {
      window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(response.data));
    }
    return response.data;
  } catch {
    return getStoredPreferences();
  }
}

export async function updateAccountPreferences(preferences: AccountPreferences) {
  const response = await apiRequest<{ success: boolean; data: AccountPreferences }>(
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

export async function getAccountProfile(): Promise<AccountProfile> {
  const preferences = await getAccountPreferences();
  return {
    email: "",
    preferences,
  };
}

export async function sendNotificationAlert(toEmail?: string) {
  const response = await apiRequest<{
    success: boolean;
    data: { delivered: string[]; failed: Array<{ to: string; message: string }> };
    message?: string;
  }>("/api/auth/notification-alert", {
    method: "POST",
    body: JSON.stringify({
      toEmail: toEmail?.trim().toLowerCase() || undefined,
      subject: "Churn Insights Notification Alert",
      message: "This is a real-time notification alert from Churn Insights.",
    }),
  });

  return response.data;
}

