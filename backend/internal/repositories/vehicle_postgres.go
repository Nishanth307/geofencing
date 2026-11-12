package repositories

import (
	"context"
	"database/sql"
	"fmt"

	"geofencing/internal/models"
)

type PostgresVehicleRepository struct {
	db *sql.DB
}

func NewPostgresVehicleRepository(db *sql.DB) *PostgresVehicleRepository {
	return &PostgresVehicleRepository{db: db}
}

func (r *PostgresVehicleRepository) Create(ctx context.Context, v *models.Vehicle) error {
	query := `
		INSERT INTO vehicles (id, vehicle_number, driver_name, vehicle_type, phone, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := r.db.ExecContext(ctx, query, v.ID, v.VehicleNumber, v.DriverName, v.VehicleType, v.Phone, v.Status, v.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to insert vehicle: %w", err)
	}
	return nil
}

func (r *PostgresVehicleRepository) FindAll(ctx context.Context) ([]models.Vehicle, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, vehicle_number, driver_name, vehicle_type, phone, status, created_at
		FROM vehicles
		WHERE status != 'deleted'
		ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to query vehicles: %w", err)
	}
	defer rows.Close()

	var result []models.Vehicle
	for rows.Next() {
		var v models.Vehicle
		if err := rows.Scan(&v.ID, &v.VehicleNumber, &v.DriverName, &v.VehicleType, &v.Phone, &v.Status, &v.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan vehicle: %w", err)
		}
		result = append(result, v)
	}

	if result == nil {
		result = []models.Vehicle{}
	}

	return result, nil
}

func (r *PostgresVehicleRepository) FindByID(ctx context.Context, id string) (*models.Vehicle, error) {
	var v models.Vehicle
	err := r.db.QueryRowContext(ctx, `
		SELECT id, vehicle_number, driver_name, vehicle_type, phone, status, created_at
		FROM vehicles
		WHERE id = $1 AND status != 'deleted'
	`, id).Scan(&v.ID, &v.VehicleNumber, &v.DriverName, &v.VehicleType, &v.Phone, &v.Status, &v.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to query vehicle %s: %w", id, err)
	}

	return &v, nil
}

func (r *PostgresVehicleRepository) Exists(ctx context.Context, id string) (bool, error) {
	var count int
	err := r.db.QueryRowContext(ctx, "SELECT COUNT(1) FROM vehicles WHERE id = $1 AND status != 'deleted'", id).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *PostgresVehicleRepository) Delete(ctx context.Context, id string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	res, err := tx.ExecContext(ctx, "UPDATE vehicles SET status = 'deleted' WHERE id = $1 AND status != 'deleted'", id)
	if err != nil {
		return fmt.Errorf("failed to delete vehicle: %w", err)
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return sql.ErrNoRows
	}

	// Deactivate any alert rules associated with this vehicle so future alerts stop
	_, _ = tx.ExecContext(ctx, "UPDATE alert_rules SET status = 'deleted' WHERE vehicle_id = $1", id)
	_, _ = tx.ExecContext(ctx, "UPDATE alerts SET status = 'deleted' WHERE vehicle_id = $1", id)

	return tx.Commit()
}

