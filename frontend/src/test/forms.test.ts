import { describe, it, expect } from "vitest";
import * as z from "zod";

const vehicleSchema = z.object({
  vehicle_number: z
    .string()
    .min(3, "Vehicle registration number must be at least 3 characters")
    .regex(/^[A-Za-z0-9\s-]+$/, "Alphanumeric, space, and hyphens only"),
  driver_name: z.string().min(2, "Driver name must be at least 2 characters"),
  vehicle_type: z.string().min(1, "Please choose a vehicle type"),
  phone: z
    .string()
    .min(6, "Phone number is too short")
    .regex(/^[0-9+\s()-]+$/, "Invalid phone number format"),
});

const geofenceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  category: z.string().min(1, "Please select a category"),
  coordinates: z.array(z.tuple([z.number(), z.number()])).min(3, "Minimum 3 vertices required"),
});

describe("Form Validation Schemas", () => {
  it("validates valid vehicle registration data", () => {
    const valid = {
      vehicle_number: "KA-01-AB-1234",
      driver_name: "Ramesh Kumar",
      vehicle_type: "Truck",
      phone: "+91 9876543210",
    };
    expect(() => vehicleSchema.parse(valid)).not.toThrow();
  });

  it("rejects invalid vehicle numbers or short driver names", () => {
    const invalid = {
      vehicle_number: "K#@",
      driver_name: "A",
      vehicle_type: "Truck",
      phone: "123",
    };
    const result = vehicleSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("validates geofence polygon with at least 3 vertices", () => {
    const valid = {
      name: "Bangalore Depot",
      category: "delivery_zone",
      coordinates: [
        [12.9716, 77.5946],
        [12.9716, 77.6046],
        [12.9616, 77.6046],
      ],
    };
    expect(() => geofenceSchema.parse(valid)).not.toThrow();
  });

  it("fails if geofence has fewer than 3 vertices", () => {
    const invalid = {
      name: "Bangalore Depot",
      category: "delivery_zone",
      coordinates: [[12.9716, 77.5946]],
    };
    const result = geofenceSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

