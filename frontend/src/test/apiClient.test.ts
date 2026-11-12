import { describe, it, expect, vi, beforeEach } from "vitest";
import { request } from "@/services/api/apiClient";

describe("API Client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("successfully returns parsed JSON data on HTTP 200", async () => {
    const mockData = { status: "ok", time_ns: "12345" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
    });

    const result = await request<typeof mockData>("/health");
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/health"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("throws ApiError with message extracted from backend response on HTTP 400", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: async () => ({ error: "vehicle_number already registered" }),
    });

    await expect(request("/vehicles", { method: "POST" })).rejects.toThrow(
      "vehicle_number already registered"
    );
  });

  it("handles non-JSON error responses gracefully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      json: async () => {
        throw new Error("Not JSON");
      },
    });

    await expect(request("/geofences")).rejects.toThrow("HTTP 502: Bad Gateway");
  });
});
