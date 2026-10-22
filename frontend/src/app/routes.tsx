import { Navigate, createBrowserRouter } from "react-router";
import { MainLayout } from "./components/MainLayout";
import { OverviewPage } from "./components/pages/OverviewPage";
import { PredictionsPage } from "./components/pages/PredictionsPage";
import { CustomersPage } from "./components/pages/CustomersPage";
import { ModelMetricsPage } from "./components/pages/ModelMetricsPage";
import { SettingsPage } from "./components/pages/SettingsPage";
import { LandingPage } from "./components/pages/LandingPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/login",
    element: <Navigate to="/app" replace />,
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
    element: <Navigate to="/" replace />,
  },
]);
