package repositories

import (
	"context"
	"database/sql"
	"embed"
	"fmt"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

//go:embed migrations/*.sql
var migrationFiles embed.FS

func NewPostgresDB(dataSourceName string) (*sql.DB, error) {
	db, err := sql.Open("pgx", dataSourceName)
	if err != nil {
		return nil, fmt.Errorf("failed to open postgres connection: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(25)
	db.SetConnMaxLifetime(5 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping postgres: %w", err)
	}

	return db, nil
}

// RunMigrations executes embedded SQL migrations in order.
func RunMigrations(db *sql.DB) error {
	entries, err := migrationFiles.ReadDir("migrations")
	if err != nil {
		return fmt.Errorf("failed to read migrations dir: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		content, err := migrationFiles.ReadFile("migrations/" + entry.Name())
		if err != nil {
			return fmt.Errorf("failed to read migration file %s: %w", entry.Name(), err)
		}

		if _, err := db.Exec(string(content)); err != nil {
			return fmt.Errorf("failed to execute migration %s: %w", entry.Name(), err)
		}
	}

	return nil
}

