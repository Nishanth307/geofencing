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

type VehicleService struct {
	repo repositories.VehicleRepository
}

func NewVehicleService(repo repositories.VehicleRepository) *VehicleService {
	return &VehicleService{repo: repo}
}

func (s *VehicleService) CreateVehicle(ctx context.Context, req models.VehicleRequest) (*models.VehicleResponse, error) {
	if strings.TrimSpace(req.VehicleNumber) == "" {
		return nil, fmt.Errorf("vehicle_number is required")
	}
	if strings.TrimSpace(req.DriverName) == "" {
		return nil, fmt.Errorf("driver_name is required")
	}

	vID := utils.NewVehicleID()
	now := time.Now()

	v := &models.Vehicle{
		ID:            vID,
		VehicleNumber: req.VehicleNumber,
		DriverName:    req.DriverName,
		VehicleType:   req.VehicleType,
		Phone:         req.Phone,
		Status:        "active",
		CreatedAt:     now,
	}

	if err := s.repo.Create(ctx, v); err != nil {
		return nil, err
	}

	return &models.VehicleResponse{
		ID:            vID,
		VehicleNumber: req.VehicleNumber,
		Status:        "active",
	}, nil
}

func (s *VehicleService) ListVehicles(ctx context.Context) ([]models.Vehicle, error) {
	return s.repo.FindAll(ctx)
}

func (s *VehicleService) GetVehicle(ctx context.Context, id string) (*models.Vehicle, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *VehicleService) DeleteVehicle(ctx context.Context, id string) error {
	if strings.TrimSpace(id) == "" {
		return fmt.Errorf("vehicle_id is required")
	}
	return s.repo.Delete(ctx, id)
}
