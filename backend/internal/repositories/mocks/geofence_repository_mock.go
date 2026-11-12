package mocks

import (
	"context"
	"database/sql"

	"geofencing/internal/models"
)

type MockGeofenceRepository struct {
	Geofences  map[string]models.Geofence
	CreateFn   func(ctx context.Context, g *models.Geofence) error
	FindAllFn  func(ctx context.Context) ([]models.Geofence, error)
	FindByIDFn func(ctx context.Context, id string) (*models.Geofence, error)
	DeleteFn   func(ctx context.Context, id string) error
}

func NewMockGeofenceRepository() *MockGeofenceRepository {
	return &MockGeofenceRepository{
		Geofences: make(map[string]models.Geofence),
	}
}

func (m *MockGeofenceRepository) Create(ctx context.Context, g *models.Geofence) error {
	if m.CreateFn != nil {
		return m.CreateFn(ctx, g)
	}
	m.Geofences[g.ID] = *g
	return nil
}

func (m *MockGeofenceRepository) FindAll(ctx context.Context) ([]models.Geofence, error) {
	if m.FindAllFn != nil {
		return m.FindAllFn(ctx)
	}
	list := make([]models.Geofence, 0, len(m.Geofences))
	for _, g := range m.Geofences {
		if g.Status != "deleted" {
			list = append(list, g)
		}
	}
	return list, nil
}

func (m *MockGeofenceRepository) FindByID(ctx context.Context, id string) (*models.Geofence, error) {
	if m.FindByIDFn != nil {
		return m.FindByIDFn(ctx, id)
	}
	if g, ok := m.Geofences[id]; ok && g.Status != "deleted" {
		return &g, nil
	}
	return nil, nil
}

func (m *MockGeofenceRepository) Delete(ctx context.Context, id string) error {
	if m.DeleteFn != nil {
		return m.DeleteFn(ctx, id)
	}
	if g, ok := m.Geofences[id]; ok && g.Status != "deleted" {
		g.Status = "deleted"
		m.Geofences[id] = g
		return nil
	}
	return sql.ErrNoRows
}
