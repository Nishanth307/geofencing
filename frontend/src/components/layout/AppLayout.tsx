import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useUIStore } from "@/store/uiStore";
import { useAlertStore } from "@/store/alertStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { cn, formatDate } from "@/lib/utils";
import { AlertTriangle, X } from "lucide-react";

export function AppLayout() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const activeAlertModal = useAlertStore((state) => state.activeAlertModal);
  const setActiveAlertModal = useAlertStore((state) => state.setActiveAlertModal);

  // Global WebSocket listener
  useWebSocket();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
          sidebarOpen ? "lg:pl-64" : "lg:pl-20"
        )}
      >
        <Topbar />

        {/* Critical Alert Toast Banner for Restricted Zone Breaches */}
        {activeAlertModal && (
          <div className="bg-red-600 text-white px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm font-medium shadow-md animate-pulse">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-white" />
              <span>
                <strong>CRITICAL ALERT:</strong> Vehicle {activeAlertModal.vehicle?.vehicle_number} entered restricted geofence &quot;{activeAlertModal.geofence?.geofence_name}&quot; at {formatDate(activeAlertModal.timestamp)}
              </span>
            </div>
            <button
              onClick={() => setActiveAlertModal(null)}
              className="rounded p-1 hover:bg-red-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

