import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { LayoutDashboard, Target, Users, BarChart3, Settings, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { clearAuthenticatedSession, getAuthenticatedSession, isAuthenticated } from "../lib/auth";

export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [authReady, setAuthReady] = useState(false);
  const [sessionEmail, setSessionEmail] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    setSessionEmail(getAuthenticatedSession()?.email ?? "");
    setAuthReady(true);
  }, [navigate]);

  const navItems = [
    { path: "/", label: "Overview", icon: LayoutDashboard },
    { path: "/predictions", label: "Predictions", icon: Target },
    { path: "/customers", label: "Customers", icon: Users },
    { path: "/model-metrics", label: "Model Metrics", icon: BarChart3 },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  const handleLogout = () => {
    clearAuthenticatedSession();
    navigate("/login");
  };

  if (!authReady) {
    return null;
  }

  return (
    <div className="flex h-screen bg-[#F9FAFB]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col">
        <div className="p-6 border-b border-[#E5E7EB]">
          <h1 className="font-semibold text-xl text-gray-900">Churn Insights</h1>
          <p className="text-sm text-gray-500 mt-1">Telecom Analytics</p>
          <div className="mt-4 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
              Signed In
            </div>
            <div className="mt-1 text-sm font-medium text-gray-900">{sessionEmail || "--"}</div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-[#1A56FF] text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#E5E7EB]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
