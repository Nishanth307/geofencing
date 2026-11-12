package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"geofencing/internal/models"
)

type PostgresAlertRepository struct {
	db *sql.DB
}

func NewPostgresAlertRepository(db *sql.DB) *PostgresAlertRepository {
	return &PostgresAlertRepository{db: db}
}

func (r *PostgresAlertRepository) Create(ctx context.Context, a *models.Alert) error {
	// 1. Insert into alert_rules table
	ruleQuery := `
		INSERT INTO alert_rules (id, geofence_id, vehicle_id, event_type, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, event_type = EXCLUDED.event_type
	`
	_, _ = r.db.ExecContext(ctx, ruleQuery, a.ID, a.GeofenceID, a.VehicleID, a.EventType, a.Status, a.CreatedAt)

	// 2. Also insert into legacy alerts table for backward compatibility
	legacyQuery := `
		INSERT INTO alerts (id, geofence_id, vehicle_id, event_type, status, time_ns, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, event_type = EXCLUDED.event_type
	`
	_, err := r.db.ExecContext(ctx, legacyQuery, a.ID, a.GeofenceID, a.VehicleID, a.EventType, a.Status, a.CreatedAt.UnixNano(), a.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to insert alert: %w", err)
	}
	return nil
}

func (r *PostgresAlertRepository) FindAll(ctx context.Context) ([]models.AlertItem, error) {
	// Query configured alert rules
	query := `
		SELECT a.id, a.geofence_id, COALESCE(g.name, ''), COALESCE(a.vehicle_id, ''), COALESCE(v.vehicle_number, ''), a.event_type, a.status, a.created_at
		FROM alert_rules a
		LEFT JOIN geofences g ON a.geofence_id = g.id
		LEFT JOIN vehicles v ON a.vehicle_id = v.id
		WHERE a.status != 'deleted'
		ORDER BY a.created_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query)
	if err == nil {
		defer rows.Close()
		var result []models.AlertItem
		for rows.Next() {
			var item models.AlertItem
			if err := rows.Scan(&item.AlertID, &item.GeofenceID, &item.GeofenceName, &item.VehicleID, &item.VehicleNumber, &item.EventType, &item.Status, &item.CreatedAt); err == nil {
				result = append(result, item)
			}
		}
		if len(result) > 0 {
			return result, nil
		}
	}

	// Fallback to legacy alerts table if alert_rules is empty
	fallbackQuery := `
		SELECT a.id, a.geofence_id, COALESCE(g.name, ''), COALESCE(a.vehicle_id, ''), COALESCE(v.vehicle_number, ''), a.event_type, a.status, a.created_at
		FROM alerts a
		LEFT JOIN geofences g ON a.geofence_id = g.id
		LEFT JOIN vehicles v ON a.vehicle_id = v.id
		WHERE a.status != 'deleted'
		ORDER BY a.created_at DESC
	`
	fRows, err := r.db.QueryContext(ctx, fallbackQuery)
	if err != nil {
		return []models.AlertItem{}, nil
	}
	defer fRows.Close()

	var result []models.AlertItem
	for fRows.Next() {
		var item models.AlertItem
		if err := fRows.Scan(&item.AlertID, &item.GeofenceID, &item.GeofenceName, &item.VehicleID, &item.VehicleNumber, &item.EventType, &item.Status, &item.CreatedAt); err == nil {
			result = append(result, item)
		}
	}

	if result == nil {
		result = []models.AlertItem{}
	}
	return result, nil
}

func (r *PostgresAlertRepository) DeleteAlert(ctx context.Context, id string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	res1, _ := tx.ExecContext(ctx, "UPDATE alert_rules SET status = 'deleted' WHERE id = $1 AND status != 'deleted'", id)
	res2, _ := tx.ExecContext(ctx, "UPDATE alerts SET status = 'deleted' WHERE id = $1 AND status != 'deleted'", id)

	var r1, r2 int64
	if res1 != nil {
		r1, _ = res1.RowsAffected()
	}
	if res2 != nil {
		r2, _ = res2.RowsAffected()
	}

	if r1 == 0 && r2 == 0 {
		return sql.ErrNoRows
	}

	return tx.Commit()
}

func (r *PostgresAlertRepository) CreateViolation(ctx context.Context, v *models.Violation) error {
	query := `
		INSERT INTO violations (id, geofence_id, geofence_name, vehicle_id, vehicle_number, driver_name, event_type, latitude, longitude, status, time_ns, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status
	`
	_, _ = r.db.ExecContext(ctx, query, v.ID, v.GeofenceID, v.GeofenceName, v.VehicleID, v.VehicleNumber, v.DriverName, v.EventType, v.Latitude, v.Longitude, v.Status, v.CreatedAt.UnixNano(), v.CreatedAt)

	// Also insert into legacy alerts table so any existing consumers see the event
	legacyQuery := `
		INSERT INTO alerts (id, geofence_id, vehicle_id, event_type, status, time_ns, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status
	`
	_, _ = r.db.ExecContext(ctx, legacyQuery, v.ID, v.GeofenceID, v.VehicleID, v.EventType, v.Status, v.CreatedAt.UnixNano(), v.CreatedAt)
	return nil
}

func (r *PostgresAlertRepository) FindAllViolations(ctx context.Context) ([]models.Violation, error) {
	query := `
		SELECT id, COALESCE(geofence_id, ''), COALESCE(geofence_name, ''), COALESCE(vehicle_id, ''), COALESCE(vehicle_number, ''), COALESCE(driver_name, ''), event_type, COALESCE(latitude, 0), COALESCE(longitude, 0), status, created_at
		FROM violations
		WHERE status != 'deleted'
		ORDER BY created_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query)
	if err == nil {
		defer rows.Close()
		var list []models.Violation
		for rows.Next() {
			var v models.Violation
			if err := rows.Scan(&v.ID, &v.GeofenceID, &v.GeofenceName, &v.VehicleID, &v.VehicleNumber, &v.DriverName, &v.EventType, &v.Latitude, &v.Longitude, &v.Status, &v.CreatedAt); err == nil {
				list = append(list, v)
			}
		}
		if len(list) > 0 {
			return list, nil
		}
	}

	// Fallback to alerts table if violations is empty
	fallbackQuery := `
		SELECT a.id, COALESCE(a.geofence_id, ''), COALESCE(g.name, ''), COALESCE(a.vehicle_id, ''), COALESCE(v.vehicle_number, ''), COALESCE(v.driver_name, ''), a.event_type, 0.0, 0.0, a.status, a.created_at
		FROM alerts a
		LEFT JOIN geofences g ON a.geofence_id = g.id
		LEFT JOIN vehicles v ON a.vehicle_id = v.id
		WHERE a.status != 'deleted'
		ORDER BY a.created_at DESC
	`
	fRows, err := r.db.QueryContext(ctx, fallbackQuery)
	if err != nil {
		return []models.Violation{}, nil
	}
	defer fRows.Close()

	var result []models.Violation
	for fRows.Next() {
		var v models.Violation
		if err := fRows.Scan(&v.ID, &v.GeofenceID, &v.GeofenceName, &v.VehicleID, &v.VehicleNumber, &v.DriverName, &v.EventType, &v.Latitude, &v.Longitude, &v.Status, &v.CreatedAt); err == nil {
			result = append(result, v)
		}
	}

	if result == nil {
		result = []models.Violation{}
	}
	return result, nil
}

func (r *PostgresAlertRepository) DeleteViolation(ctx context.Context, id string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	res1, _ := tx.ExecContext(ctx, "UPDATE violations SET status = 'deleted' WHERE id = $1 AND status != 'deleted'", id)
	res2, _ := tx.ExecContext(ctx, "UPDATE alerts SET status = 'deleted' WHERE id = $1 AND status != 'deleted'", id)

	var r1, r2 int64
	if res1 != nil {
		r1, _ = res1.RowsAffected()
	}
	if res2 != nil {
		r2, _ = res2.RowsAffected()
	}

	if r1 == 0 && r2 == 0 {
		return sql.ErrNoRows
	}

	return tx.Commit()
}

func (r *PostgresAlertRepository) BulkDeleteViolations(ctx context.Context, ids []string) (int, error) {
	if len(ids) == 0 {
		return 0, nil
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	// Build placeholders: $1, $2, ...
	placeholders := make([]string, len(ids))
	args := make([]any, len(ids))
	for i, id := range ids {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = id
	}
	inClause := strings.Join(placeholders, ", ")

	vQuery := fmt.Sprintf("UPDATE violations SET status = 'deleted' WHERE id IN (%s) AND status != 'deleted'", inClause)
	res1, err := tx.ExecContext(ctx, vQuery, args...)
	if err != nil {
		return 0, fmt.Errorf("failed to bulk delete violations: %w", err)
	}

	aQuery := fmt.Sprintf("UPDATE alerts SET status = 'deleted' WHERE id IN (%s) AND status != 'deleted'", inClause)
	res2, _ := tx.ExecContext(ctx, aQuery, args...)

	var count int64
	if res1 != nil {
		c, _ := res1.RowsAffected()
		count = c
	}
	if count == 0 && res2 != nil {
		c, _ := res2.RowsAffected()
		count = c
	}

	if err := tx.Commit(); err != nil {
		return 0, err
	}

	return int(count), nil
}

func (r *PostgresAlertRepository) HasMatchingRule(ctx context.Context, geofenceID, vehicleID, eventType string) (bool, error) {
	// First check if there are any active rules in the entire alert_rules table
	var totalRules int
	err := r.db.QueryRowContext(ctx, "SELECT COUNT(1) FROM alert_rules WHERE status = 'active'").Scan(&totalRules)
	if err == nil && totalRules == 0 {
		// If no rules are defined at all, trigger by default
		return true, nil
	}

	// Check if an active rule matches this geofence, vehicle (or global), and eventType (or both)
	var count int
	query := `
		SELECT COUNT(1)
		FROM alert_rules
		WHERE geofence_id = $1
		  AND (vehicle_id IS NULL OR vehicle_id = '' OR vehicle_id = $2)
		  AND (event_type = $3 OR event_type = 'both')
		  AND status = 'active'
	`
	err = r.db.QueryRowContext(ctx, query, geofenceID, vehicleID, eventType).Scan(&count)
	if err != nil {
		return true, nil // Fallback to allowing event on error
	}

	return count > 0, nil
}

func (r *PostgresAlertRepository) GetLastEventType(ctx context.Context, vehicleID, geofenceID string) (string, error) {
	var eventType string
	err := r.db.QueryRowContext(ctx,
		"SELECT event_type FROM alerts WHERE vehicle_id = $1 AND geofence_id = $2 ORDER BY created_at DESC LIMIT 1",
		vehicleID, geofenceID,
	).Scan(&eventType)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", nil
		}
		return "", err
	}
	return eventType, nil
}
