package repositories

import (
	"context"
	"sync"

	"geofencing/internal/models"
)

type MemoryGeofenceRepository struct {
	mu        sync.RWMutex
	geofences map[string]models.Geofence
}

func NewMemoryGeofenceRepository() *MemoryGeofenceRepository {
	return &MemoryGeofenceRepository{
		geofences: make(map[string]models.Geofence),
	}
}

func (m *MemoryGeofenceRepository) Create(ctx context.Context, g *models.Geofence) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.geofences[g.ID] = *g
	return nil
}

func (m *MemoryGeofenceRepository) FindAll(ctx context.Context) ([]models.Geofence, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	list := make([]models.Geofence, 0, len(m.geofences))
	for _, g := range m.geofences {
		list = append(list, g)
	}
	return list, nil
}

func (m *MemoryGeofenceRepository) FindByID(ctx context.Context, id string) (*models.Geofence, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if g, ok := m.geofences[id]; ok && g.Status != "deleted" {
		return &g, nil
	}
	return nil, nil
}

func (m *MemoryGeofenceRepository) Delete(ctx context.Context, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if g, ok := m.geofences[id]; ok && g.Status != "deleted" {
		g.Status = "deleted"
		m.geofences[id] = g
		return nil
	}
	return nil
}

