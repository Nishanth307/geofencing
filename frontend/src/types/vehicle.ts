import { BaseResponse } from "./api";

export type VehicleType = "Truck" | "Car" | "Van" | "Motorcycle" | string;

export interface Vehicle {
  id: string;
  vehicle_number: string;
  driver_name: string;
  vehicle_type: VehicleType;
  phone: string;
  status: "active" | "inactive" | string;
  created_at: string;
}

export interface VehicleRequest {
  vehicle_number: string;
  driver_name: string;
  vehicle_type: VehicleType;
  phone: string;
}

export interface VehicleResponse extends BaseResponse {
  id: string;
  vehicle_number: string;
  status: string;
}

export interface VehicleListResponse extends BaseResponse {
  vehicles: Vehicle[];
}

