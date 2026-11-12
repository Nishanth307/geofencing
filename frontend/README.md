# GeoSentinel Frontend — Geofencing & Real-Time Alert System

Production-quality fleet-management and geospatial monitoring dashboard built with React, TypeScript, Vite, Tailwind CSS, TanStack Query, and React Leaflet.

---

## 1. Technology Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (Enterprise Fleet Ops Dark Slate & Light Surface design)
- **Map & Geospatial**: Leaflet + React Leaflet with custom SVG/DivIcon markers & polygon layers
- **State Management**:
  - **Server State**: TanStack Query (`@tanstack/react-query`) for query caching & invalidation
  - **Client State**: Zustand (`zustand`) for WebSocket alert stream, audio toggles, and UI focus
- **Navigation**: React Router DOM v6
- **Forms & Validation**: React Hook Form + Zod (`@hookform/resolvers`)
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library + JSDOM

---

## 2. Architecture & Folder Structure

```
frontend/
├── index.html                  # HTML entry point with Leaflet assets
├── package.json
├── tsconfig.json               # Path alias '@/*' mapped to 'src/*'
├── vite.config.ts              # Vite & Vitest configuration
├── tailwind.config.js          # Design system color tokens (navy, brand, alert colors)
├── .env.example                # Documented environment variables
├── .env                        # Local dev environment configuration
└── src/
    ├── app/
    │   ├── App.tsx             # Root component with layout and providers
    │   ├── router.tsx          # React Router route definitions
    │   └── providers.tsx       # TanStack Query Client Provider
    ├── components/
    │   ├── layout/             # Sidebar, Topbar, AppLayout
    │   ├── ui/                 # Enterprise UI primitives (Button, Card, Badge, Modal, Input, Select, Spinner)
    │   └── maps/               # Interactive Leaflet Map, Custom Vehicle Markers, Polygon Overlays
    ├── features/
    │   ├── dashboard/          # Operational overview, summary metrics, live map preview, recent alert feed
    │   ├── tracking/           # Full-screen live tracking map + manual GPS telemetry simulation
    │   ├── geofences/          # Geofence boundary management & interactive polygon drawer
    │   ├── vehicles/           # Commercial vehicle fleet registration & directory
    │   ├── alerts/             # Alert rule trigger configuration
    │   ├── violations/         # Historical audit log with filtering, pagination, and map inspection
    │   └── settings/           # Audio alert toggles, endpoint diagnostics, and coordinate specs
    ├── hooks/
    │   └── useWebSocket.ts     # Persistent WebSocket connection with exponential backoff & store sync
    ├── services/
    │   ├── api/                # Centralized REST API client and domain services
    │   │   ├── apiClient.ts
    │   │   ├── geofenceApi.ts
    │   │   ├── vehicleApi.ts
    │   │   ├── locationApi.ts
    │   │   └── alertApi.ts
    │   └── queryClient.ts      # Configured QueryClient
    ├── store/
    │   ├── alertStore.ts       # Real-time WebSocket event queue, unread counters, audio alerts
    │   └── uiStore.ts          # Selected vehicle/geofence focus and connection indicators
    ├── types/                  # Strict TypeScript interfaces matching Go backend models
    ├── lib/
    │   └── utils.ts            # Coordinate validation, nanosecond conversion, category styling
    └── test/                   # Vitest unit & integration test suites
```

---

## 3. Environment Configuration

Create `.env` in `frontend/` (see `.env.example`):

```bash
# Backend REST API
VITE_API_BASE_URL=http://localhost:8080

# Backend WebSocket alerts feed
VITE_WS_URL=ws://localhost:8080/ws/alerts
```

---

## 4. Getting Started

### Prerequisites
- Node.js >= 18 (Tested on Node v26)
- Running Go backend on port `:8080` (see `backend/`)

### Installation & Run

### Option A: Run via Docker Compose (Recommended)

From the project root:
```bash
docker compose up -d --build
```
Access the application at: `http://localhost:5173`.

### Option B: Run Locally with Vite

```bash
# 1. Install dependencies
cd frontend
npm install

# 2. Run development server
npm run dev

# 3. Build for production
npm run build

# 4. Run test suite
npm run test
```

The application will be accessible at: `http://localhost:5173`.

---

## 5. End-to-End Operational Workflow

The application supports the full end-to-end assessment verification flow:

