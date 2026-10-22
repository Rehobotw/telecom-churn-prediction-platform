import { Navigate, createBrowserRouter } from "react-router";
import { MainLayout } from "./components/MainLayout";
import { OverviewPage } from "./components/pages/OverviewPage";
import { PredictionsPage } from "./components/pages/PredictionsPage";
import { CustomersPage } from "./components/pages/CustomersPage";
import { ModelMetricsPage } from "./components/pages/ModelMetricsPage";
import { SettingsPage } from "./components/pages/SettingsPage";

function RootRedirect() {
  return <Navigate to="/app" replace />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootRedirect,
  },
  {
    path: "/login",
    Component: RootRedirect,
  },
  {
    path: "/app",
    Component: MainLayout,
    children: [
      { index: true, Component: OverviewPage },
      { path: "predictions", Component: PredictionsPage },
      { path: "customers", Component: CustomersPage },
      { path: "model-metrics", Component: ModelMetricsPage },
      { path: "settings", Component: SettingsPage },
    ],
  },
  {
    path: "*",
    Component: RootRedirect,
  },
]);

