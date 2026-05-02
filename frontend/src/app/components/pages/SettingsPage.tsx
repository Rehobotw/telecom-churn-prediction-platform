import { useEffect, useState } from "react";
import { Bell, Shield, Eye, EyeOff, Mail, Check, X, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  getAccountProfile,
  updateAccountEmail,
  updateAccountPassword,
  updateAccountPreferences,
  sendNotificationAlert,
} from "../../lib/auth";

export function SettingsPage() {
  const [highRiskAlerts, setHighRiskAlerts] = useState(true);
  const [dailyReports, setDailyReports] = useState(false);
  const [notificationEmails, setNotificationEmails] = useState<string[]>([]);
  const [notificationEmailInput, setNotificationEmailInput] = useState("");
  const [isSendingAlert, setIsSendingAlert] = useState(false);

  const [email, setEmail] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void getAccountProfile()
      .then((profile) => {
        if (!isMounted) {
          return;
        }

        setEmail(profile.email);
        setHighRiskAlerts(profile.preferences.highRiskAlerts);
        setDailyReports(profile.preferences.dailyReports);
        setNotificationEmails(profile.preferences.notificationEmails);
        setProfileLoaded(true);
      })
      .catch((err) => {
        if (!isMounted) {
          return;
        }
        toast.error(err instanceof Error ? err.message : "Unable to load account profile.");
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

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: "", color: "" };
    if (password.length < 6) return { strength: 25, label: "Weak", color: "bg-red-500" };
    if (password.length < 10) return { strength: 50, label: "Fair", color: "bg-yellow-500" };
    if (password.length < 14) return { strength: 75, label: "Good", color: "bg-blue-500" };
    return { strength: 100, label: "Strong", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const canSavePassword = currentPassword.length > 0 && newPassword.length >= 8 && passwordsMatch;

  const handleEmailUpdate = async () => {
    const normalizedEmail = newEmail.trim().toLowerCase();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

    if (!isValidEmail) {
      toast.error("Enter a valid email address.");
      return;
    }

    try {
      const updated = await updateAccountEmail(normalizedEmail);
      setEmail(updated.email);
      setShowEmailModal(false);
      setNewEmail("");
      toast.success(`Login email updated to ${updated.email}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update email.");
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

  const handlePasswordChange = async () => {
    if (!canSavePassword) {
      toast.error("Password must be at least 8 characters and match confirmation.");
      return;
    }

    try {
      await updateAccountPassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update password.");
    }
  };

  if (!profileLoaded) {
    return <div className="p-8 text-sm text-gray-500">Loading account settings...</div>;
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
                Alerts are sent to saved recipients and the login email so account owners receive urgent notifications by default.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="font-medium text-gray-900">Security & Account Profile</h2>
              <p className="text-sm text-gray-500">Manage identity and access credentials</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border-b border-[#E5E7EB] pb-6">
              <h3 className="font-medium text-gray-900 mb-4">Account Identity</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Email</label>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      readOnly
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-700"
                    />
                  </div>
                  <button
                    onClick={() => setShowEmailModal(true)}
                    className="px-4 py-2.5 text-sm font-medium text-white bg-[#1A56FF] rounded-lg hover:bg-[#0f3fb8] transition-colors"
                  >
                    Update Email
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">This email is used for login only unless you also add it as a notification recipient above.</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-4">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56FF] focus:border-transparent"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56FF] focus:border-transparent"
                      placeholder="Enter new password (min. 8 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Password Strength: {passwordStrength.label}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${passwordStrength.color}`}
                          style={{ width: `${passwordStrength.strength}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56FF] focus:border-transparent"
                      placeholder="Re-enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {confirmPassword && (
                    <div className="mt-2 flex items-center gap-1">
                      {passwordsMatch ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-600">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 text-red-600" />
                          <span className="text-xs text-red-600">Passwords do not match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={handlePasswordChange}
                  disabled={!canSavePassword}
                  className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    canSavePassword
                      ? "bg-[#1A56FF] text-white hover:bg-[#0f3fb8]"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>

        {showEmailModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">Update Email Address</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Email</label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56FF] focus:border-transparent"
                    placeholder="Enter new email address"
                  />
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <p className="text-xs text-blue-900">
                    This change takes effect immediately for the next login and updates the signed-in profile.
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowEmailModal(false);
                      setNewEmail("");
                    }}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEmailUpdate}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#1A56FF] rounded-lg hover:bg-[#0f3fb8] transition-colors"
                  >
                    Save Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
