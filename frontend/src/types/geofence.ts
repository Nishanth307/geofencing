import { BaseResponse } from "./api";

export type GeofenceCategory =
  | "delivery_zone"
  | "restricted_zone"
  | "toll_zone"
  | "customer_area"
  | "office"
  | string;

export interface Geofence {
  id: string;
  name: string;
  description?: string;
  coordinates: [number, number][]; // [lat, lng] array
  category: GeofenceCategory;
  status: "active" | "inactive" | string;
  created_at: string;
}

export interface GeofenceRequest {
  name: string;
  description?: string;
  coordinates: [number, number][]; // [lat, lng] array
  category: GeofenceCategory;
}

export interface GeofenceResponse extends BaseResponse {
  id: string;
  name: string;
  status: string;
}

export interface GeofenceListResponse extends BaseResponse {
  geofences: Geofence[];
}

