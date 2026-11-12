import { request } from "./apiClient";
import { LocationRequest, LocationResponse } from "@/types/location";

export const locationApi = {
  // POST /vehicles/location or /locations
  updateLocation: async (data: LocationRequest): Promise<LocationResponse> => {
    return request<LocationResponse>("/vehicles/location", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // GET /vehicles/location/{vehicle_id}
  getLatestLocation: async (vehicleId: string): Promise<LocationResponse> => {
    return request<LocationResponse>(`/vehicles/location/${vehicleId}`);
  },
};

