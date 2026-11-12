import { request } from "./apiClient";
import {
  Geofence,
  GeofenceRequest,
  GeofenceResponse,
  GeofenceListResponse,
} from "@/types/geofence";
import { StandardResponse } from "@/types/api";

export const geofenceApi = {
  // GET /geofences (or /api/v1/geofences)
  list: async (): Promise<GeofenceListResponse> => {
    return request<GeofenceListResponse>("/geofences");
  },

  // GET /geofences/{id}
  getById: async (id: string): Promise<{ geofence: Geofence; time_ns?: string }> => {
    return request<{ geofence: Geofence; time_ns?: string }>(`/geofences/${id}`);
  },

  // POST /geofences
  create: async (data: GeofenceRequest): Promise<GeofenceResponse> => {
    return request<GeofenceResponse>("/geofences", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // DELETE /geofences/{id}
  delete: async (id: string): Promise<StandardResponse> => {
    return request<StandardResponse>(`/geofences/${id}`, {
      method: "DELETE",
    });
  },
};
