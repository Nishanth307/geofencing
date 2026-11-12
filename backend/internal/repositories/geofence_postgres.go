package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"geofencing/internal/models"
)

type PostgresGeofenceRepository struct {
	db *sql.DB
}

func NewPostgresGeofenceRepository(db *sql.DB) *PostgresGeofenceRepository {
	return &PostgresGeofenceRepository{db: db}
}

func (r *PostgresGeofenceRepository) Create(ctx context.Context, g *models.Geofence) error {
	coords := g.Coordinates
	first := coords[0]
	last := coords[len(coords)-1]
	if first[0] != last[0] || first[1] != last[1] {
		coords = append(coords, first)
	}

	coordsJSON, err := json.Marshal(coords)
	if err != nil {
		return fmt.Errorf("failed to encode coordinates: %w", err)
	}

	var wktPoints []string
	for _, pt := range coords {
		wktPoints = append(wktPoints, fmt.Sprintf("%f %f", pt[1], pt[0]))
	}
	wkt := fmt.Sprintf("SRID=4326;POLYGON((%s))", strings.Join(wktPoints, ", "))

	query := `
		INSERT INTO geofences (id, name, description, category, coordinates, geom, status, created_at)
		VALUES ($1, $2, $3, $4, $5, ST_GeomFromEWKT($6), $7, $8)
	`
	_, err = r.db.ExecContext(ctx, query, g.ID, g.Name, g.Description, g.Category, coordsJSON, wkt, g.Status, g.CreatedAt)
	if err != nil {
		fallbackQuery := `
			INSERT INTO geofences (id, name, description, category, coordinates, status, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`
		if _, fallbackErr := r.db.ExecContext(ctx, fallbackQuery, g.ID, g.Name, g.Description, g.Category, coordsJSON, g.Status, g.CreatedAt); fallbackErr != nil {
			return fmt.Errorf("failed to insert geofence: %w", err)
		}
	}

	return nil
}

func (r *PostgresGeofenceRepository) FindAll(ctx context.Context) ([]models.Geofence, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, name, description, category, coordinates, status, created_at
		FROM geofences
		WHERE status != 'deleted'
		ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to query geofences: %w", err)
	}
	defer rows.Close()

	var result []models.Geofence
	for rows.Next() {
		var g models.Geofence
		var coordsJSON []byte
		var desc, cat sql.NullString

		if err := rows.Scan(&g.ID, &g.Name, &desc, &cat, &coordsJSON, &g.Status, &g.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan geofence: %w", err)
		}

		g.Description = desc.String
		g.Category = cat.String

		var coords [][2]float64
		if err := json.Unmarshal(coordsJSON, &coords); err == nil {
			g.Coordinates = coords
		}

		result = append(result, g)
	}

	if result == nil {
		result = []models.Geofence{}
	}

	return result, nil
}

func (r *PostgresGeofenceRepository) FindByID(ctx context.Context, id string) (*models.Geofence, error) {
	var g models.Geofence
	var coordsJSON []byte
	var desc, cat sql.NullString

	err := r.db.QueryRowContext(ctx, `
		SELECT id, name, description, category, coordinates, status, created_at
		FROM geofences
		WHERE id = $1 AND status != 'deleted'
	`, id).Scan(&g.ID, &g.Name, &desc, &cat, &coordsJSON, &g.Status, &g.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to query geofence %s: %w", id, err)
	}

	g.Description = desc.String
	g.Category = cat.String
	_ = json.Unmarshal(coordsJSON, &g.Coordinates)

	return &g, nil
}

func (r *PostgresGeofenceRepository) Delete(ctx context.Context, id string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	res, err := tx.ExecContext(ctx, "UPDATE geofences SET status = 'deleted' WHERE id = $1 AND status != 'deleted'", id)
	if err != nil {
		return fmt.Errorf("failed to delete geofence: %w", err)
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return sql.ErrNoRows
	}

	// Deactivate any alert rules configured for this geofence
	_, _ = tx.ExecContext(ctx, "UPDATE alert_rules SET status = 'deleted' WHERE geofence_id = $1", id)
	_, _ = tx.ExecContext(ctx, "UPDATE alerts SET status = 'deleted' WHERE geofence_id = $1", id)

	return tx.Commit()
}

