package models

import "time"

type Alert struct {
	ID         string    `json:"alert_id"`
	GeofenceID string    `json:"geofence_id"`
	VehicleID  string    `json:"vehicle_id"`
	EventType  string    `json:"event_type"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
}

type AlertRequest struct {
	GeofenceID string `json:"geofence_id"`
	VehicleID  string `json:"vehicle_id"`
	EventType  string `json:"event_type"`
}

type AlertResponse struct {
	AlertID    string `json:"alert_id"`
	GeofenceID string `json:"geofence_id"`
	VehicleID  string `json:"vehicle_id"`
	EventType  string `json:"event_type"`
	Status     string `json:"status"`
	TimeNs     string `json:"time_ns"`
}

type AlertItem struct {
	AlertID       string    `json:"alert_id"`
	GeofenceID    string    `json:"geofence_id"`
	GeofenceName  string    `json:"geofence_name"`
	VehicleID     string    `json:"vehicle_id"`
	VehicleNumber string    `json:"vehicle_number"`
	EventType     string    `json:"event_type"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
}

type AlertListResponse struct {
	Alerts []AlertItem `json:"alerts"`
	TimeNs string      `json:"time_ns"`
}

