package utils

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
)

func randomHex(byteLen int) string {
	b := make([]byte, byteLen)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func NewGeofenceID() string {
	return fmt.Sprintf("geo_%s", randomHex(6))
}

func NewVehicleID() string {
	return fmt.Sprintf("veh_%s", randomHex(6))
}

func NewAlertID() string {
	return fmt.Sprintf("alert_%s", randomHex(6))
}

func NewEventID() string {
	return fmt.Sprintf("evt_%s", randomHex(6))
}

func NewLocationID() string {
	return fmt.Sprintf("loc_%s", randomHex(6))
}

