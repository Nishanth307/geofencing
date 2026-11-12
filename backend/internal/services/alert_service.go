package services

import (
	"context"
	"fmt"
	"strings"
	"time"

	"geofencing/internal/models"
	"geofencing/internal/repositories"
	"geofencing/pkg/utils"
)

type AlertService struct {
	repo repositories.AlertRepository
}

func NewAlertService(repo repositories.AlertRepository) *AlertService {
	return &AlertService{repo: repo}
}

func (s *AlertService) CreateAlert(ctx context.Context, req models.AlertRequest) (*models.AlertResponse, error) {
	if strings.TrimSpace(req.GeofenceID) == "" {
		return nil, fmt.Errorf("geofence_id is required")
	}
	if req.EventType == "" {
		req.EventType = "entry"
	}

	// Normalize vehicle_id if user selected "all"
	vehID := strings.TrimSpace(req.VehicleID)
	if vehID == "all" {
		vehID = ""
	}

	alertID := utils.NewAlertID()
	now := time.Now()

	alert := &models.Alert{
		ID:         alertID,
		GeofenceID: req.GeofenceID,
		VehicleID:  vehID,
		EventType:  req.EventType,
		Status:     "active",
		CreatedAt:  now,
	}

	if err := s.repo.Create(ctx, alert); err != nil {
		return nil, err
	}

	return &models.AlertResponse{
		AlertID:    alertID,
		GeofenceID: req.GeofenceID,
		VehicleID:  vehID,
		EventType:  req.EventType,
		Status:     "active",
	}, nil
}

func (s *AlertService) ListAlerts(ctx context.Context) ([]models.AlertItem, error) {
	return s.repo.FindAll(ctx)
}

func (s *AlertService) DeleteAlert(ctx context.Context, id string) error {
	if strings.TrimSpace(id) == "" {
		return fmt.Errorf("alert_id is required")
	}
	return s.repo.DeleteAlert(ctx, id)
}

func (s *AlertService) ListViolations(ctx context.Context) ([]models.Violation, error) {
	return s.repo.FindAllViolations(ctx)
}

func (s *AlertService) DeleteViolation(ctx context.Context, id string) error {
	if strings.TrimSpace(id) == "" {
		return fmt.Errorf("violation_id is required")
	}
	return s.repo.DeleteViolation(ctx, id)
}

func (s *AlertService) BulkDeleteViolations(ctx context.Context, ids []string) (int, error) {
	if len(ids) == 0 {
		return 0, fmt.Errorf("violation_ids list is empty")
	}
	return s.repo.BulkDeleteViolations(ctx, ids)
}