1. **Dashboard Overview**:
   - Inspect summary cards (Total Vehicles, Active Fleet, Geofences, Alert Rules, Today's Violations).
   - Live map preview shows existing zones (e.g. Bangalore Office) and fleet markers.

2. **Create a Geofence (`/geofences`)**:
   - Click **Create Geofence**.
   - Type a zone name (e.g., `Indiranagar Depot`) and select a category (`delivery_zone`, `restricted_zone`, `toll_zone`, etc.).
   - Click directly on the interactive map to append polygon vertices.
   - Click **Save Geofence** — updates the backend via `POST /geofences` and automatically refreshes all maps.

3. **Register a Vehicle (`/vehicles`)**:
   - Click **Register Vehicle**.
   - Input license plate (`KA-05-MN-5678`), driver name, vehicle type (`Truck`, `Van`, `Car`, `Motorcycle`), and phone.
   - Saves to PostgreSQL via `POST /vehicles`.

4. **Configure Alert Rule (`/alerts`)**:
   - Click **Configure Alert Rule**.
   - Choose target geofence, optional target vehicle (or all vehicles), and event trigger (`entry`, `exit`, `both`).
   - Persists via `POST /alerts/configure`.

5. **Simulate GPS Telemetry on Live Tracking (`/tracking`)**:
   - Select the newly created vehicle from the left sidebar.
   - Toggle **Click Map: ON** and click a location inside or outside a geofence.
   - Click **Ingest Telemetry Ping** (`POST /vehicles/location`).
   - The Go backend computes point-in-polygon ray-casting in nanoseconds, records Redis state transitions, and pushes a real-time event through WebSocket (`ws://localhost:8080/ws/alerts`).

6. **Instant Real-Time Alert Dispatch**:
   - Without refreshing the page, a live alert toast and audio chime will trigger.
   - For restricted zones, a critical red banner appears at the top of the viewport.
   - The notification bell increments and displays the vehicle and geofence details.

7. **Violation History Audit Log (`/violations`)**:
   - Open **Violation History**.
   - Filter by vehicle, geofence, or event type (`entry`/`exit`).
   - Click **Inspect** to view a dedicated map modal focusing on the breach boundary.

---

## 6. Backend Integration Notes

- **Coordinate Convention**: The Go backend expects coordinates formatted as `[latitude, longitude]`. The frontend automatically handles Leaflet conversion.
- **Timing Metrics (`time_ns`)**: All backend responses return a nanosecond execution timer (`time_ns`), which is gracefully parsed and displayed in performance badges.
- **Dual Route Support**: The backend router supports both root paths (`/geofences`, `/vehicles`, `/vehicles/location`, `/alerts/configure`, `/violations/history`, `/ws/alerts`) and `/api/v1/*` paths seamlessly.

---

## 7. Delete APIs & Resource Management

The system implements complete lifecycle deletion with referential integrity protection and immutable historical audit preservation:

### Summary of Endpoints

| Resource | Method | Path | Description | Success Status |
| :--- | :--- | :--- | :--- | :--- |
| **Vehicle** | `DELETE` | `/vehicles/{vehicle_id}` | Deactivates vehicle, revokes associated alert rules & active telemetry feeds. | `200 OK` |
| **Geofence** | `DELETE` | `/geofences/{geofence_id}` | Deletes boundary polygon, deactivates associated alert rules. | `200 OK` |
| **Alert Rule** | `DELETE` | `/alerts/configure/{alert_id}` | Deactivates rule; halts future notifications for the boundary/vehicle. | `200 OK` |
| **Violation** | `DELETE` | `/violations/{violation_id}` | Deletes individual historical audit violation entry. | `200 OK` |
| **Bulk Violations** | `POST` | `/violations/bulk-delete` | Atomically deletes multiple historical violations via database transaction. | `200 OK` |

### Standard Response Formats

- **Single Delete Success (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Vehicle deleted successfully"
  }
  ```
- **Error Response (`404 Not Found` / `400 Bad Request`)**:
  ```json
  {
    "success": false,
    "message": "Vehicle not found"
  }
  ```
- **Bulk Delete Success (`200 OK`)**:
  ```json
  {
    "success": true,
    "deleted_count": 5,
    "message": "Violations bulk deleted successfully"
  }
  ```

### Deletion & Data Retention Policies

1. **Vehicles**:
   - Soft-deleted (`status = 'deleted'`) in PostgreSQL and immediately filtered out from active fleet queries, map overlays, and selection dropdowns.
   - Associated alert rules are deactivated so no future notifications fire for the vehicle.
   - Historical violation records preserve the vehicle number and driver name snapshots so audit integrity is maintained.
2. **Geofences**:
   - Soft-deleted (`status = 'deleted'`) and immediately removed from polygon map layers and boundary dispatch checks.
   - Associated alert rules are deactivated.
   - Historical violation records preserve the geofence name snapshot.
3. **Alert Rules**:
   - Soft-deleted/deactivated (`status = 'deleted'`).
   - The Go dispatcher no longer triggers alerts or broadcasts notifications for the rule.
   - Past violation events remain untouched in the audit log.
4. **Violations Audit Log**:
   - Single item deletion via `DELETE /violations/{id}` and atomic bulk deletion via `POST /violations/bulk-delete`.
   - Executed within an explicit SQL transaction (`BEGIN ... COMMIT`) with rollback on error, reporting exact `deleted_count`.


