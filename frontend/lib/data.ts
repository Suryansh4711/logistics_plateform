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
    badge: { text: "4", className: "bg-apple-red text-white" },
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
  { id: "hazards", label: "Hazard Pins", dotClassName: "bg-apple-red" },
  { id: "fleet", label: "Convoy Pins", dotClassName: "bg-apple-blue" },
  { id: "routes", label: "Route Lines", dotClassName: "bg-apple-green" },
];

export const CONVOY_PINS: ConvoyPin[] = [
  {
    id: "alpha-01",
    callsign: "Alpha-01",
    role: "lead",
    latitude: 27.3228,
    longitude: 88.5887,
    top: 320,
    left: 260,
    speed: "58 km/h",
    toastMessage: "Alpha-01: Velocity 58 km/h, SatLink Good",
  },
  {
    id: "bravo-04",
    callsign: "Bravo-04",
    role: "detour",
    latitude: 27.3014,
    longitude: 88.6321,
    top: 195,
    left: 630,
    speed: "",
    detourNote: "Detour A-7 • ETA +14m",
    toastMessage: "Bravo-04: Transiting Detour Alpha-7",
  },
  {
    id: "charlie-09",
    callsign: "Charlie-09",
    role: "detour",
    latitude: 27.2895,
    longitude: 88.5738,
    top: 240,
    left: 410,
    speed: "49 km/h",
    detourNote: "Corridor Beta • ETA +18m",
    toastMessage: "Charlie-09: Holding lane on Corridor Beta",
  },
  {
    id: "delta-12",
    callsign: "Delta-12",
    role: "lead",
    latitude: 27.2658,
    longitude: 88.5482,
    top: 380,
    left: 210,
    speed: "62 km/h",
    toastMessage: "Delta-12: Medical escort maintaining pace",
  },
];

export const INCIDENT_PREVIEWS: IncidentPreview[] = [
];

export const HAZARDS: Hazard[] = [
  {
    id: "hz-nh29",
    severity: "critical",
    severityLabel: "Critical Severity",
    severityClassName: "text-apple-red bg-red-50 border-red-200",
    title: "NH-29 Landslide (KM 142.6)",
    corridorName: "NH-29 KM 142",
    coords: "27°19'44\"N 88°36'11\"E • Debris: 4,200m³",
    latitude: 27.329,
    longitude: 88.6031,
    icon: "landslide",
    iconClassName: "text-apple-red",
    description:
      "Major rockfall obstructing dual-lane highway. Geological sensors detect secondary slope creep. All inbound transport must divert.",
    quarantineClassName: "bg-red-50 hover:bg-red-100 text-apple-red border-red-200",
    secondaryAction: {
      label: "Dispatch Drone",
      toastMessage: "Drone recon footage requested for NH-29",
    },
  },
  {
    id: "hz-kali",
    severity: "high",
    severityLabel: "High Severity",
    severityClassName: "text-apple-orange bg-orange-50 border-orange-200",
    title: "Kali River Surge & Flash Flood",
    corridorName: "Kali River Bridge",
    coords: "27°14'18\"N 88°31'02\"E • River Stage: +1.8m",
    latitude: 27.2383,
    longitude: 88.5172,
    icon: "flood",
    iconClassName: "text-apple-orange",
    description:
      "Bridge clearance reduced to 0.4m above water crest. High sediment current poses structural fatigue risk.",
    quarantineClassName:
      "bg-orange-50 hover:bg-orange-100 text-apple-orange border-orange-200",
    secondaryAction: {
      label: "Sound Siren",
      toastMessage: "Flood sirens engaged at Kali River span",
    },
  },
  {
    id: "hz-sela",
    severity: "moderate",
    severityLabel: "Moderate Severity",
    severityClassName: "text-apple-blue bg-blue-50 border-blue-200",
    title: "Sela Pass Peak Road Icing",
    corridorName: "Sela Pass High Corridor",
    coords: "27°30'05\"N 88°42'50\"E • Temp: -6.4°C",
    latitude: 27.5014,
    longitude: 88.7139,
    icon: "severe_cold",
    iconClassName: "text-apple-blue",
    description:
      "Sub-zero surface conditions producing black ice. Grip telemetry down to 32%. Tire snow chain mandate enforced.",
    quarantineClassName:
      "bg-blue-50 hover:bg-blue-100 text-apple-blue border-blue-200",
    secondaryAction: {
      label: "Deploy Salt",
      toastMessage: "Grit spreader dispatched to Sela Pass",
    },
  },
  {
    id: "hz-teesta",
    severity: "moderate",
    severityLabel: "Moderate Severity",
    severityClassName: "text-slate-600 bg-slate-100 border-slate-100",
    title: "Teesta Gorge Rockfall Hazard",
    corridorName: "Teesta Gorge",
    coords: "27°08'12\"N 88°28'30\"E • Acoustic: Active",
    latitude: 27.1367,
    longitude: 88.475,
    icon: "warning",
    iconClassName: "text-slate-600",
    description:
      "Loose gravel and periodic rock slides triggered by continuous precipitation. Single-lane alternating convoy only.",
    quarantineClassName: "bg-slate-100 hover:bg-slate-200 text-slate-800 border-transparent",
    secondaryAction: {
      label: "Deploy Pilot",
      toastMessage: "Traffic control pilot car deployed",
    },
  },
];

