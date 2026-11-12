package mocks

import (
	"context"

	"geofencing/internal/models"
)

type MockLocationRepository struct {
	Locations            []models.VehicleLocation
	RecordLocationFn     func(ctx context.Context, loc *models.VehicleLocation) error
	GetLatestLocationFn  func(ctx context.Context, vehicleID string) (*models.LocationResponse, error)
}

func NewMockLocationRepository() *MockLocationRepository {
	return &MockLocationRepository{
		Locations: make([]models.VehicleLocation, 0),
	}
}

func (m *MockLocationRepository) RecordLocation(ctx context.Context, loc *models.VehicleLocation) error {
	if m.RecordLocationFn != nil {
		return m.RecordLocationFn(ctx, loc)
	}
	m.Locations = append(m.Locations, *loc)
	return nil
}

func (m *MockLocationRepository) GetLatestLocation(ctx context.Context, vehicleID string) (*models.LocationResponse, error) {
	if m.GetLatestLocationFn != nil {
		return m.GetLatestLocationFn(ctx, vehicleID)
	}
	for i := len(m.Locations) - 1; i >= 0; i-- {
		loc := m.Locations[i]
		if loc.VehicleID == vehicleID {
			return &models.LocationResponse{
				Status:    "success",
				VehicleID: loc.VehicleID,
				Latitude:  loc.Latitude,
				Longitude: loc.Longitude,
				Timestamp: loc.CreatedAt,
			}, nil
		}
	}
	return nil, nil
}

