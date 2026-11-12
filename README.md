# Geofencing & Real-Time Alert System

Production-ready geospatial monitoring and fleet management system built with a high-performance **Go backend** (PostgreSQL + PostGIS, Redis state caching, Gorilla WebSocket hub, Ray-Casting point-in-polygon engine) and a modern **React frontend** (TypeScript, Vite, Tailwind CSS, TanStack Query, React Leaflet, Zustand).

---

## 1. Architecture Overview

- **Backend**: Go 1.24, Chi v5 router, PostGIS spatial queries, Redis telemetry state cache, Chi CORS & timing middleware.
- **Frontend**: React 18, TypeScript, Tailwind CSS, React Leaflet, Lucide icons, Vitest.
- **Database & Storage**: PostgreSQL 15 + PostGIS (port `5432`), Redis 7 (port `6379`).
- **Orchestration**: Docker Compose with automatic `.env` initialization from `.env.example`.

---

## 2. Quick Start

### Start Full Stack with Docker Compose

Run the entire system (Database, Cache, Go API, and React Frontend) with a single command:

```bash
docker compose up -d --build
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: `http://localhost:8080`
- **WebSocket Feed**: `ws://localhost:8080/ws/alerts`
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`

---

## 3. Delete APIs & Endpoints

| Resource | HTTP Method | Path | Description | Success Status |
| :--- | :--- | :--- | :--- | :--- |
| **Vehicle** | `DELETE` | `/vehicles/{vehicle_id}` | Deactivates vehicle, revokes active alerts, preserves historical audit snapshots. | `200 OK` |
| **Geofence** | `DELETE` | `/geofences/{geofence_id}` | Deactivates boundary polygon and halts boundary dispatch checks. | `200 OK` |
| **Alert Rule** | `DELETE` | `/alerts/configure/{alert_id}` | Deactivates rule; halts future notifications for the boundary/vehicle. | `200 OK` |
| **Violation** | `DELETE` | `/violations/{violation_id}` | Deletes individual historical audit violation entry. | `200 OK` |
| **Bulk Violations** | `POST` | `/violations/bulk-delete` | Atomically deletes multiple historical violations via database transaction. | `200 OK` |

*(All endpoints are also accessible under the `/api/v1/*` alias)*

### Response Formats

- **Single Deletion Success (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Vehicle deleted successfully"
  }
  ```
- **Error (`404 Not Found` / `400 Bad Request`)**:
  ```json
  {
    "success": false,
    "message": "Vehicle not found"
  }
  ```
- **Bulk Deletion (`200 OK`)**:
  ```json
  {
    "success": true,
    "deleted_count": 3,
    "message": "Violations bulk deleted successfully"
  }
  ```

---

## 4. Testing

### Run Backend Unit Tests
```bash
cd backend
go test -v ./...
```
*(Tests cover vehicle deletion, 404 handling, geofence deletion, alert rule deletion, violation deletion, bulk violation deletion in transaction, and HTTP handler response codes.)*

### Run Frontend Unit Tests
```bash
cd frontend
npm run test -- --run
```
*(26 tests cover UI primitives, form validation, coordinate conversions, Leaflet maps, delete confirmation dialogs, loading states, and API clients.)*

### Run Production Build
```bash
cd frontend
npm run build
```

