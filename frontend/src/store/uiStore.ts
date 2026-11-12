import { create } from "zustand";
import { ConnectionStatus } from "@/types/websocket";

interface UIStore {
  selectedVehicleId: string | null;
  selectedGeofenceId: string | null;
  mapCenter: [number, number];
  mapZoom: number;
  sidebarOpen: boolean;
  wsStatus: ConnectionStatus;
  backendHealthy: boolean;

  setSelectedVehicleId: (id: string | null) => void;
  setSelectedGeofenceId: (id: string | null) => void;
  setMapCenter: (center: [number, number], zoom?: number) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setWsStatus: (status: ConnectionStatus) => void;
  setBackendHealthy: (healthy: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  selectedVehicleId: null,
  selectedGeofenceId: null,
  mapCenter: [12.9716, 77.5946], // Bangalore default center
  mapZoom: 14,
  sidebarOpen: true,
  wsStatus: "disconnected",
  backendHealthy: true,

  setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),
  setSelectedGeofenceId: (id) => set({ selectedGeofenceId: id }),
  setMapCenter: (center, zoom) =>
    set((state) => ({
      mapCenter: center,
      mapZoom: zoom !== undefined ? zoom : state.mapZoom,
    })),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setWsStatus: (status) => set({ wsStatus: status }),
  setBackendHealthy: (healthy) => set({ backendHealthy: healthy }),
}));

