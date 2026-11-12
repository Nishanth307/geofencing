import { describe, it, expect } from "vitest";
import { WsEvent } from "@/types/websocket";

describe("WebSocket Event Parsing", () => {
  it("correctly parses and validates incoming backend event payload", () => {
    const rawBackendJson = JSON.stringify({
      event_id: "evt_999",
      event_type: "entry",
      timestamp: "2025-01-15T10:35:00Z",
      vehicle: {
        vehicle_id: "veh_456",
        vehicle_number: "KA-01-AB-1234",
        driver_name: "John Doe",
      },
      geofence: {
        geofence_id: "geo_123",
        geofence_name: "Restricted Zone",
        category: "restricted_zone",
      },
      location: {
        latitude: 12.9716,
        longitude: 77.5946,
      },
    });

    const parsed: WsEvent = JSON.parse(rawBackendJson);

    expect(parsed.event_id).toBe("evt_999");
    expect(parsed.event_type).toBe("entry");
    expect(parsed.vehicle.vehicle_number).toBe("KA-01-AB-1234");
    expect(parsed.geofence?.category).toBe("restricted_zone");
    expect(parsed.location.latitude).toBe(12.9716);
    expect(parsed.location.longitude).toBe(77.5946);
  });
});

