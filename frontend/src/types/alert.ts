import { BaseResponse } from "./api";

export type EventType = "entry" | "exit" | "both" | string;

export interface AlertItem {
  alert_id: string;
  geofence_id: string;
  geofence_name: string;
  vehicle_id: string;
  vehicle_number: string;
  event_type: "entry" | "exit" | string;
  status: string;
  created_at: string;
  // Optional coordinates if recorded
  latitude?: number;
  longitude?: number;
}

export interface AlertRequest {
  geofence_id: string;
  vehicle_id?: string; // Optional: empty or omitted means applies to all vehicles
  event_type: EventType;
}

export interface AlertResponse extends BaseResponse {
  alert_id: string;
  geofence_id: string;
  vehicle_id: string;
  event_type: string;
  status: string;
}

export interface AlertListResponse extends BaseResponse {
  alerts: AlertItem[];
}

