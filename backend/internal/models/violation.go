package models

import "time"

type StandardResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

type Violation struct {
	ID            string    `json:"id"`
	GeofenceID    string    `json:"geofence_id"`
	GeofenceName  string    `json:"geofence_name"`
	VehicleID     string    `json:"vehicle_id"`
	VehicleNumber string    `json:"vehicle_number"`
	DriverName    string    `json:"driver_name"`
	EventType     string    `json:"event_type"`
	Latitude      float64   `json:"latitude"`
	Longitude     float64   `json:"longitude"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
}

type BulkDeleteViolationsRequest struct {
	ViolationIDs []string `json:"violation_ids"`
}

type BulkDeleteResponse struct {
	Success      bool   `json:"success"`
	DeletedCount int    `json:"deleted_count"`
	Message      string `json:"message"`
}

