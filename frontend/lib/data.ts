import type {
  ConvoyPin,
  FleetUnit,
  Hazard,
  IncidentPreview,
  IncidentReport,
  KpiCard,
  MapLayer,
  NavItem,
  NotificationAlert,
  RouteOption,
  WeatherStation,
} from "./types";

export const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Command Dashboard",
    icon: "space_dashboard",
    iconClassName: "",
    badge: { text: "", className: "" },
  },
  {
    id: "hazards",
    label: "Active Hazards",
    icon: "warning",
    iconClassName: "text-apple-red",
    badge: { text: "3", className: "bg-apple-red text-white" },
  },
  {
    id: "fleet",
    label: "Fleet Tracking",
    icon: "local_shipping",
    iconClassName: "text-apple-blue",
    badge: { text: "24", className: "bg-slate-100 text-slate-500" },
  },
  {
    id: "routes",
    label: "Route Planning",
    icon: "alt_route",
    iconClassName: "text-apple-green",
    badge: { text: "18", className: "bg-slate-100 text-slate-500" },
  },
  {
    id: "weather",
    label: "Weather Intel",
    icon: "cloud",
    iconClassName: "text-apple-cyan",
    badge: {
      text: "Alert",
      className: "bg-orange-50 border border-orange-200 text-apple-orange",
    },
  },
  {
    id: "reports",
    label: "Incident Reports",
    icon: "assignment",
    iconClassName: "text-apple-purple",
    badge: { text: "142", className: "bg-slate-100 text-slate-500" },
  },
];

export const NOTIFICATIONS: NotificationAlert[] = [
];

export const KPI_CARDS: KpiCard[] = [
];

export const MAP_LAYERS: MapLayer[] = [
];

export const CONVOY_PINS: ConvoyPin[] = [
];

export const INCIDENT_PREVIEWS: IncidentPreview[] = [
];

export const HAZARDS: Hazard[] = [
];

export const FLEET_UNITS: FleetUnit[] = [
];

export const ROUTE_OPTIONS: RouteOption[] = [
];

export const ROUTE_SIMULATION_DEFAULTS = {
  origin: "",
  destination: "",
};

export const WEATHER_STATIONS: WeatherStation[] = [
];

export const INCIDENT_REPORTS: IncidentReport[] = [
];

export const AI_RECOMMENDATION = {
  confidence: "",
  primaryVectorLabel: "",
  primaryVectorNote: "",
  detourLabel: "",
  detourNote: "",
  distance: "",
  timePenalty: "",
  safetyScore: "",
};
