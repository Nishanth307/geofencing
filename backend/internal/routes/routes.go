package routes

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"geofencing/internal/handlers"
	"geofencing/pkg/response"
	"geofencing/pkg/utils"
)

type Config struct {
	GeofenceHandler *handlers.GeofenceHandler
	VehicleHandler  *handlers.VehicleHandler
	LocationHandler *handlers.LocationHandler
	AlertHandler    *handlers.AlertHandler
	WSHandler       *handlers.WSHandler
}

// SetupRoutes registers all REST and WebSocket endpoints with Chi and applies middleware.
func SetupRoutes(cfg Config) http.Handler {
	r := chi.NewRouter()

	// --- Global middleware ---
	r.Use(middleware.RealIP)          // honour X-Forwarded-For / X-Real-IP
	r.Use(middleware.Recoverer)       // recover panics, return 500
	r.Use(utils.ChiRequestIDAndTimer) // X-Request-ID + timing header
	r.Use(utils.ChiCORS)              // CORS headers

	// Health check
	r.Get("/health", func(w http.ResponseWriter, req *http.Request) {
		response.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	// WebSocket streams (support both /ws and /ws/alerts)
	r.Get("/ws", cfg.WSHandler.HandleWebSocket)
	r.Get("/ws/alerts", cfg.WSHandler.HandleWebSocket)

	registerEndpoints := func(router chi.Router) {
		// Geofences
		router.Post("/geofences", cfg.GeofenceHandler.CreateGeofence)
		router.Get("/geofences", cfg.GeofenceHandler.ListGeofences)
		router.Get("/geofences/{id}", cfg.GeofenceHandler.GetGeofence)
		router.Delete("/geofences/{id}", cfg.GeofenceHandler.DeleteGeofence)

		// Vehicles
		router.Post("/vehicles", cfg.VehicleHandler.CreateVehicle)
		router.Get("/vehicles", cfg.VehicleHandler.ListVehicles)
		router.Get("/vehicles/{id}", cfg.VehicleHandler.GetVehicle)
		router.Delete("/vehicles/{id}", cfg.VehicleHandler.DeleteVehicle)
		router.Get("/vehicles/{id}/location", cfg.LocationHandler.GetLatestLocation)
		router.Get("/vehicles/location/{vehicle_id}", cfg.LocationHandler.GetLatestLocation)
		router.Post("/vehicles/location", cfg.LocationHandler.IngestLocation)

		// Locations / Telemetry
		router.Post("/locations", cfg.LocationHandler.IngestLocation)
		router.Get("/locations/{vehicle_id}", cfg.LocationHandler.GetLatestLocation)

		// Alerts / Alert Rules
		router.Post("/alerts", cfg.AlertHandler.CreateAlert)
		router.Post("/alerts/configure", cfg.AlertHandler.CreateAlert)
		router.Get("/alerts", cfg.AlertHandler.ListAlerts)
		router.Delete("/alerts/{id}", cfg.AlertHandler.DeleteAlert)
		router.Delete("/alerts/configure/{id}", cfg.AlertHandler.DeleteAlert)

		// Violations History
		router.Get("/violations", cfg.AlertHandler.ListViolations)
		router.Get("/violations/history", cfg.AlertHandler.ListViolations)
		router.Delete("/violations/{id}", cfg.AlertHandler.DeleteViolation)
		router.Post("/violations/bulk-delete", cfg.AlertHandler.BulkDeleteViolations)
	}

	// Register root-level paths (standard README convention)
	registerEndpoints(r)

	// Register API v1 prefixed paths as well
	r.Route("/api/v1", registerEndpoints)

	return r
}
