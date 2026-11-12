package handlers

import (
	"context"
	"database/sql"
	"net/http"

	"geofencing/internal/models"
	"geofencing/pkg/response"
	"geofencing/pkg/utils"
)

type VehicleService interface {
	CreateVehicle(ctx context.Context, req models.VehicleRequest) (*models.VehicleResponse, error)
	ListVehicles(ctx context.Context) ([]models.Vehicle, error)
	GetVehicle(ctx context.Context, id string) (*models.Vehicle, error)
	DeleteVehicle(ctx context.Context, id string) error
}

type VehicleHandler struct {
	service VehicleService
}

func NewVehicleHandler(service VehicleService) *VehicleHandler {
	return &VehicleHandler{service: service}
}

func (h *VehicleHandler) CreateVehicle(w http.ResponseWriter, r *http.Request) {
	var req models.VehicleRequest
	if err := response.Read(r, &req); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	res, err := h.service.CreateVehicle(r.Context(), req)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	res.TimeNs = utils.ElapsedNs(r)
	response.JSON(w, http.StatusCreated, res)
}

func (h *VehicleHandler) ListVehicles(w http.ResponseWriter, r *http.Request) {
	vehicles, err := h.service.ListVehicles(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	resp := models.VehicleListResponse{
		Vehicles: vehicles,
		TimeNs:   utils.ElapsedNs(r),
	}
	response.JSON(w, http.StatusOK, resp)
}

func (h *VehicleHandler) GetVehicle(w http.ResponseWriter, r *http.Request) {
	id := utils.URLParam(r, "id")
	if id == "" {
		id = utils.URLParam(r, "vehicle_id")
	}
	if id == "" {
		response.Error(w, http.StatusBadRequest, "vehicle id is required")
		return
	}

	vehicle, err := h.service.GetVehicle(r.Context(), id)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	if vehicle == nil {
		response.Error(w, http.StatusNotFound, "vehicle not found")
		return
	}

	response.JSON(w, http.StatusOK, map[string]any{
		"vehicle": vehicle,
		"time_ns": utils.ElapsedNs(r),
	})
}

func (h *VehicleHandler) DeleteVehicle(w http.ResponseWriter, r *http.Request) {
	id := utils.URLParam(r, "id")
	if id == "" {
		id = utils.URLParam(r, "vehicle_id")
	}
	if id == "" {
		response.JSON(w, http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Message: "vehicle id is required",
		})
		return
	}

	err := h.service.DeleteVehicle(r.Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			response.JSON(w, http.StatusNotFound, models.StandardResponse{
				Success: false,
				Message: "Vehicle not found",
			})
			return
		}
		response.JSON(w, http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Message: "Failed to delete vehicle",
		})
		return
	}

	response.JSON(w, http.StatusOK, models.StandardResponse{
		Success: true,
		Message: "Vehicle deleted successfully",
	})
}
