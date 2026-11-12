package models

import "time"

type VehicleRequest struct {
	VehicleNumber string `json:"vehicle_number"`
	DriverName    string `json:"driver_name"`
	VehicleType   string `json:"vehicle_type"`
	Phone         string `json:"phone"`
}

type Vehicle struct {
	ID            string    `json:"id"`
	VehicleNumber string    `json:"vehicle_number"`
	DriverName    string    `json:"driver_name"`
	VehicleType   string    `json:"vehicle_type"`
	Phone         string    `json:"phone"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
}

type VehicleResponse struct {
	ID            string `json:"id"`
	VehicleNumber string `json:"vehicle_number"`
	Status        string `json:"status"`
	TimeNs        string `json:"time_ns"`
}

type VehicleListResponse struct {
	Vehicles []Vehicle `json:"vehicles"`
	TimeNs   string    `json:"time_ns"`
}

