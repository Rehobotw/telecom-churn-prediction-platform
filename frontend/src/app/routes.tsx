import { createBrowserRouter } from "react-router";
import { MainLayout } from "./components/MainLayout";
import { LoginPage } from "./components/pages/LoginPage";
import { OverviewPage } from "./components/pages/OverviewPage";
import { PredictionsPage } from "./components/pages/PredictionsPage";
import { CustomersPage } from "./components/pages/CustomersPage";
import { ModelMetricsPage } from "./components/pages/ModelMetricsPage";
import { SettingsPage } from "./components/pages/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/",
    Component: MainLayout,
    children: [
      { index: true, Component: OverviewPage },
      { path: "predictions", Component: PredictionsPage },
      { path: "customers", Component: CustomersPage },
      { path: "model-metrics", Component: ModelMetricsPage },
      { path: "settings", Component: SettingsPage },
    ],
  },
]);
