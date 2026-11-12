import { describe, it, expect } from "vitest";
import {
  formatTimeNs,
  formatDate,
  isValidCoordinate,
  getCategoryStyle,
  cn,
} from "@/lib/utils";

describe("Utils & Helpers", () => {
  it("formats nanoseconds into microseconds and milliseconds properly", () => {
    expect(formatTimeNs("500000")).toBe("500.0µs");
    expect(formatTimeNs("15000000")).toBe("15.00ms");
    expect(formatTimeNs("")).toBe("0ms");
  });

  it("validates geographic coordinates accurately", () => {
    expect(isValidCoordinate(12.9716, 77.5946)).toBe(true);
    expect(isValidCoordinate(90, 180)).toBe(true);
    expect(isValidCoordinate(-90, -180)).toBe(true);
    expect(isValidCoordinate(95, 77)).toBe(false);
    expect(isValidCoordinate(12, 190)).toBe(false);
  });

  it("returns distinct styles for geofence categories", () => {
    const restricted = getCategoryStyle("restricted_zone");
    expect(restricted.stroke).toBe("#ef4444");

    const delivery = getCategoryStyle("delivery_zone");
    expect(delivery.stroke).toBe("#3b82f6");

    const fallback = getCategoryStyle("unknown_zone");
    expect(fallback.stroke).toBe("#64748b");
  });

  it("formats dates gracefully without throwing errors", () => {
    expect(formatDate("")).toBe("N/A");
    expect(formatDate("invalid-date-string")).toBe("invalid-date-string");
    expect(formatDate("2025-01-15T10:30:00Z")).toContain("2025");
  });

  it("merges tailwind classes cleanly", () => {
    expect(cn("px-2 py-1", "px-4")).toContain("px-4");
    expect(cn("text-red-500", undefined, "bg-white")).toBe("text-red-500 bg-white");
  });
});

