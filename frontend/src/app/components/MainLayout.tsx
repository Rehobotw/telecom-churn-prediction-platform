import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { LayoutDashboard, Target, Users, BarChart3, Settings, LogOut } from "lucide-react";
import { useEffect } from "react";

export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("churn-insights-auth");
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [navigate]);

  const navItems = [
    { path: "/", label: "Overview", icon: LayoutDashboard },
    { path: "/predictions", label: "Predictions", icon: Target },
    { path: "/customers", label: "Customers", icon: Users },
    { path: "/model-metrics", label: "Model Metrics", icon: BarChart3 },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem("churn-insights-auth");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-[#F9FAFB]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col">
        <div className="p-6 border-b border-[#E5E7EB]">
          <h1 className="font-semibold text-xl text-gray-900">Churn Insights</h1>
          <p className="text-sm text-gray-500 mt-1">Telecom Analytics</p>
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
