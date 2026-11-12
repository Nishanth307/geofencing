package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"geofencing/internal/config"
	"geofencing/internal/handlers"
	"geofencing/internal/repositories"
	"geofencing/internal/routes"
	"geofencing/internal/services"
	"geofencing/pkg/logger"
)

func main() {
	cfg, err := config.LoadConfig(".")
	if err != nil {
		logger.Fatalf("Cannot load config: %v", err)
	}
	logger.Infof("Starting Geofencing System on port :%s", cfg.Port)

	// 1. Database Connection & Migrations
	pgDB, err := repositories.NewPostgresDB(cfg.PostgresConnectionString())
	if err != nil {
		logger.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}
	defer pgDB.Close()
	logger.Info("Connected to PostgreSQL")

	if err := repositories.RunMigrations(pgDB); err != nil {
		logger.Warnf("Migration error: %v", err)
	} else {
		logger.Info("Database migrations applied successfully")
	}

	// 2. Redis Connection (Optional cache fallback)
	rdb, err := repositories.NewRedisClient(cfg.RedisAddr(), cfg.RedisPassword, cfg.RedisDB)
	if err != nil {
		logger.Warnf("Failed to connect to Redis at %s (%v). Running without Redis cache.", cfg.RedisAddr(), err)
		rdb = nil
	} else {
		logger.Infof("Connected to Redis at %s", cfg.RedisAddr())
		defer rdb.Close()
	}

	// 3. Repositories
	geofenceRepo := repositories.NewPostgresGeofenceRepository(pgDB)
	vehicleRepo := repositories.NewPostgresVehicleRepository(pgDB)
	locationRepo := repositories.NewPostgresLocationRepository(pgDB)
	alertRepo := repositories.NewPostgresAlertRepository(pgDB)

	// 4. WebSocket Hub
	wsHub := services.NewWSHub()
	go wsHub.Run()

	// 5. Async Alert Dispatcher
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	dispatcher := services.NewDispatcher(geofenceRepo, vehicleRepo, alertRepo, rdb, wsHub)
	dispatcher.Start(ctx)

	// 6. Services
	geofenceService := services.NewGeofenceService(geofenceRepo)
	vehicleService := services.NewVehicleService(vehicleRepo)
	locationService := services.NewLocationService(locationRepo, vehicleRepo, dispatcher)
	alertService := services.NewAlertService(alertRepo)

	// 7. Handlers
	geofenceHandler := handlers.NewGeofenceHandler(geofenceService)
	vehicleHandler := handlers.NewVehicleHandler(vehicleService)
	locationHandler := handlers.NewLocationHandler(locationService)
	alertHandler := handlers.NewAlertHandler(alertService)
	wsHandler := handlers.NewWSHandler(wsHub)

	// 8. Routes & Middleware Setup
	appRouter := routes.SetupRoutes(routes.Config{
		GeofenceHandler: geofenceHandler,
		VehicleHandler:  vehicleHandler,
		LocationHandler: locationHandler,
		AlertHandler:    alertHandler,
		WSHandler:       wsHandler,
	})

	// 9. HTTP Server
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      appRouter,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		logger.Infof("HTTP server listening on http://localhost:%s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Fatalf("HTTP server failed: %v", err)
		}
	}()

	// 10. Graceful Shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	sig := <-quit
	logger.Infof("Received signal %v. Initiating graceful shutdown...", sig)

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Fatalf("Server forced to shutdown: %v", err)
	}

	logger.Info("Server exited gracefully")
}
