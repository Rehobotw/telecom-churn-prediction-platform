import { useState } from "react";
import { useNavigate } from "react-router";
import { TrendingUp } from "lucide-react";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      localStorage.setItem("churn-insights-auth", "true");
      navigate("/");
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
              <button type="button" className="text-sm text-[#1A56FF] hover:text-[#0f3fb8] font-medium">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-[#1A56FF] text-white py-2.5 px-4 rounded-lg font-medium hover:bg-[#0f3fb8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A56FF] focus:ring-offset-2"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
