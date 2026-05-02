import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { TrendingUp, AlertTriangle, KeyRound } from "lucide-react";
import {
  REMEMBER_EMAIL_STORAGE_KEY,
  authenticate,
  requestPasswordReset,
  resetPassword,
  validateAuthenticatedSession,
} from "../../lib/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [isResetRequestSubmitting, setIsResetRequestSubmitting] = useState(false);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  useEffect(() => {
    const rememberedEmail = window.localStorage.getItem(REMEMBER_EMAIL_STORAGE_KEY);
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
      setResetEmail(rememberedEmail);
    }

    const params = new URLSearchParams(window.location.search);
    const linkedResetEmail = params.get("resetEmail")?.trim().toLowerCase();
    const linkedResetCode = params.get("resetCode")?.trim();
    if (linkedResetEmail || linkedResetCode) {
      setResetEmail(linkedResetEmail || rememberedEmail || "");
      setResetCode(linkedResetCode || "");
      setShowForgotPassword(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    void validateAuthenticatedSession().then((session) => {
      if (session?.authenticated) {
        navigate("/app", { replace: true });
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await authenticate(email, password, rememberMe);
      if (rememberMe) {
        window.localStorage.setItem(REMEMBER_EMAIL_STORAGE_KEY, email.trim().toLowerCase());
      } else {
        window.localStorage.removeItem(REMEMBER_EMAIL_STORAGE_KEY);
      }
      setError("");
      navigate("/app", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetRequestSubmitting(true);
    setResetError("");
    setResetSuccess("");

    try {
      const response = await requestPasswordReset(resetEmail);
      setResetEmail(response.email);
      if (response.delivery === "fallback" && response.resetCode) {
        setResetCode(response.resetCode);
        setResetSuccess(`Email delivery is unavailable. Use this reset code: ${response.resetCode}`);
      } else {
        setResetSuccess("If the account exists, a reset code has been sent to the inbox.");
      }
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Unable to request password reset.");
    } finally {
      setIsResetRequestSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");

    if (newPassword.length < 8) {
      setResetError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError("New password and confirmation do not match.");
      return;
    }

    setIsResetSubmitting(true);

    try {
      const response = await resetPassword(resetEmail, resetCode, newPassword);
      setEmail(response.email);
      setPassword("");
      setShowForgotPassword(false);
      setResetCode("");
      setNewPassword("");
      setConfirmPassword("");
      setResetSuccess("");
      setError("Password reset complete. Sign in with your new password.");
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Unable to reset password.");
    } finally {
      setIsResetSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-[#1A56FF] rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-semibold text-2xl text-gray-900">Churn Insights</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56FF] focus:border-transparent transition-shadow"
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56FF] focus:border-transparent transition-shadow"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#1A56FF] focus:ring-[#1A56FF]"
                />
                <span className="text-sm text-gray-700">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email.trim().toLowerCase() || resetEmail);
                  setResetError("");
                  setResetSuccess("");
                  setShowForgotPassword(true);
                }}
                className="text-sm text-[#1A56FF] hover:text-[#0f3fb8] font-medium"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1A56FF] text-white py-2.5 px-4 rounded-lg font-medium hover:bg-[#0f3fb8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A56FF] focus:ring-offset-2"
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>

      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <KeyRound className="h-5 w-5 text-[#1A56FF]" />
              Reset password
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Request a password reset code for the administrator account. The code expires after 15 minutes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <form onSubmit={handleRequestReset} className="space-y-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#E8F0FF] text-xs font-semibold text-[#1A56FF]">1</span>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Request reset code</div>
                  <div className="mt-1 text-xs text-gray-500">Use the administrator email currently configured for this platform.</div>
                </div>
              </div>

              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Account email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56FF] focus:border-transparent transition-shadow"
                  placeholder="admin@company.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isResetRequestSubmitting}
                className="w-full bg-[#1A56FF] text-white py-2.5 px-4 rounded-lg font-medium hover:bg-[#0f3fb8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A56FF] focus:ring-offset-2 disabled:opacity-70"
              >
                {isResetRequestSubmitting ? "Sending..." : "Send reset code"}
              </button>
            </form>

            <form onSubmit={handleResetPassword} className="space-y-4 rounded-xl border border-[#E5E7EB] p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">2</span>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Set new password</div>
                  <div className="mt-1 text-xs text-gray-500">Enter the email reset code and choose a new password.</div>
                </div>
              </div>

              <div>
                <label htmlFor="reset-code" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Reset code
                </label>
                <input
                  id="reset-code"
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56FF] focus:border-transparent transition-shadow"
                  placeholder="123456"
                  required
                />
              </div>

              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56FF] focus:border-transparent transition-shadow"
                  placeholder="At least 8 characters"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56FF] focus:border-transparent transition-shadow"
                  placeholder="Repeat new password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isResetSubmitting}
                className="w-full bg-gray-900 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-70"
              >
                {isResetSubmitting ? "Resetting..." : "Reset password"}
              </button>
            </form>
          </div>

          {(resetError || resetSuccess) && (
            <div
              className={`rounded-lg px-3.5 py-2.5 text-sm ${
                resetError ? "border border-red-200 bg-red-50 text-red-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {resetError || resetSuccess}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
