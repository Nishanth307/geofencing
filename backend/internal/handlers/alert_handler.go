package handlers

import (
	"context"
	"database/sql"
	"net/http"

	"geofencing/internal/models"
	"geofencing/pkg/response"
	"geofencing/pkg/utils"
)

type AlertService interface {
	CreateAlert(ctx context.Context, req models.AlertRequest) (*models.AlertResponse, error)
	ListAlerts(ctx context.Context) ([]models.AlertItem, error)
	DeleteAlert(ctx context.Context, id string) error
	ListViolations(ctx context.Context) ([]models.Violation, error)
	DeleteViolation(ctx context.Context, id string) error
	BulkDeleteViolations(ctx context.Context, ids []string) (int, error)
}

type AlertHandler struct {
	service AlertService
}

func NewAlertHandler(service AlertService) *AlertHandler {
	return &AlertHandler{service: service}
}

func (h *AlertHandler) CreateAlert(w http.ResponseWriter, r *http.Request) {
	var req models.AlertRequest
	if err := response.Read(r, &req); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	res, err := h.service.CreateAlert(r.Context(), req)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	res.TimeNs = utils.ElapsedNs(r)
	response.JSON(w, http.StatusCreated, res)
}

func (h *AlertHandler) ListAlerts(w http.ResponseWriter, r *http.Request) {
	alerts, err := h.service.ListAlerts(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	resp := models.AlertListResponse{
		Alerts: alerts,
		TimeNs: utils.ElapsedNs(r),
	}
	response.JSON(w, http.StatusOK, resp)
}

func (h *AlertHandler) DeleteAlert(w http.ResponseWriter, r *http.Request) {
	id := utils.URLParam(r, "id")
	if id == "" {
		id = utils.URLParam(r, "alert_id")
	}
	if id == "" {
		response.JSON(w, http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Message: "alert id is required",
		})
		return
	}

	err := h.service.DeleteAlert(r.Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			response.JSON(w, http.StatusNotFound, models.StandardResponse{
				Success: false,
				Message: "Alert rule not found",
			})
			return
		}
		response.JSON(w, http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Message: "Failed to delete alert rule",
		})
		return
	}

	response.JSON(w, http.StatusOK, models.StandardResponse{
		Success: true,
		Message: "Alert rule deleted successfully",
	})
}

func (h *AlertHandler) ListViolations(w http.ResponseWriter, r *http.Request) {
	violations, err := h.service.ListViolations(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Also format as AlertListResponse for complete compatibility with frontend AlertItem format
	items := make([]models.AlertItem, len(violations))
	for i, v := range violations {
		items[i] = models.AlertItem{
			AlertID:       v.ID,
			GeofenceID:    v.GeofenceID,
			GeofenceName:  v.GeofenceName,
			VehicleID:     v.VehicleID,
			VehicleNumber: v.VehicleNumber,
			EventType:     v.EventType,
			Status:        v.Status,
			CreatedAt:     v.CreatedAt,
		}
	}

	resp := models.AlertListResponse{
		Alerts: items,
		TimeNs: utils.ElapsedNs(r),
	}
	response.JSON(w, http.StatusOK, resp)
}

func (h *AlertHandler) DeleteViolation(w http.ResponseWriter, r *http.Request) {
	id := utils.URLParam(r, "id")
	if id == "" {
		id = utils.URLParam(r, "violation_id")
	}
	if id == "" {
		response.JSON(w, http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Message: "violation id is required",
		})
		return
	}

	err := h.service.DeleteViolation(r.Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			response.JSON(w, http.StatusNotFound, models.StandardResponse{
				Success: false,
				Message: "Violation not found",
			})
			return
		}
		response.JSON(w, http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Message: "Failed to delete violation",
		})
		return
	}

	response.JSON(w, http.StatusOK, models.StandardResponse{
		Success: true,
		Message: "Violation deleted successfully",
	})
}

func (h *AlertHandler) BulkDeleteViolations(w http.ResponseWriter, r *http.Request) {
	var req models.BulkDeleteViolationsRequest
	if err := response.Read(r, &req); err != nil {
		response.JSON(w, http.StatusBadRequest, models.BulkDeleteResponse{
			Success:      false,
			DeletedCount: 0,
			Message:      "Invalid request payload: " + err.Error(),
		})
		return
	}

	if len(req.ViolationIDs) == 0 {
		response.JSON(w, http.StatusBadRequest, models.BulkDeleteResponse{
			Success:      false,
			DeletedCount: 0,
			Message:      "violation_ids array cannot be empty",
		})
		return
	}

	count, err := h.service.BulkDeleteViolations(r.Context(), req.ViolationIDs)
	if err != nil {
		response.JSON(w, http.StatusInternalServerError, models.BulkDeleteResponse{
			Success:      false,
			DeletedCount: 0,
			Message:      "Failed to delete violations: " + err.Error(),
		})
		return
	}

	response.JSON(w, http.StatusOK, models.BulkDeleteResponse{
		Success:      true,
		DeletedCount: count,
		Message:      "Violations bulk deleted successfully",
	})
}
