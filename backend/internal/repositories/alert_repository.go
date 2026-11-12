package repositories

import (
	"context"

	"geofencing/internal/models"
)

type AlertRepository interface {
	Create(ctx context.Context, a *models.Alert) error
	FindAll(ctx context.Context) ([]models.AlertItem, error)
	GetLastEventType(ctx context.Context, vehicleID, geofenceID string) (string, error)
	DeleteAlert(ctx context.Context, id string) error

	// Violations
	CreateViolation(ctx context.Context, v *models.Violation) error
	FindAllViolations(ctx context.Context) ([]models.Violation, error)
	DeleteViolation(ctx context.Context, id string) error
	BulkDeleteViolations(ctx context.Context, ids []string) (int, error)

	// Rule check for dispatcher
	HasMatchingRule(ctx context.Context, geofenceID, vehicleID, eventType string) (bool, error)
}

