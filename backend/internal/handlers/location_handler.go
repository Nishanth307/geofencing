package handlers

import (
	"context"
	"net/http"

	"geofencing/internal/models"
	"geofencing/pkg/response"
	"geofencing/pkg/utils"
)

type LocationService interface {
	IngestLocation(ctx context.Context, req models.LocationRequest) (*models.LocationResponse, error)
	GetLatestLocation(ctx context.Context, vehicleID string) (*models.LocationResponse, error)
}

type LocationHandler struct {
	service LocationService
}

func NewLocationHandler(service LocationService) *LocationHandler {
	return &LocationHandler{service: service}
}

func (h *LocationHandler) IngestLocation(w http.ResponseWriter, r *http.Request) {
	var req models.LocationRequest
	if err := response.Read(r, &req); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	res, err := h.service.IngestLocation(r.Context(), req)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	res.TimeNs = utils.ElapsedNs(r)
	response.JSON(w, http.StatusOK, res)
}

func (h *LocationHandler) GetLatestLocation(w http.ResponseWriter, r *http.Request) {
	vehicleID := utils.URLParam(r, "vehicle_id")
	if vehicleID == "" {
		vehicleID = utils.URLParam(r, "id")
	}
	if vehicleID == "" {
		response.Error(w, http.StatusBadRequest, "vehicle_id is required")
		return
	}

	res, err := h.service.GetLatestLocation(r.Context(), vehicleID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	if res == nil {
		response.Error(w, http.StatusNotFound, "location not found for vehicle")
		return
	}

	res.TimeNs = utils.ElapsedNs(r)
	response.JSON(w, http.StatusOK, res)
}
