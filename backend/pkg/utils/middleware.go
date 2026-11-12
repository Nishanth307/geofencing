package utils

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
)

type contextKey string

const (
	RequestIDKey contextKey = "request_id"
	StartTimeKey contextKey = "start_time"
)

func generateReqID() string {
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

// ChiCORS adds cross-origin headers. Use as a Chi middleware.
func ChiCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// ChiRequestIDAndTimer injects X-Request-ID and records request start time.
func ChiRequestIDAndTimer(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		reqID := r.Header.Get("X-Request-ID")
		if reqID == "" {
			reqID = generateReqID()
		}

		w.Header().Set("X-Request-ID", reqID)

		ctx := context.WithValue(r.Context(), RequestIDKey, reqID)
		ctx = context.WithValue(ctx, StartTimeKey, time.Now())

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// ElapsedNs calculates execution duration in nanoseconds as string.
func ElapsedNs(r *http.Request) string {
	if val := r.Context().Value(StartTimeKey); val != nil {
		if t, ok := val.(time.Time); ok {
			return strconv.FormatInt(time.Since(t).Nanoseconds(), 10)
		}
	}
	return "0"
}

// URLParam is a thin wrapper around chi.URLParam so handlers don't import Chi directly.
func URLParam(r *http.Request, key string) string {
	return chi.URLParam(r, key)
}

// --- Legacy aliases kept so existing code compiles without changes ---

// CORS is the old net/http-mux compatible CORS middleware (kept for compatibility).
func CORS(next http.Handler) http.Handler { return ChiCORS(next) }

// RequestIDAndTimer is the old net/http-mux compatible middleware (kept for compatibility).
func RequestIDAndTimer(next http.Handler) http.Handler { return ChiRequestIDAndTimer(next) }
