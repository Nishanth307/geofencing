package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"geofencing/internal/models"
)

type PostgresLocationRepository struct {
	db *sql.DB
}

func NewPostgresLocationRepository(db *sql.DB) *PostgresLocationRepository {
	return &PostgresLocationRepository{db: db}
}

func (r *PostgresLocationRepository) RecordLocation(ctx context.Context, loc *models.VehicleLocation) error {
	query := `
		INSERT INTO vehicle_locations (vehicle_id, latitude, longitude, geom, time_ns, created_at)
		VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6, $7)
	`
	_, err := r.db.ExecContext(ctx, query, loc.VehicleID, loc.Latitude, loc.Longitude, loc.Longitude, loc.Latitude, loc.TimeNs, loc.CreatedAt)
	if err != nil {
		fallbackQuery := `
			INSERT INTO vehicle_locations (vehicle_id, latitude, longitude, time_ns, created_at)
			VALUES ($1, $2, $3, $4, $5)
		`
		if _, fallbackErr := r.db.ExecContext(ctx, fallbackQuery, loc.VehicleID, loc.Latitude, loc.Longitude, loc.TimeNs, loc.CreatedAt); fallbackErr != nil {
			return fmt.Errorf("failed to insert location: %w", err)
		}
	}
	return nil
}

func (r *PostgresLocationRepository) GetLatestLocation(ctx context.Context, vehicleID string) (*models.LocationResponse, error) {
	var lat, lon float64
	var createdAt time.Time
	var timeNs int64

	query := `
		SELECT latitude, longitude, time_ns, created_at
		FROM vehicle_locations
		WHERE vehicle_id = $1
		ORDER BY created_at DESC
		LIMIT 1
	`
	err := r.db.QueryRowContext(ctx, query, vehicleID).Scan(&lat, &lon, &timeNs, &createdAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to query location for vehicle %s: %w", vehicleID, err)
	}

	return &models.LocationResponse{
		Status:    "success",
		VehicleID: vehicleID,
		Latitude:  lat,
		Longitude: lon,
		Timestamp: createdAt,
	}, nil
}

