package repositories

import (
	"context"

	"geofencing/internal/models"
)

type GeofenceRepository interface {
	Create(ctx context.Context, g *models.Geofence) error
	FindAll(ctx context.Context) ([]models.Geofence, error)
	FindByID(ctx context.Context, id string) (*models.Geofence, error)
	Delete(ctx context.Context, id string) error
}

