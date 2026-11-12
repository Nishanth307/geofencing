package models

import "time"

type Geofence struct {
	ID          string       `json:"id"`
	Name        string       `json:"name"`
	Description string       `json:"description"`
	Coordinates [][2]float64 `json:"coordinates"`
	Category    string       `json:"category"`
	Status      string       `json:"status"`
	CreatedAt   time.Time    `json:"created_at"`
}

type GeofenceRequest struct {
	Name        string       `json:"name"`
	Description string       `json:"description"`
	Coordinates [][2]float64 `json:"coordinates"`
	Category    string       `json:"category"`
}

type GeofenceResponse struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Status string `json:"status"`
	TimeNs string `json:"time_ns"`
}

type GeofenceListResponse struct {
	Geofences []Geofence `json:"geofences"`
	TimeNs    string     `json:"time_ns"`
}

