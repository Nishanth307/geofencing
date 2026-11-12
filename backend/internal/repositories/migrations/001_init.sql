-- Enable PostGIS extension for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Geofences
CREATE TABLE IF NOT EXISTS geofences (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    coordinates JSONB NOT NULL,
    geom GEOMETRY(Polygon, 4326),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_geofences_geom ON geofences USING GIST(geom);

-- 2. Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(64) PRIMARY KEY,
    vehicle_number VARCHAR(100) UNIQUE NOT NULL,
    driver_name VARCHAR(255) NOT NULL,
    vehicle_type VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicles_number ON vehicles(vehicle_number);

-- 3. Vehicle Location Telemetry
CREATE TABLE IF NOT EXISTS vehicle_locations (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id VARCHAR(64) NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(Point, 4326),
    time_ns BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicle_locations_vehicle ON vehicle_locations(vehicle_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_locations_geom ON vehicle_locations USING GIST(geom);

-- 4. Alerts / Boundary Violations
CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(64) PRIMARY KEY,
    geofence_id VARCHAR(64) NOT NULL REFERENCES geofences(id) ON DELETE CASCADE,
    vehicle_id VARCHAR(64) NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    time_ns BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_geofence ON alerts(geofence_id);
CREATE INDEX IF NOT EXISTS idx_alerts_vehicle ON alerts(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);

