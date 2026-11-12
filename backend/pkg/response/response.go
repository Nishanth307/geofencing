package response

import (
	"encoding/json"
	"fmt"
	"net/http"
)

// JSON writes data as application/json with the specified HTTP status code.
func JSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

// Error writes a standardized JSON error message.
func Error(w http.ResponseWriter, status int, message string) {
	JSON(w, status, map[string]string{
		"error": message,
	})
}

// Read decodes JSON body into target struct.
func Read(r *http.Request, target any) error {
	if r.Body == nil {
		return fmt.Errorf("missing request body")
	}
	defer r.Body.Close()
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	return decoder.Decode(target)
}

