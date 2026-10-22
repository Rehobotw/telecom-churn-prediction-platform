import { Outlet, Link, useLocation } from "react-router";
import { LayoutDashboard, Target, Users, BarChart3, Settings } from "lucide-react";

export function MainLayout() {
  const location = useLocation();

  const navItems = [
    { path: "/app", label: "Overview", icon: LayoutDashboard },
    { path: "/app/predictions", label: "Predictions", icon: Target },
    { path: "/app/customers", label: "Customers", icon: Users },
    { path: "/app/model-metrics", label: "Model Metrics", icon: BarChart3 },
    { path: "/app/settings", label: "Settings", icon: Settings },
  ];

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
            const isActive =
              item.path === "/app"
                ? location.pathname === "/app"
                : location.pathname.startsWith(item.path);
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

