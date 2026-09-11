CREATE TABLE IF NOT EXISTS corridors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 0,
  geometry JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hazards (
  id TEXT PRIMARY KEY,
  corridor_id TEXT REFERENCES corridors(id) ON DELETE SET NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  corridor_name TEXT NOT NULL,
  coords TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  description TEXT NOT NULL,
  geometry JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fleet_units (
  id TEXT PRIMARY KEY,
  callsign TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  speed_kmh NUMERIC(6,2) NOT NULL,
  latency_ms INTEGER NOT NULL,
  fuel_percent INTEGER NOT NULL,
  heading_deg INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS route_options (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  distance_km NUMERIC(6,2) NOT NULL,
  eta_minutes INTEGER NOT NULL,
  risk_label TEXT NOT NULL,
  geometry JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weather_stations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  condition_label TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  metrics JSONB NOT NULL,
  advisory TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incident_reports (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL UNIQUE,
  timestamp TEXT NOT NULL,
  location TEXT NOT NULL,
  hazard_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS kpi_snapshots (
  id TEXT PRIMARY KEY,
  fleet_count INTEGER NOT NULL,
  hazard_count INTEGER NOT NULL,
  route_count INTEGER NOT NULL,
  telemetry_ping_ms INTEGER NOT NULL,
  network_mbps NUMERIC(6,2) NOT NULL,
  memory_percent INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);