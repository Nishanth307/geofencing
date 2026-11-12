import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog";
import { vehicleApi } from "@/services/api/vehicleApi";
import { geofenceApi } from "@/services/api/geofenceApi";
import { alertApi } from "@/services/api/alertApi";
import { violationApi } from "@/services/api/violationApi";

describe("DeleteConfirmationDialog Component", () => {
  it("renders dialog with title, resource name, consequences and buttons", () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <DeleteConfirmationDialog
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title="Delete Vehicle?"
        resourceName="KA-01-AB-1234"
        description="Are you sure you want to delete this vehicle?"
        consequences="Associated alerts will be deactivated."
        confirmText="Delete Vehicle"
      />
    );

    expect(screen.getByText("Delete Vehicle?")).toBeInTheDocument();
    expect(screen.getByText("KA-01-AB-1234")).toBeInTheDocument();
    expect(
      screen.getByText("Associated alerts will be deactivated.")
    ).toBeInTheDocument();

    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    const deleteBtn = screen.getByRole("button", { name: /Delete Vehicle/i });

    expect(cancelBtn).toBeInTheDocument();
    expect(deleteBtn).toBeInTheDocument();
  });

  it("handles Cancel button click", () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <DeleteConfirmationDialog
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title="Delete Geofence?"
        resourceName="Central Depot"
        description="Delete confirmation test"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(handleConfirm).not.toHaveBeenCalled();
  });

  it("handles Confirm button click", () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <DeleteConfirmationDialog
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title="Delete Alert Rule?"
        description="Delete confirmation test"
        confirmText="Delete Rule"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Delete Rule/i }));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it("disables buttons and shows spinner during isPending loading state", () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <DeleteConfirmationDialog
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title="Delete Record?"
        description="Processing deletion..."
        isPending={true}
      />
    );

    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    const deleteBtn = screen.getByRole("button", { name: /Deleting.../i });

    expect(cancelBtn).toBeDisabled();
    expect(deleteBtn).toBeDisabled();
  });
});

describe("Delete API Methods", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("vehicleApi.delete sends DELETE /vehicles/:id", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, message: "Vehicle deleted successfully" }),
    });
    global.fetch = mockFetch;

    const res = await vehicleApi.delete("veh_123");
    expect(res.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/vehicles/veh_123"),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("geofenceApi.delete sends DELETE /geofences/:id", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, message: "Geofence deleted successfully" }),
    });
    global.fetch = mockFetch;

    const res = await geofenceApi.delete("geo_456");
    expect(res.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/geofences/geo_456"),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("alertApi.delete sends DELETE /alerts/configure/:id", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, message: "Alert rule deleted successfully" }),
    });
    global.fetch = mockFetch;

    const res = await alertApi.delete("alt_789");
    expect(res.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/alerts/configure/alt_789"),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("violationApi.delete sends DELETE /violations/:id", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, message: "Violation deleted successfully" }),
    });
    global.fetch = mockFetch;

    const res = await violationApi.delete("vio_999");
    expect(res.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/violations/vio_999"),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("violationApi.bulkDelete sends POST /violations/bulk-delete with violation_ids", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        deleted_count: 2,
        message: "2 violations deleted successfully",
      }),
    });
    global.fetch = mockFetch;

    const res = await violationApi.bulkDelete(["vio_1", "vio_2"]);
    expect(res.success).toBe(true);
    expect(res.deleted_count).toBe(2);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/violations/bulk-delete"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ violation_ids: ["vio_1", "vio_2"] }),
      })
    );
  });
});
