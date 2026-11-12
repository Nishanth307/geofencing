import { useEffect, useRef } from "react";
import { useAlertStore } from "@/store/alertStore";
import { useUIStore } from "@/store/uiStore";
import { WsEvent } from "@/types/websocket";
import { queryClient } from "@/services/queryClient";

function getWsUrl(attempt: number): string {
  if (attempt % 2 === 0) {
    return import.meta.env.VITE_WS_URL || "ws://localhost:8080/ws/alerts";
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/alerts`;
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectDelay = 30000;

  const addLiveAlert = useAlertStore((state) => state.addLiveAlert);
  const setWsStatus = useUIStore((state) => state.setWsStatus);

  useEffect(() => {
    let isMounted = true;

    function connect() {
      if (!isMounted) return;

      // Close existing connection cleanly before reconnecting
      if (wsRef.current) {
        wsRef.current.close();
      }

      setWsStatus(reconnectAttemptsRef.current === 0 ? "connecting" : "reconnecting");

      try {
        const targetUrl = getWsUrl(reconnectAttemptsRef.current);
        const ws = new WebSocket(targetUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setWsStatus("connected");
          reconnectAttemptsRef.current = 0;
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data) as WsEvent;

            // Validate that incoming message has minimum expected fields
            if (data && (data.event_type || data.vehicle)) {
              addLiveAlert(data);

              // Invalidate tanstack query caches so vehicles, locations, alerts stay fresh
              queryClient.invalidateQueries({ queryKey: ["alerts"] });
              queryClient.invalidateQueries({ queryKey: ["violations"] });
              if (data.vehicle?.vehicle_id) {
                queryClient.invalidateQueries({
                  queryKey: ["vehicle-location", data.vehicle.vehicle_id],
                });
              }
            }
          } catch (err) {
            console.error("Failed to parse WebSocket message:", err, event.data);
          }
        };

        ws.onerror = (err) => {
          console.warn("WebSocket error:", err);
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setWsStatus("disconnected");
          wsRef.current = null;

          // Exponential backoff reconnect
          const delay = Math.min(
            1000 * Math.pow(1.5, reconnectAttemptsRef.current),
            maxReconnectDelay
          );
          reconnectAttemptsRef.current += 1;

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        };
      } catch (err) {
        console.error("WebSocket connection initiation error:", err);
        setWsStatus("disconnected");
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      setWsStatus("disconnected");
    };
  }, [addLiveAlert, setWsStatus]);
}
