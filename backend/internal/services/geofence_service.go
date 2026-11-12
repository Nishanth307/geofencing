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

type GeofenceService struct {
	repo repositories.GeofenceRepository
}

func NewGeofenceService(repo repositories.GeofenceRepository) *GeofenceService {
	return &GeofenceService{repo: repo}
}

func (s *GeofenceService) CreateGeofence(ctx context.Context, req models.GeofenceRequest) (*models.GeofenceResponse, error) {
	if strings.TrimSpace(req.Name) == "" {
		return nil, fmt.Errorf("name is required")
	}
	if len(req.Coordinates) < 3 {
		return nil, fmt.Errorf("at least 3 coordinates are required to form a polygon")
	}

	gID := utils.NewGeofenceID()
	now := time.Now()

	g := &models.Geofence{
		ID:          gID,
		Name:        req.Name,
		Description: req.Description,
		Category:    req.Category,
		Coordinates: req.Coordinates,
		Status:      "active",
		CreatedAt:   now,
	}

	if err := s.repo.Create(ctx, g); err != nil {
		return nil, err
	}

	return &models.GeofenceResponse{
		ID:     gID,
		Name:   req.Name,
		Status: "active",
	}, nil
}

func (s *GeofenceService) ListGeofences(ctx context.Context) ([]models.Geofence, error) {
	return s.repo.FindAll(ctx)
}

func (s *GeofenceService) GetGeofence(ctx context.Context, id string) (*models.Geofence, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *GeofenceService) DeleteGeofence(ctx context.Context, id string) error {
	if strings.TrimSpace(id) == "" {
		return fmt.Errorf("geofence_id is required")
	}
	return s.repo.Delete(ctx, id)
}
