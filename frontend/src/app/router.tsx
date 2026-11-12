import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { LiveTrackingPage } from "@/features/tracking/LiveTrackingPage";
import { GeofencesPage } from "@/features/geofences/GeofencesPage";
import { VehiclesPage } from "@/features/vehicles/VehiclesPage";
import { AlertsPage } from "@/features/alerts/AlertsPage";
import { ViolationHistoryPage } from "@/features/violations/ViolationHistoryPage";
import { SettingsPage } from "@/features/settings/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "tracking",
        element: <LiveTrackingPage />,
      },
      {
        path: "geofences",
        element: <GeofencesPage />,
      },
      {
        path: "vehicles",
        element: <VehiclesPage />,
      },
      {
        path: "alerts",
        element: <AlertsPage />,
      },
      {
        path: "violations",
        element: <ViolationHistoryPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
    ],
  },
]);

