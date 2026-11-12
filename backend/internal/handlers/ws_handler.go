package handlers

import (
	"net/http"

	"geofencing/internal/services"
)

type WSHandler struct {
	hub *services.WSHub
}

func NewWSHandler(hub *services.WSHub) *WSHandler {
	return &WSHandler{hub: hub}
}

func (h *WSHandler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	h.hub.ServeWS(w, r)
}

