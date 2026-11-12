import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  Shield,
  Truck,
  Bell,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Radio,
} from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { useAlertStore } from "@/store/alertStore";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  to: string;
  icon: React.ElementType;
  badge?: number;
}

export function Sidebar() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const unreadAlerts = useAlertStore((state) => state.unreadCount);

  const navItems: NavItem[] = [
    { name: "Overview", to: "/", icon: LayoutDashboard },
    { name: "Live Tracking", to: "/tracking", icon: MapPin },
    { name: "Geofences", to: "/geofences", icon: Shield },
    { name: "Vehicles", to: "/vehicles", icon: Truck },
    { name: "Alert Rules", to: "/alerts", icon: Bell },
    { name: "Violation History", to: "/violations", icon: History, badge: unreadAlerts },
    { name: "Settings", to: "/settings", icon: Settings },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col bg-slate-900 text-white transition-all duration-300 ease-in-out border-r border-slate-800",
        sidebarOpen ? "w-64" : "w-20"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Radio className="h-5 w-5 animate-pulse" />
          </div>
          {sidebarOpen && (
            <div className="flex flex-col truncate">
              <span className="text-sm font-bold tracking-tight text-white">GeoSentinel</span>
              <span className="text-[10px] text-slate-400 font-mono">Fleet Ops v1.0</span>
            </div>
          )}
        </div>

        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors select-none group",
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                    : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
                )
              }
              title={!sidebarOpen ? item.name : undefined}
            >
              <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
              {sidebarOpen && <span className="flex-1 truncate">{item.name}</span>}
              {sidebarOpen && item.badge !== undefined && item.badge > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      {sidebarOpen && (
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500">
          <div className="flex items-center justify-between">
            <span>Server</span>
            <span className="font-mono text-emerald-400">Online :8080</span>
          </div>
        </div>
      )}
    </aside>
  );
}

