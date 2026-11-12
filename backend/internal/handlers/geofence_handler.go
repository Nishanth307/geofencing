package handlers

import (
	"context"
	"database/sql"
	"net/http"

	"geofencing/internal/models"
	"geofencing/pkg/response"
	"geofencing/pkg/utils"
)

type GeofenceService interface {
	CreateGeofence(ctx context.Context, req models.GeofenceRequest) (*models.GeofenceResponse, error)
	ListGeofences(ctx context.Context) ([]models.Geofence, error)
	GetGeofence(ctx context.Context, id string) (*models.Geofence, error)
	DeleteGeofence(ctx context.Context, id string) error
}

type GeofenceHandler struct {
	service GeofenceService
}

func NewGeofenceHandler(service GeofenceService) *GeofenceHandler {
	return &GeofenceHandler{service: service}
}

func (h *GeofenceHandler) CreateGeofence(w http.ResponseWriter, r *http.Request) {
	var req models.GeofenceRequest
	if err := response.Read(r, &req); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	res, err := h.service.CreateGeofence(r.Context(), req)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	res.TimeNs = utils.ElapsedNs(r)
	response.JSON(w, http.StatusCreated, res)
}

func (h *GeofenceHandler) ListGeofences(w http.ResponseWriter, r *http.Request) {
	geofences, err := h.service.ListGeofences(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	resp := models.GeofenceListResponse{
		Geofences: geofences,
		TimeNs:    utils.ElapsedNs(r),
	}
	response.JSON(w, http.StatusOK, resp)
}

func (h *GeofenceHandler) GetGeofence(w http.ResponseWriter, r *http.Request) {
	id := utils.URLParam(r, "id")
	if id == "" {
		id = utils.URLParam(r, "geofence_id")
	}
	if id == "" {
		response.Error(w, http.StatusBadRequest, "geofence id is required")
		return
	}

	geofence, err := h.service.GetGeofence(r.Context(), id)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	if geofence == nil {
		response.Error(w, http.StatusNotFound, "geofence not found")
		return
	}

	response.JSON(w, http.StatusOK, map[string]any{
		"geofence": geofence,
		"time_ns":  utils.ElapsedNs(r),
	})
}

func (h *GeofenceHandler) DeleteGeofence(w http.ResponseWriter, r *http.Request) {
	id := utils.URLParam(r, "id")
	if id == "" {
		id = utils.URLParam(r, "geofence_id")
	}
	if id == "" {
		response.JSON(w, http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Message: "geofence id is required",
		})
		return
	}

	err := h.service.DeleteGeofence(r.Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			response.JSON(w, http.StatusNotFound, models.StandardResponse{
				Success: false,
				Message: "Geofence not found",
			})
			return
		}
		response.JSON(w, http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Message: "Failed to delete geofence",
		})
		return
	}

	response.JSON(w, http.StatusOK, models.StandardResponse{
		Success: true,
		Message: "Geofence deleted successfully",
	})
}
