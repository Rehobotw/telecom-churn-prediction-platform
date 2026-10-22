import { useEffect, useState } from "react";
import { Bell, Mail, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  getAccountPreferences,
  updateAccountPreferences,
  sendNotificationAlert,
} from "../../lib/auth";

export function SettingsPage() {
  const [highRiskAlerts, setHighRiskAlerts] = useState(true);
  const [dailyReports, setDailyReports] = useState(false);
  const [notificationEmails, setNotificationEmails] = useState<string[]>([]);
  const [notificationEmailInput, setNotificationEmailInput] = useState("");
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void getAccountPreferences()
      .then((preferences) => {
        if (!isMounted) {
          return;
        }

        setHighRiskAlerts(preferences.highRiskAlerts);
        setDailyReports(preferences.dailyReports);
        setNotificationEmails(preferences.notificationEmails || []);
        setPreferencesLoaded(true);
      })
      .catch((err) => {
        if (!isMounted) {
          return;
        }
        toast.error(err instanceof Error ? err.message : "Unable to load settings.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const persistPreferences = async (nextPreferences: {
    highRiskAlerts: boolean;
    dailyReports: boolean;
    notificationEmails: string[];
  }) => {
    try {
      const saved = await updateAccountPreferences(nextPreferences);
      setHighRiskAlerts(saved.highRiskAlerts);
      setDailyReports(saved.dailyReports);
      setNotificationEmails(saved.notificationEmails);
      toast.success("Settings updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update settings.");
    }
  };

  const addNotificationEmail = () => {
    const normalizedEmail = notificationEmailInput.trim().toLowerCase();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

    if (!isValidEmail) {
      toast.error("Enter a valid notification email.");
      return;
    }

    if (notificationEmails.includes(normalizedEmail)) {
      toast.error("That notification email is already added.");
      return;
    }

    const nextEmails = [...notificationEmails, normalizedEmail];
    setNotificationEmails(nextEmails);
    setNotificationEmailInput("");
    void persistPreferences({
      highRiskAlerts,
      dailyReports,
      notificationEmails: nextEmails,
    });
  };

  const removeNotificationEmail = (emailToRemove: string) => {
    const nextEmails = notificationEmails.filter((value) => value !== emailToRemove);
    setNotificationEmails(nextEmails);
    void persistPreferences({
      highRiskAlerts,
      dailyReports,
      notificationEmails: nextEmails,
    });
  };

  const handleSendNotificationAlert = async () => {
    setIsSendingAlert(true);
    try {
      const result = await sendNotificationAlert();
      const count = result.delivered.length;
      toast.success(`Notification alert sent to ${count} recipient${count === 1 ? "" : "s"}.`);
      if (result.failed.length > 0) {
        toast.warning(`${result.failed.length} recipient${result.failed.length === 1 ? "" : "s"} failed.`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to send notification alert.");
    } finally {
      setIsSendingAlert(false);
    }
  };

  if (!preferencesLoaded) {
    return <div className="p-8 text-sm text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage platform preferences and configurations</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-medium text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-500">Configure alert preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[#E5E7EB]">
              <div>
                <div className="font-medium text-gray-900">High Risk Alerts</div>
                <div className="text-sm text-gray-500">Receive notifications for high-risk predictions</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={highRiskAlerts}
                  onChange={(e) => {
                    const nextValue = e.target.checked;
                    setHighRiskAlerts(nextValue);
                    void persistPreferences({ highRiskAlerts: nextValue, dailyReports, notificationEmails });
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A56FF]" />
              </label>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium text-gray-900">Daily Reports</div>
                <div className="text-sm text-gray-500">Receive daily summary of predictions and metrics</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={dailyReports}
                  onChange={(e) => {
                    const nextValue = e.target.checked;
                    setDailyReports(nextValue);
                    void persistPreferences({ highRiskAlerts, dailyReports: nextValue, notificationEmails });
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A56FF]" />
              </label>
            </div>

            <div className="border-t border-[#E5E7EB] pt-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium text-gray-900">Notification Recipients</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Add one or more email addresses to receive alert and report notifications.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSendNotificationAlert}
                  disabled={isSendingAlert}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[#1A56FF] bg-white px-4 py-2.5 text-sm font-medium text-[#1A56FF] transition-colors hover:bg-blue-50 disabled:opacity-70"
                >
                  <Mail className="w-4 h-4" />
                  {isSendingAlert ? "Sending..." : "Send Alert"}
                </button>
              </div>

              <div className="mt-4 flex gap-3">
                <div className="flex-1 relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={notificationEmailInput}
                    onChange={(e) => setNotificationEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addNotificationEmail();
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56FF] focus:border-transparent"
                    placeholder="Add notification email"
                  />
                </div>
                <button
                  type="button"
                  onClick={addNotificationEmail}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#1A56FF] rounded-lg hover:bg-[#0f3fb8] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Email
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {notificationEmails.length > 0 ? (
                  notificationEmails.map((notificationEmail) => (
                    <div
                      key={notificationEmail}
                      className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-800 truncate">{notificationEmail}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeNotificationEmail(notificationEmail)}
                        className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-[#D1D5DB] px-4 py-6 text-sm text-gray-500 text-center">
                    No notification recipients configured.
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-3">
                Alerts are sent to saved recipient email addresses.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

