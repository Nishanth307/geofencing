import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert nanoseconds string to formatted ms
export function formatTimeNs(timeNs?: string): string {
  if (!timeNs) return "0ms";
  const ns = parseInt(timeNs, 10);
  if (isNaN(ns)) return timeNs;
  if (ns < 1_000_000) {
    return `${(ns / 1_000).toFixed(1)}µs`;
  }
  return `${(ns / 1_000_000).toFixed(2)}ms`;
}

// Format ISO date string into readable local format
export function formatDate(dateString?: string): string {
  if (!dateString) return "N/A";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(d);
  } catch {
    return dateString;
  }
}

// Coordinate utilities
// Backend format: [latitude, longitude]
export type CoordinatePair = [number, number];

export function isValidCoordinate(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

// Colors for geofence categories
export const GEOFENCE_CATEGORY_COLORS: Record<string, { stroke: string; fill: string; badge: string }> = {
  restricted_zone: {
    stroke: "#ef4444",
    fill: "#f87171",
    badge: "bg-red-50 text-red-700 border-red-200",
  },
  delivery_zone: {
    stroke: "#3b82f6",
    fill: "#60a5fa",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
  },
  toll_zone: {
    stroke: "#f59e0b",
    fill: "#fbbf24",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  customer_area: {
    stroke: "#10b981",
    fill: "#34d399",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  office: {
    stroke: "#8b5cf6",
    fill: "#a78bfa",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
  },
  default: {
    stroke: "#64748b",
    fill: "#94a3b8",
    badge: "bg-slate-50 text-slate-700 border-slate-200",
  },
};

export function getCategoryStyle(category?: string) {
  if (!category) return GEOFENCE_CATEGORY_COLORS.default;
  const key = category.toLowerCase();
  return GEOFENCE_CATEGORY_COLORS[key] || GEOFENCE_CATEGORY_COLORS.default;
}
