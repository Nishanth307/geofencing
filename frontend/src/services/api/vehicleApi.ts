import { request } from "./apiClient";
import {
  Vehicle,
  VehicleRequest,
  VehicleResponse,
  VehicleListResponse,
} from "@/types/vehicle";
import { StandardResponse } from "@/types/api";

export const vehicleApi = {
  // GET /vehicles
  list: async (): Promise<VehicleListResponse> => {
    return request<VehicleListResponse>("/vehicles");
  },

  // GET /vehicles/{id}
  getById: async (id: string): Promise<{ vehicle: Vehicle; time_ns?: string }> => {
    return request<{ vehicle: Vehicle; time_ns?: string }>(`/vehicles/${id}`);
  },

  // POST /vehicles
  create: async (data: VehicleRequest): Promise<VehicleResponse> => {
    return request<VehicleResponse>("/vehicles", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // DELETE /vehicles/{id}
  delete: async (id: string): Promise<StandardResponse> => {
    return request<StandardResponse>(`/vehicles/${id}`, {
      method: "DELETE",
    });
  },
};
