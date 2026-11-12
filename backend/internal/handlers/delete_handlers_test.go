package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"

	"geofencing/internal/handlers"
	"geofencing/internal/models"
	"geofencing/internal/repositories/mocks"
	"geofencing/internal/services"
)

func TestDeleteEndpointsHTTP(t *testing.T) {
	ctx := context.Background()

	// 1. Vehicle Handler
	vMock := mocks.NewMockVehicleRepository()
	_ = vMock.Create(ctx, &models.Vehicle{ID: "veh_101", VehicleNumber: "KA-01-AB-1010", Status: "active"})
	vService := services.NewVehicleService(vMock)
	vHandler := handlers.NewVehicleHandler(vService)

	// Test DELETE /vehicles/{id} - Success
	req := httptest.NewRequest("DELETE", "/vehicles/veh_101", nil)
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", "veh_101")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
	w := httptest.NewRecorder()
	vHandler.DeleteVehicle(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", w.Code, w.Body.String())
	}
	var resp models.StandardResponse
	_ = json.Unmarshal(w.Body.Bytes(), &resp)
	if !resp.Success || resp.Message != "Vehicle deleted successfully" {
		t.Fatalf("unexpected response: %+v", resp)
	}

	// Test DELETE /vehicles/{id} - 404 Not Found
	req404 := httptest.NewRequest("DELETE", "/vehicles/veh_101", nil)
	rctx404 := chi.NewRouteContext()
	rctx404.URLParams.Add("id", "veh_101") // already deleted
	req404 = req404.WithContext(context.WithValue(req404.Context(), chi.RouteCtxKey, rctx404))
	w404 := httptest.NewRecorder()
	vHandler.DeleteVehicle(w404, req404)
	if w404.Code != http.StatusNotFound {
		t.Fatalf("expected status 404, got %d: %s", w404.Code, w404.Body.String())
	}

	// 2. Geofence Handler
	gMock := mocks.NewMockGeofenceRepository()
	_ = gMock.Create(ctx, &models.Geofence{ID: "geo_202", Name: "Hub", Status: "active"})
	gService := services.NewGeofenceService(gMock)
	gHandler := handlers.NewGeofenceHandler(gService)

	// Test DELETE /geofences/{id} - Success
	gReq := httptest.NewRequest("DELETE", "/geofences/geo_202", nil)
	gRctx := chi.NewRouteContext()
	gRctx.URLParams.Add("id", "geo_202")
	gReq = gReq.WithContext(context.WithValue(gReq.Context(), chi.RouteCtxKey, gRctx))
	gW := httptest.NewRecorder()
	gHandler.DeleteGeofence(gW, gReq)
	if gW.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", gW.Code)
	}

	// 3. Alert Handler
	aMock := mocks.NewMockAlertRepository()
	_ = aMock.Create(ctx, &models.Alert{ID: "alt_303", GeofenceID: "g1", VehicleID: "v1", Status: "active"})
	_ = aMock.CreateViolation(ctx, &models.Violation{ID: "vio_404", Status: "active"})
	_ = aMock.CreateViolation(ctx, &models.Violation{ID: "vio_405", Status: "active"})
	aService := services.NewAlertService(aMock)
	aHandler := handlers.NewAlertHandler(aService)

	// Test DELETE /alerts/configure/{id} - Success
	aReq := httptest.NewRequest("DELETE", "/alerts/configure/alt_303", nil)
	aRctx := chi.NewRouteContext()
	aRctx.URLParams.Add("id", "alt_303")
	aReq = aReq.WithContext(context.WithValue(aReq.Context(), chi.RouteCtxKey, aRctx))
	aW := httptest.NewRecorder()
	aHandler.DeleteAlert(aW, aReq)
	if aW.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", aW.Code)
	}

	// Test DELETE /violations/{id} - Success
	vReq := httptest.NewRequest("DELETE", "/violations/vio_404", nil)
	vRctx := chi.NewRouteContext()
	vRctx.URLParams.Add("id", "vio_404")
	vReq = vReq.WithContext(context.WithValue(vReq.Context(), chi.RouteCtxKey, vRctx))
	vW := httptest.NewRecorder()
	aHandler.DeleteViolation(vW, vReq)
	if vW.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", vW.Code)
	}

	// Test POST /violations/bulk-delete - Success
	bulkPayload := models.BulkDeleteViolationsRequest{
		ViolationIDs: []string{"vio_405"},
	}
	body, _ := json.Marshal(bulkPayload)
	bulkReq := httptest.NewRequest("POST", "/violations/bulk-delete", bytes.NewReader(body))
	bulkW := httptest.NewRecorder()
	aHandler.BulkDeleteViolations(bulkW, bulkReq)
	if bulkW.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", bulkW.Code, bulkW.Body.String())
	}
	var bulkResp models.BulkDeleteResponse
	_ = json.Unmarshal(bulkW.Body.Bytes(), &bulkResp)
	if !bulkResp.Success || bulkResp.DeletedCount != 1 {
		t.Fatalf("expected 1 deleted violation, got %+v", bulkResp)
	}
}

