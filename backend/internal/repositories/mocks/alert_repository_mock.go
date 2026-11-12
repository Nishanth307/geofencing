package mocks

import (
	"context"
	"database/sql"

	"geofencing/internal/models"
)

type MockAlertRepository struct {
	Alerts                  []models.Alert
	Violations              []models.Violation
	CreateFn                func(ctx context.Context, a *models.Alert) error
	FindAllFn               func(ctx context.Context) ([]models.AlertItem, error)
	GetLastEventTypeFn      func(ctx context.Context, vehicleID, geofenceID string) (string, error)
	DeleteAlertFn           func(ctx context.Context, id string) error
	CreateViolationFn       func(ctx context.Context, v *models.Violation) error
	FindAllViolationsFn     func(ctx context.Context) ([]models.Violation, error)
	DeleteViolationFn       func(ctx context.Context, id string) error
	BulkDeleteViolationsFn  func(ctx context.Context, ids []string) (int, error)
	HasMatchingRuleFn       func(ctx context.Context, geofenceID, vehicleID, eventType string) (bool, error)
}

func NewMockAlertRepository() *MockAlertRepository {
	return &MockAlertRepository{
		Alerts:     make([]models.Alert, 0),
		Violations: make([]models.Violation, 0),
	}
}

func (m *MockAlertRepository) Create(ctx context.Context, a *models.Alert) error {
	if m.CreateFn != nil {
		return m.CreateFn(ctx, a)
	}
	m.Alerts = append(m.Alerts, *a)
	return nil
}

func (m *MockAlertRepository) FindAll(ctx context.Context) ([]models.AlertItem, error) {
	if m.FindAllFn != nil {
		return m.FindAllFn(ctx)
	}
	items := make([]models.AlertItem, 0, len(m.Alerts))
	for _, a := range m.Alerts {
		if a.Status != "deleted" {
			items = append(items, models.AlertItem{
				AlertID:    a.ID,
				GeofenceID: a.GeofenceID,
				VehicleID:  a.VehicleID,
				EventType:  a.EventType,
				Status:     a.Status,
				CreatedAt:  a.CreatedAt,
			})
		}
	}
	return items, nil
}

func (m *MockAlertRepository) DeleteAlert(ctx context.Context, id string) error {
	if m.DeleteAlertFn != nil {
		return m.DeleteAlertFn(ctx, id)
	}
	for i, a := range m.Alerts {
		if a.ID == id && a.Status != "deleted" {
			m.Alerts[i].Status = "deleted"
			return nil
		}
	}
	return sql.ErrNoRows
}

func (m *MockAlertRepository) CreateViolation(ctx context.Context, v *models.Violation) error {
	if m.CreateViolationFn != nil {
		return m.CreateViolationFn(ctx, v)
	}
	m.Violations = append(m.Violations, *v)
	return nil
}

func (m *MockAlertRepository) FindAllViolations(ctx context.Context) ([]models.Violation, error) {
	if m.FindAllViolationsFn != nil {
		return m.FindAllViolationsFn(ctx)
	}
	items := make([]models.Violation, 0)
	for _, v := range m.Violations {
		if v.Status != "deleted" {
			items = append(items, v)
		}
	}
	return items, nil
}

func (m *MockAlertRepository) DeleteViolation(ctx context.Context, id string) error {
	if m.DeleteViolationFn != nil {
		return m.DeleteViolationFn(ctx, id)
	}
	for i, v := range m.Violations {
		if v.ID == id && v.Status != "deleted" {
			m.Violations[i].Status = "deleted"
			return nil
		}
	}
	return sql.ErrNoRows
}

func (m *MockAlertRepository) BulkDeleteViolations(ctx context.Context, ids []string) (int, error) {
	if m.BulkDeleteViolationsFn != nil {
		return m.BulkDeleteViolationsFn(ctx, ids)
	}
	idMap := make(map[string]bool)
	for _, id := range ids {
		idMap[id] = true
	}
	count := 0
	for i, v := range m.Violations {
		if idMap[v.ID] && v.Status != "deleted" {
			m.Violations[i].Status = "deleted"
			count++
		}
	}
	return count, nil
}

func (m *MockAlertRepository) HasMatchingRule(ctx context.Context, geofenceID, vehicleID, eventType string) (bool, error) {
	if m.HasMatchingRuleFn != nil {
		return m.HasMatchingRuleFn(ctx, geofenceID, vehicleID, eventType)
	}
	return true, nil
}

func (m *MockAlertRepository) GetLastEventType(ctx context.Context, vehicleID, geofenceID string) (string, error) {
	if m.GetLastEventTypeFn != nil {
		return m.GetLastEventTypeFn(ctx, vehicleID, geofenceID)
	}
	for i := len(m.Alerts) - 1; i >= 0; i-- {
		a := m.Alerts[i]
		if a.VehicleID == vehicleID && a.GeofenceID == geofenceID {
			return a.EventType, nil
		}
	}
	return "", nil
}
