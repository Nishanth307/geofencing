package services_test

import (
	"context"
	"testing"

	"geofencing/internal/models"
	"geofencing/internal/repositories/mocks"
	"geofencing/internal/services"
)

func TestVehicleService_Delete(t *testing.T) {
	ctx := context.Background()
	mockRepo := mocks.NewMockVehicleRepository()
	service := services.NewVehicleService(mockRepo)

	// Seed vehicle
	veh := &models.Vehicle{
		ID:            "veh_123",
		VehicleNumber: "KA-01-AB-1234",
		DriverName:    "Test Driver",
		Status:        "active",
	}
	_ = mockRepo.Create(ctx, veh)

	// 1. Successful deletion
	err := service.DeleteVehicle(ctx, "veh_123")
	if err != nil {
		t.Fatalf("expected successful vehicle deletion, got: %v", err)
	}

	// 2. Verify it is marked deleted
	found, _ := service.GetVehicle(ctx, "veh_123")
	if found != nil {
		t.Fatalf("expected vehicle to be deleted, but found: %+v", found)
	}

	// 3. Deleting non-existent returns error
	err = service.DeleteVehicle(ctx, "non_existent_id")
	if err == nil {
		t.Fatalf("expected error deleting non-existent vehicle, got nil")
	}

	// 4. Empty ID returns error
	err = service.DeleteVehicle(ctx, "")
	if err == nil {
		t.Fatalf("expected error deleting with empty vehicle ID, got nil")
	}
}

func TestGeofenceService_Delete(t *testing.T) {
	ctx := context.Background()
	mockRepo := mocks.NewMockGeofenceRepository()
	service := services.NewGeofenceService(mockRepo)

	// Seed geofence
	gf := &models.Geofence{
		ID:       "geo_123",
		Name:     "Test Zone",
		Category: "delivery_zone",
		Status:   "active",
	}
	_ = mockRepo.Create(ctx, gf)

	// 1. Successful deletion
	err := service.DeleteGeofence(ctx, "geo_123")
	if err != nil {
		t.Fatalf("expected successful geofence deletion, got: %v", err)
	}

	// 2. Verify deleted
	found, _ := service.GetGeofence(ctx, "geo_123")
	if found != nil {
		t.Fatalf("expected geofence to be deleted, but found: %+v", found)
	}

	// 3. Deleting non-existent returns error
	err = service.DeleteGeofence(ctx, "non_existent_id")
	if err == nil {
		t.Fatalf("expected error deleting non-existent geofence, got nil")
	}
}

func TestAlertService_DeleteRuleAndViolations(t *testing.T) {
	ctx := context.Background()
	mockRepo := mocks.NewMockAlertRepository()
	service := services.NewAlertService(mockRepo)

	// 1. Seed alert rule
	alert := &models.Alert{
		ID:         "alert_123",
		GeofenceID: "geo_123",
		VehicleID:  "veh_123",
		EventType:  "entry",
		Status:     "active",
	}
	_ = mockRepo.Create(ctx, alert)

	// Test DeleteAlert
	err := service.DeleteAlert(ctx, "alert_123")
	if err != nil {
		t.Fatalf("expected successful alert rule deletion, got: %v", err)
	}
	err = service.DeleteAlert(ctx, "non_existent")
	if err == nil {
		t.Fatalf("expected error deleting non-existent alert rule, got nil")
	}

	// 2. Seed violations
	v1 := &models.Violation{
		ID:            "viol_1",
		GeofenceID:    "geo_123",
		VehicleID:     "veh_123",
		VehicleNumber: "KA-01-AB-1234",
		EventType:     "entry",
		Status:        "active",
	}
	v2 := &models.Violation{
		ID:            "viol_2",
		GeofenceID:    "geo_123",
		VehicleID:     "veh_456",
		VehicleNumber: "KA-01-CD-5678",
		EventType:     "exit",
		Status:        "active",
	}
	_ = mockRepo.CreateViolation(ctx, v1)
	_ = mockRepo.CreateViolation(ctx, v2)

	// Test single violation delete
	err = service.DeleteViolation(ctx, "viol_1")
	if err != nil {
		t.Fatalf("expected successful violation deletion, got: %v", err)
	}

	// Verify only v2 remains
	remaining, _ := service.ListViolations(ctx)
	if len(remaining) != 1 || remaining[0].ID != "viol_2" {
		t.Fatalf("expected only viol_2 remaining, got %d violations", len(remaining))
	}

	// Test bulk delete
	_ = mockRepo.CreateViolation(ctx, &models.Violation{ID: "viol_3", Status: "active"})
	count, err := service.BulkDeleteViolations(ctx, []string{"viol_2", "viol_3"})
	if err != nil {
		t.Fatalf("expected successful bulk delete, got: %v", err)
	}
	if count != 2 {
		t.Fatalf("expected count 2, got %d", count)
	}

	// Test empty bulk delete list
	_, err = service.BulkDeleteViolations(ctx, []string{})
	if err == nil {
		t.Fatalf("expected error for empty bulk delete list, got nil")
	}
}

