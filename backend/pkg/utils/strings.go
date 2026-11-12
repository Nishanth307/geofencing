package utils

import "strings"

// Slugify converts text to lowercase slug.
func Slugify(s string) string {
	s = strings.TrimSpace(strings.ToLower(s))
	return strings.ReplaceAll(s, " ", "-")
}

// Truncate shortens string to maximum length.
func Truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen]
}