export const FLEET_UNITS: FleetUnit[] = [
  {
    id: "alpha-01",
    callsign: "Alpha-01 (Convoy Lead)",
    role: "Convoy Lead",
    status: "En Route",
    latitude: 27.3228,
    longitude: 88.5887,
    statusClassName: "bg-emerald-50 text-apple-green border-emerald-200",
    speedKmh: "58.4 km/h",
    latencyMs: "14 ms",
    fuelPercent: 82,
    fuelBarClassName: "bg-apple-green",
  },
  {
    id: "bravo-04",
    callsign: "Bravo-04 (Heavy Cargo)",
    role: "Heavy Cargo",
    status: "Detour A-7",
    latitude: 27.3014,
    longitude: 88.6321,
    statusClassName: "bg-blue-50 text-apple-blue border-blue-200",
    speedKmh: "42.1 km/h",
    latencyMs: "21 ms",
    fuelPercent: 64,
    fuelBarClassName: "bg-apple-blue",
  },
  {
    id: "charlie-09",
    callsign: "Charlie-09 (Escort)",
    role: "Escort",
    status: "Corridor Beta",
    latitude: 27.2895,
    longitude: 88.5738,
    statusClassName: "bg-orange-50 text-apple-orange border-orange-200",
    speedKmh: "49.3 km/h",
    latencyMs: "18 ms",
    fuelPercent: 71,
    fuelBarClassName: "bg-apple-orange",
  },
  {
    id: "delta-12",
    callsign: "Delta-12 (Medical Escort)",
    role: "Medical Escort",
    status: "En Route",
    latitude: 27.2658,
    longitude: 88.5482,
    statusClassName: "bg-emerald-50 text-apple-green border-emerald-200",
    speedKmh: "62.8 km/h",
    latencyMs: "16 ms",
    fuelPercent: 48,
    fuelBarClassName: "bg-apple-orange",
  },
];

export const ROUTE_OPTIONS: RouteOption[] = [
  {
    id: "detour-alpha-7",
    name: "Detour Alpha-7 (Bypass Ridge)",
    nameClassName: "text-apple-blue",
    latitude: 27.3152,
    longitude: 88.6248,
    distanceKm: "78.4 km",
    time: "1h 48m",
    timeClassName: "text-apple-blue",
    riskLabel: "Optimal (0 Hazards)",
    riskClassName: "bg-emerald-50 text-apple-green",
    path: [
      [27.2658, 88.5482],
      [27.2895, 88.5738],
      [27.3152, 88.6248],
      [27.3484, 88.681],
    ],
    action: {
      label: "Broadcast",
      className: "bg-apple-blue text-white",
      toastMessage: "Detour Alpha-7 broadcasted to fleet",
    },
  },
  {
    id: "route-a",
    name: "Primary Route A (NH-29)",
    nameClassName: "text-slate-800",
    latitude: 27.329,
    longitude: 88.6031,
    distanceKm: "66.0 km",
    time: "Blocked (+4h)",
    timeClassName: "text-apple-red",
    riskLabel: "Critical Block",
    riskClassName: "bg-red-50 text-apple-red",
    path: [
      [27.2658, 88.5482],
      [27.2978, 88.5775],
      [27.329, 88.6031],
      [27.3474, 88.6194],
    ],
    action: {
      label: "Quarantine",
      className: "bg-slate-100 hover:bg-slate-200 text-slate-700",
      toastMessage: "Corridor Route A quarantined. Traffic gates locked.",
      corridorName: "Route A",
    },
  },
  {
    id: "corridor-beta",
    name: "Corridor Beta (River Run)",
    nameClassName: "text-slate-800",
    latitude: 27.2383,
    longitude: 88.5172,
    distanceKm: "84.2 km",
    time: "2h 15m",
    timeClassName: "text-slate-800",
    riskLabel: "Flood Risk",
    riskClassName: "bg-orange-50 text-apple-orange",
    path: [
      [27.2658, 88.5482],
      [27.2554, 88.5351],
      [27.2383, 88.5172],
      [27.2198, 88.5001],
    ],
    action: {
      label: "Hold Reserve",
      className: "bg-slate-100 hover:bg-slate-200 text-slate-700",
      toastMessage: "Corridor Beta marked as Secondary Reserve",
    },
  },
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
