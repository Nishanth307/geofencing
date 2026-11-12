import { request } from "./apiClient";
import { AlertListResponse } from "@/types/alert";
import { StandardResponse, BulkDeleteResponse } from "@/types/api";

export const violationApi = {
  // GET /violations/history
  list: async (): Promise<AlertListResponse> => {
    return request<AlertListResponse>("/violations/history");
  },

  // DELETE /violations/{id}
  delete: async (id: string): Promise<StandardResponse> => {
    return request<StandardResponse>(`/violations/${id}`, {
      method: "DELETE",
    });
  },

  // POST /violations/bulk-delete
  bulkDelete: async (ids: string[]): Promise<BulkDeleteResponse> => {
    return request<BulkDeleteResponse>("/violations/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ violation_ids: ids }),
    });
  },
};

