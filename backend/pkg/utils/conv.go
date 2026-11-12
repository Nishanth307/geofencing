package utils

import "strconv"

// AtoiOrDefault converts string to int or returns default value.
func AtoiOrDefault(s string, defaultVal int) int {
	if val, err := strconv.Atoi(s); err == nil {
		return val
	}
	return defaultVal
}

// ParseFloat64OrDefault converts string to float64 or returns default.
func ParseFloat64OrDefault(s string, defaultVal float64) float64 {
	if val, err := strconv.ParseFloat(s, 64); err == nil {
		return val
	}
	return defaultVal
}

