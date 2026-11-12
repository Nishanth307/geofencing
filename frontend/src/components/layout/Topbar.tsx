import { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Bell,
  Wifi,
  WifiOff,
  Server,
  User,
  Volume2,
  VolumeX,
  Menu,
} from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { useAlertStore } from "@/store/alertStore";
import { cn, formatDate } from "@/lib/utils";

const pageTitles: Record<string, string> = {
  "/": "Operational Overview",
  "/tracking": "Live Vehicle Tracking",
  "/geofences": "Geofence Management",
  "/vehicles": "Vehicle Fleet Management",
  "/alerts": "Alert Rule Configuration",
  "/violations": "Violation History & Audit Log",
  "/settings": "System Settings",
};

export function Topbar() {
  const location = useLocation();
  const currentTitle = pageTitles[location.pathname] || "Dashboard";

  const wsStatus = useUIStore((state) => state.wsStatus);
  const backendHealthy = useUIStore((state) => state.backendHealthy);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  const unreadCount = useAlertStore((state) => state.unreadCount);
  const liveAlerts = useAlertStore((state) => state.liveAlerts);
  const soundEnabled = useAlertStore((state) => state.soundEnabled);
  const toggleSound = useAlertStore((state) => state.toggleSound);
  const markAllAsRead = useAlertStore((state) => state.markAllAsRead);

  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Status badge styling
  const wsStatusConfig = {
    connected: { label: "WS Connected", color: "bg-emerald-500", text: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    connecting: { label: "WS Connecting...", color: "bg-amber-500 animate-pulse", text: "text-amber-700 bg-amber-50 border-amber-200" },
    reconnecting: { label: "WS Reconnecting...", color: "bg-amber-500 animate-ping", text: "text-amber-700 bg-amber-50 border-amber-200" },
    disconnected: { label: "WS Offline", color: "bg-red-500", text: "text-red-700 bg-red-50 border-red-200" },
  }[wsStatus];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur">
      {/* Page Title & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {currentTitle}
          </h1>
          <p className="hidden sm:block text-[11px] text-slate-500">
            Real-time geospatial fleet monitoring
          </p>
        </div>
      </div>

      {/* Right Action & Status Area */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Audio Mute/Unmute */}
        <button
          onClick={toggleSound}
          className={cn(
            "rounded-lg p-2 text-xs transition-colors border",
            soundEnabled
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-slate-200 text-slate-400 hover:bg-slate-50"
          )}
          title={soundEnabled ? "Sound alerts enabled" : "Sound alerts muted"}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>

        {/* Backend REST Health Indicator */}
        <div
          className={cn(
            "hidden md:flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
            backendHealthy
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          )}
          title={backendHealthy ? "REST API is responsive" : "REST API disconnected"}
        >
          <Server className="h-3 w-3" />
          <span>API :8080</span>
        </div>

        {/* WebSocket Real-time Status */}
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
            wsStatusConfig.text
          )}
        >
          {wsStatus === "connected" ? (
            <Wifi className="h-3 w-3 text-emerald-600" />
          ) : (
            <WifiOff className="h-3 w-3 text-red-600" />
          )}
          <span className="hidden sm:inline">{wsStatusConfig.label}</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              if (unreadCount > 0) markAllAsRead();
            }}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-sm">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Flyout panel */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white p-3 shadow-xl z-50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <span className="text-xs font-semibold text-slate-800">
                  Live Event Feed ({liveAlerts.length})
                </span>
                <button
                  onClick={() => markAllAsRead()}
                  className="text-[11px] text-blue-600 hover:underline"
                >
                  Mark read
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2">
                {liveAlerts.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">
                    No real-time events yet.
                  </p>
                ) : (
                  liveAlerts.slice(0, 8).map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        "rounded-lg p-2.5 text-xs transition-colors border",
                        alert.event_type === "entry"
                          ? "border-amber-200 bg-amber-50/50"
                          : "border-blue-200 bg-blue-50/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">
                          {alert.vehicle?.vehicle_number || "Vehicle"}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {formatDate(alert.timestamp)}
                        </span>
                      </div>
                      <div className="mt-1 text-slate-600">
                        Triggered <span className="font-medium uppercase text-[11px]">{alert.event_type}</span> for{" "}
                        <span className="font-medium text-slate-800">
                          {alert.geofence?.geofence_name || "Geofence"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar / profile button */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white font-medium text-xs">
            <User className="h-4 w-4" />
          </div>
        </div>
      </div>
    </header>
  );
}

