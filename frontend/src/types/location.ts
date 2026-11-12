import { BaseResponse } from "./api";

export interface LocationRequest {
  vehicle_id: string;
  latitude: number;
  longitude: number;
}

export interface LocationResponse extends BaseResponse {
  status: string;
  vehicle_id: string;
  latitude: number;
  longitude: number;
  timestamp?: string;
}

export interface VehicleLocation {
  id: number;
  vehicle_id: string;
  latitude: number;
  longitude: number;
  time_ns: number;
  created_at: string;
}

