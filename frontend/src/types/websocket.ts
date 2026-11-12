export type ConnectionStatus = "connected" | "connecting" | "disconnected" | "reconnecting";

export interface WsLocation {
  latitude: number;
  longitude: number;
}

export interface WsGeofence {
  geofence_id: string;
  geofence_name: string;
  category: string;
}

export interface WsVehicle {
  vehicle_id: string;
  vehicle_number: string;
  driver_name: string;
}

export interface WsEvent {
  event_id: string;
  event_type: "entry" | "exit" | "telemetry" | string;
  timestamp: string;
  vehicle: WsVehicle;
  geofence?: WsGeofence;
  location: WsLocation;
}

