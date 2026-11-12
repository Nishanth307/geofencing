-- 002_delete_support.sql: Add alert_rules and violations tables and soften FK constraints for audit preservation

-- 1. Dedicated Alert Rules Table (separates configured rules from violation log)
CREATE TABLE IF NOT EXISTS alert_rules (
    id VARCHAR(64) PRIMARY KEY,
    geofence_id VARCHAR(64) NOT NULL,
    vehicle_id VARCHAR(64), -- NULL or empty means All Vehicles
    event_type VARCHAR(50) NOT NULL, -- entry, exit, both
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_geofence ON alert_rules(geofence_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_vehicle ON alert_rules(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_status ON alert_rules(status);

-- 2. Dedicated Violations History Audit Table (with snapshot columns to preserve history even if vehicle/geofence is deleted)
CREATE TABLE IF NOT EXISTS violations (
    id VARCHAR(64) PRIMARY KEY,
    geofence_id VARCHAR(64),
    geofence_name VARCHAR(255),
    vehicle_id VARCHAR(64),
    vehicle_number VARCHAR(100),
    driver_name VARCHAR(255),
    event_type VARCHAR(50) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    status VARCHAR(50) DEFAULT 'active',
    time_ns BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_violations_created_at ON violations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_violations_vehicle ON violations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_violations_geofence ON violations(geofence_id);
CREATE INDEX IF NOT EXISTS idx_violations_status ON violations(status);

-- 3. Relax foreign key constraints on legacy alerts table so historical alerts are never wiped out by vehicle/geofence deletions
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_geofence_id_fkey;
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_vehicle_id_fkey;
ALTER TABLE alerts ALTER COLUMN geofence_id DROP NOT NULL;
ALTER TABLE alerts ALTER COLUMN vehicle_id DROP NOT NULL;

