import { request } from "./apiClient";
import {
  AlertRequest,
  AlertResponse,
  AlertListResponse,
} from "@/types/alert";
import { StandardResponse } from "@/types/api";

export const alertApi = {
  // GET /alerts
  list: async (): Promise<AlertListResponse> => {
    return request<AlertListResponse>("/alerts");
  },

  // POST /alerts/configure (or /alerts)
  configure: async (data: AlertRequest): Promise<AlertResponse> => {
    return request<AlertResponse>("/alerts/configure", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // DELETE /alerts/configure/{id} (or /alerts/{id})
  delete: async (id: string): Promise<StandardResponse> => {
    return request<StandardResponse>(`/alerts/configure/${id}`, {
      method: "DELETE",
    });
  },

  // GET /violations/history
  getHistory: async (): Promise<AlertListResponse> => {
    return request<AlertListResponse>("/violations/history");
  },
};
