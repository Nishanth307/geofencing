package repositories

import (
	"context"

	"geofencing/internal/models"
)

type LocationRepository interface {
	RecordLocation(ctx context.Context, loc *models.VehicleLocation) error
	GetLatestLocation(ctx context.Context, vehicleID string) (*models.LocationResponse, error)
}

