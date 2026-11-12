package mocks

import (
	"context"
	"database/sql"

	"geofencing/internal/models"
)

type MockVehicleRepository struct {
	Vehicles   map[string]models.Vehicle
	CreateFn   func(ctx context.Context, v *models.Vehicle) error
	FindAllFn  func(ctx context.Context) ([]models.Vehicle, error)
	FindByIDFn func(ctx context.Context, id string) (*models.Vehicle, error)
	ExistsFn   func(ctx context.Context, id string) (bool, error)
	DeleteFn   func(ctx context.Context, id string) error
}

func NewMockVehicleRepository() *MockVehicleRepository {
	return &MockVehicleRepository{
		Vehicles: make(map[string]models.Vehicle),
	}
}

func (m *MockVehicleRepository) Create(ctx context.Context, v *models.Vehicle) error {
	if m.CreateFn != nil {
		return m.CreateFn(ctx, v)
	}
	m.Vehicles[v.ID] = *v
	return nil
}

func (m *MockVehicleRepository) FindAll(ctx context.Context) ([]models.Vehicle, error) {
	if m.FindAllFn != nil {
		return m.FindAllFn(ctx)
	}
	list := make([]models.Vehicle, 0, len(m.Vehicles))
	for _, v := range m.Vehicles {
		if v.Status != "deleted" {
			list = append(list, v)
		}
	}
	return list, nil
}

func (m *MockVehicleRepository) FindByID(ctx context.Context, id string) (*models.Vehicle, error) {
	if m.FindByIDFn != nil {
		return m.FindByIDFn(ctx, id)
	}
	if v, ok := m.Vehicles[id]; ok && v.Status != "deleted" {
		return &v, nil
	}
	return nil, nil
}

func (m *MockVehicleRepository) Exists(ctx context.Context, id string) (bool, error) {
	if m.ExistsFn != nil {
		return m.ExistsFn(ctx, id)
	}
	v, ok := m.Vehicles[id]
	return ok && v.Status != "deleted", nil
}

func (m *MockVehicleRepository) Delete(ctx context.Context, id string) error {
	if m.DeleteFn != nil {
		return m.DeleteFn(ctx, id)
	}
	if v, ok := m.Vehicles[id]; ok && v.Status != "deleted" {
		v.Status = "deleted"
		m.Vehicles[id] = v
		return nil
	}
	return sql.ErrNoRows
}
