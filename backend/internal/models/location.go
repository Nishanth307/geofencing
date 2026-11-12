package models

import "time"

type LocationRequest struct {
	VehicleID string  `json:"vehicle_id"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type LocationResponse struct {
	Status    string    `json:"status"`
	VehicleID string    `json:"vehicle_id"`
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	Timestamp time.Time `json:"timestamp,omitempty"`
	TimeNs    string    `json:"time_ns"`
}

type VehicleLocation struct {
	ID        int64     `json:"id"`
	VehicleID string    `json:"vehicle_id"`
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	TimeNs    int64     `json:"time_ns"`
	CreatedAt time.Time `json:"created_at"`
}

