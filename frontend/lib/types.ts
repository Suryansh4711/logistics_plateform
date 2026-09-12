export type TabId =
  | "dashboard"
  | "hazards"
  | "fleet"
  | "routes"
  | "weather"
  | "reports";

export interface NavBadge {
  text: string;
  className: string;
}

export interface NavItem {
  id: TabId;
  label: string;
  icon: string;
  iconClassName: string;
  badge: NavBadge;
}

export interface NotificationAlert {
  id: string;
  icon: string;
  iconClassName: string;
  containerClassName: string;
  title: string;
  description: string;
}

export interface KpiCard {
  id: string;
  label: string;
  icon: string;
  iconClassName: string;
  value: string;
  valueSuffix: string;
  valueClassName: string;
  delta: string;
  deltaClassName: string;
  footerLabel: string;
  footerValue: string;
  footerValueClassName: string;
}

export interface ConvoyPin {
  id: string;
  callsign: string;
  role: "lead" | "detour";
  latitude: number;
  longitude: number;
  top: number;
  left: number;
  speed: string;
  detourNote?: string;
  toastMessage: string;
}

export interface MapLayer {
  id: string;
  label: string;
  dotClassName: string;
}

export interface IncidentPreview {
  id: string;
  title: string;
  severityLabel: string;
  severityClassName: string;
  description: string;
  primaryAction: { label: string; toastMessage: string };
  secondaryAction: {
    label: string;
    toastMessage: string;
    className: string;
  };
}

export interface Hazard {
  id: string;
  severity: "critical" | "high" | "moderate";
  severityLabel: string;
  severityClassName: string;
  title: string;
  corridorName: string;
  coords: string;
  latitude: number;
  longitude: number;
  icon: string;
  iconClassName: string;
  description: string;
  quarantineClassName: string;
  secondaryAction: { label: string; toastMessage: string };
}

export interface FleetUnit {
  id: string;
  callsign: string;
  role: string;
  status: string;
  latitude: number;
  longitude: number;
  statusClassName: string;
  speedKmh: string;
  latencyMs: string;
  fuelPercent: number;
  fuelBarClassName: string;
}

export interface RouteOption {
  id: string;
  name: string;
  nameClassName: string;
  latitude: number;
  longitude: number;
  distanceKm: string;
  time: string;
  timeClassName: string;
  riskLabel: string;
  riskClassName: string;
  path: [number, number][];
  action: {
    label: string;
    className: string;
    toastMessage: string;
    corridorName?: string;
  };
}

export interface WeatherMetric {
  label: string;
  value: string;
  valueClassName: string;
}

export interface WeatherStation {
  id: string;
  name: string;
  conditionLabel: string;
  conditionClassName: string;
  metrics: WeatherMetric[];
  advisory: string;
  advisoryClassName: string;
}

export interface IncidentReport {
  id: string;
  reportId: string;
  timestamp: string;
  location: string;
  hazardType: string;
  severity: "Critical" | "High" | "Moderate" | "Low";
  severityClassName: string;
  status: string;
  statusClassName: string;
  action: { label: string; className: string; toastMessage: string };
}
