import { create } from "zustand";
import { WsEvent } from "@/types/websocket";

export interface AlertNotification extends WsEvent {
  id: string;
  read: boolean;
}

interface AlertStore {
  liveAlerts: AlertNotification[];
  unreadCount: number;
  soundEnabled: boolean;
  activeAlertModal: AlertNotification | null;

  addLiveAlert: (event: WsEvent) => void;
  markAllAsRead: () => void;
  clearAlerts: () => void;
  toggleSound: () => void;
  setActiveAlertModal: (alert: AlertNotification | null) => void;
}

export const useAlertStore = create<AlertStore>((set, get) => ({
  liveAlerts: [],
  unreadCount: 0,
  soundEnabled: localStorage.getItem("geosentinel_sound") === "true",
  activeAlertModal: null,

  addLiveAlert: (event: WsEvent) => {
    const notification: AlertNotification = {
      ...event,
      id: event.event_id || `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      read: false,
    };

    // Play optional audio alert
    if (get().soundEnabled) {
      try {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch {
        // Audio error ignored
      }
    }

    set((state) => ({
      liveAlerts: [notification, ...state.liveAlerts.slice(0, 49)], // keep last 50
      unreadCount: state.unreadCount + 1,
      // If critical event (restricted zone breach), optionally highlight
      activeAlertModal:
        event.geofence?.category === "restricted_zone" ? notification : state.activeAlertModal,
    }));
  },

  markAllAsRead: () =>
    set((state) => ({
      liveAlerts: state.liveAlerts.map((a) => ({ ...a, read: true })),
      unreadCount: 0,
    })),

  clearAlerts: () => set({ liveAlerts: [], unreadCount: 0 }),

  toggleSound: () =>
    set((state) => {
      const next = !state.soundEnabled;
      localStorage.setItem("geosentinel_sound", String(next));
      return { soundEnabled: next };
    }),

  setActiveAlertModal: (alert) => set({ activeAlertModal: alert }),
}));

