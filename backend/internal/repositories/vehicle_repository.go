package repositories

import (
	"context"

	"geofencing/internal/models"
)

type VehicleRepository interface {
	Create(ctx context.Context, v *models.Vehicle) error
	FindAll(ctx context.Context) ([]models.Vehicle, error)
	FindByID(ctx context.Context, id string) (*models.Vehicle, error)
	Exists(ctx context.Context, id string) (bool, error)
	Delete(ctx context.Context, id string) error
}

