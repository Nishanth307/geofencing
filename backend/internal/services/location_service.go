package services

import (
	"context"
	"fmt"
	"time"

	"geofencing/internal/models"
	"geofencing/internal/repositories"
)

type LocationService struct {
	locRepo     repositories.LocationRepository
	vehicleRepo repositories.VehicleRepository
	dispatcher  *Dispatcher
}

func NewLocationService(locRepo repositories.LocationRepository, vehicleRepo repositories.VehicleRepository, dispatcher *Dispatcher) *LocationService {
	return &LocationService{
		locRepo:     locRepo,
		vehicleRepo: vehicleRepo,
		dispatcher:  dispatcher,
	}
}

func (s *LocationService) IngestLocation(ctx context.Context, req models.LocationRequest) (*models.LocationResponse, error) {
	if req.VehicleID == "" {
		return nil, fmt.Errorf("vehicle_id is required")
	}

	exists, err := s.vehicleRepo.Exists(ctx, req.VehicleID)
	if err != nil || !exists {
		return nil, fmt.Errorf("vehicle not found: %s", req.VehicleID)
	}

	now := time.Now()
	nowNs := now.UnixNano()

	loc := &models.VehicleLocation{
		VehicleID: req.VehicleID,
		Latitude:  req.Latitude,
		Longitude: req.Longitude,
		TimeNs:    nowNs,
		CreatedAt: now,
	}

	if err := s.locRepo.RecordLocation(ctx, loc); err != nil {
		return nil, fmt.Errorf("failed to record location: %w", err)
	}

	s.dispatcher.Dispatch(LocationUpdateEvent{
		VehicleID: req.VehicleID,
		Latitude:  req.Latitude,
		Longitude: req.Longitude,
		TimeNs:    nowNs,
	})

	return &models.LocationResponse{
		Status:    "success",
		VehicleID: req.VehicleID,
		Latitude:  req.Latitude,
		Longitude: req.Longitude,
		Timestamp: now,
	}, nil
}

func (s *LocationService) GetLatestLocation(ctx context.Context, vehicleID string) (*models.LocationResponse, error) {
	return s.locRepo.GetLatestLocation(ctx, vehicleID)
}
