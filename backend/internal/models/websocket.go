package models

import "time"

type WsLocation struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type WsGeofence struct {
	GeofenceID   string `json:"geofence_id"`
	GeofenceName string `json:"geofence_name"`
	Category     string `json:"category"`
}

type WsVehicle struct {
	VehicleID     string `json:"vehicle_id"`
	VehicleNumber string `json:"vehicle_number"`
	DriverName    string `json:"driver_name"`
}

type WsEvent struct {
	EventID   string      `json:"event_id"`
	EventType string      `json:"event_type"` // e.g., "entry", "exit", "telemetry"
	Timestamp time.Time   `json:"timestamp"`
	Vehicle   WsVehicle   `json:"vehicle"`
	Geofence  *WsGeofence `json:"geofence,omitempty"`
	Location  WsLocation  `json:"location"`
}

