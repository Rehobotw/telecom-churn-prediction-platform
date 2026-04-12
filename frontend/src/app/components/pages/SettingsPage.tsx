import { useState } from "react";
import { Bell, Settings as SettingsIcon, Shield, Eye, EyeOff, Mail, Check, X } from "lucide-react";

export function SettingsPage() {
  const [highRiskAlerts, setHighRiskAlerts] = useState(true);
  const [dailyReports, setDailyReports] = useState(false);
  const [threshold, setThreshold] = useState(50);
  const [autoRetrain, setAutoRetrain] = useState("Monthly");

  // Account Identity
  const [email, setEmail] = useState("user@company.com");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  // Password Management
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: "", color: "" };
    if (password.length < 6) return { strength: 25, label: "Weak", color: "bg-red-500" };
    if (password.length < 10) return { strength: 50, label: "Fair", color: "bg-yellow-500" };
    if (password.length < 14) return { strength: 75, label: "Good", color: "bg-blue-500" };
    return { strength: 100, label: "Strong", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const canSavePassword = currentPassword && newPassword.length >= 8 && passwordsMatch;

  const handleEmailUpdate = () => {
    setShowEmailModal(false);
    // In a real app, this would trigger the verification email
    alert(`Verification link sent to ${newEmail}. Please check your inbox.`);
    setNewEmail("");
  };

  const handlePasswordChange = () => {
    if (canSavePassword) {
      // In a real app, this would call the API
      alert("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage platform preferences and configurations</p>
      </div>

      <div className="space-y-6">
        {/* Notifications */}
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
                  onChange={(e) => setHighRiskAlerts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A56FF]"></div>
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
                  onChange={(e) => setDailyReports(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A56FF]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Model Configuration */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="font-medium text-gray-900">Model Configuration</h2>
              <p className="text-sm text-gray-500">Adjust prediction and training settings</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="font-medium text-gray-900">Prediction Threshold</label>
                <span className="text-sm text-gray-600">{threshold}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1A56FF]"
              />
              <p className="text-sm text-gray-500 mt-2">
                Predictions above this threshold are classified as high risk
              </p>
            </div>

            <div>
              <label className="block font-medium text-gray-900 mb-2">Auto-Retrain Schedule</label>
              <select
                value={autoRetrain}
                onChange={(e) => setAutoRetrain(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56FF] focus:border-transparent"
              >
                <option value="Off">Off</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
              </select>
              <p className="text-sm text-gray-500 mt-2">Automatically retrain the model on this schedule</p>
            </div>
          </div>
        </div>

        {/* Security & Account Profile */}
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
            {/* Account Identity Section */}
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
                <p className="text-xs text-gray-500 mt-2">This email is used for login and notifications</p>
              </div>
            </div>

            {/* Credential Management Section */}
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

        {/* Email Update Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                    A verification link will be sent to your new email address. Your login email will not change until verified.
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
                    disabled={!newEmail || newEmail === email}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      newEmail && newEmail !== email
                        ? "bg-[#1A56FF] text-white hover:bg-[#0f3fb8]"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Send Verification
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
