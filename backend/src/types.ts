export type HazardSeverity = "critical" | "high" | "moderate";

export interface GeoPoint {
  type: "Point";
  coordinates: [number, number];
}

export interface GeoLineString {
  type: "LineString";
  coordinates: [number, number][];
}

export interface CorridorRecord {
  id: string;
  name: string;
  kind: "hazard" | "route" | "fleet" | "weather";
  latitude: number;
  longitude: number;
  radiusMeters: number;
  geometry: GeoPoint | GeoLineString;
  updatedAt: string;
}

export interface HazardRecord {
  id: string;
  corridorId: string | null;
  severity: HazardSeverity;
  title: string;
  corridorName: string;
  coords: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  status: "open" | "monitoring" | "isolated";
  description: string;
  geometry: GeoPoint;
  updatedAt: string;
}

export interface FleetUnitRecord {
  id: string;
  callsign: string;
  role: string;
  status: string;
  latitude: number;
  longitude: number;
  speedKmh: number;
  latencyMs: number;
  fuelPercent: number;
  headingDeg: number;
  updatedAt: string;
}

export interface RouteRecord {
  id: string;
  name: string;
  distanceKm: number;
  etaMinutes: number;
  riskLabel: string;
  geometry: GeoLineString;
  updatedAt: string;
}

export interface WeatherStationRecord {
  id: string;
  name: string;
  conditionLabel: string;
  latitude: number;
  longitude: number;
  metrics: Array<{ label: string; value: string }>;
  advisory: string;
  updatedAt: string;
}

export interface IncidentReportRecord {
  id: string;
  reportId: string;
  timestamp: string;
  location: string;
  hazardType: string;
  severity: "Critical" | "High" | "Moderate" | "Low";
  status: string;
  updatedAt: string;
}

export interface NotificationRecord {
  id: string;
  title: string;
  description: string;
  severity: string;
  createdAt: string;
  readAt: string | null;
}

export interface KpiSnapshot {
  id: string;
  fleetCount: number;
  hazardCount: number;
  routeCount: number;
  telemetryPingMs: number;
  networkMbps: number;
  memoryPercent: number;
  updatedAt: string;
}

export interface RecommendationResult {
  routeId: string;
  routeName: string;
  score: number;
  riskScore: number;
  suitabilityScore: number;
  explanation: string[];
  factors: Array<{
    key: string;
    label: string;
    weight: number;
    risk: number;
    contribution: number;
    note: string;
  }>;
  comparison: Array<{
    routeId: string;
    routeName: string;
    distanceKm: number;
    distanceVarianceKm: number;
    delayMinutes: number;
    blocked: boolean;
    riskScore: number;
    suitabilityScore: number;
  }>;
  generatedAt: string;
}

export interface LiveSnapshot {
  hazards: HazardRecord[];
  fleetUnits: FleetUnitRecord[];
  routes: RouteRecord[];
  weatherStations: WeatherStationRecord[];
  incidentReports: IncidentReportRecord[];
  notifications: NotificationRecord[];
  kpi: KpiSnapshot;
}