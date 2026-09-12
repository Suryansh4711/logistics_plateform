import type {
  FleetUnitRecord,
  HazardRecord,
  IncidentReportRecord,
  KpiSnapshot,
  NotificationRecord,
  RecommendationResult,
  RouteRecord,
  WeatherStationRecord,
} from "./types";

const iso = () => new Date().toISOString();

export const seedHazards: HazardRecord[] = [
  {
    id: "hz-nh29",
    corridorId: "corridor-nh29",
    severity: "critical",
    title: "NH-29 Landslide (KM 142.6)",
    corridorName: "NH-29 KM 142",
    coords: "27.329, 88.6031",
    latitude: 27.329,
    longitude: 88.6031,
    radiusMeters: 1200,
    status: "open",
    description:
      "Major rockfall obstructing dual-lane highway. Geological sensors detect secondary slope creep. All inbound transport must divert.",
    geometry: { type: "Point", coordinates: [88.6031, 27.329] },
    updatedAt: iso(),
  },
  {
    id: "hz-kali",
    corridorId: "corridor-kali",
    severity: "high",
    title: "Kali River Surge & Flash Flood",
    corridorName: "Kali River Bridge",
    coords: "27.2383, 88.5172",
    latitude: 27.2383,
    longitude: 88.5172,
    radiusMeters: 900,
    status: "monitoring",
    description:
      "Bridge clearance reduced to 0.4m above water crest. High sediment current poses structural fatigue risk.",
    geometry: { type: "Point", coordinates: [88.5172, 27.2383] },
    updatedAt: iso(),
  },
  {
    id: "hz-sela",
    corridorId: "corridor-sela",
    severity: "moderate",
    title: "Sela Pass Peak Road Icing",
    corridorName: "Sela Pass High Corridor",
    coords: "27.5014, 88.7139",
    latitude: 27.5014,
    longitude: 88.7139,
    radiusMeters: 800,
    status: "monitoring",
    description:
      "Sub-zero surface conditions producing black ice. Grip telemetry down to 32%. Tire snow chain mandate enforced.",
    geometry: { type: "Point", coordinates: [88.7139, 27.5014] },
    updatedAt: iso(),
  },
];

export const seedFleetUnits: FleetUnitRecord[] = [
  {
    id: "alpha-01",
    callsign: "Alpha-01 (Convoy Lead)",
    role: "Convoy Lead",
    status: "En Route",
    latitude: 27.3228,
    longitude: 88.5887,
    speedKmh: 58.4,
    latencyMs: 14,
    fuelPercent: 82,
    headingDeg: 48,
    updatedAt: iso(),
  },
  {
    id: "bravo-04",
    callsign: "Bravo-04 (Heavy Cargo)",
    role: "Heavy Cargo",
    status: "Detour A-7",
    latitude: 27.3014,
    longitude: 88.6321,
    speedKmh: 42.1,
    latencyMs: 21,
    fuelPercent: 64,
    headingDeg: 31,
    updatedAt: iso(),
  },
  {
    id: "delta-12",
    callsign: "Delta-12 (Medical Escort)",
    role: "Medical Escort",
    status: "En Route",
    latitude: 27.2658,
    longitude: 88.5482,
    speedKmh: 62.8,
    latencyMs: 16,
    fuelPercent: 48,
    headingDeg: 35,
    updatedAt: iso(),
  },
];

export const seedRoutes: RouteRecord[] = [
  {
    id: "detour-alpha-7",
    name: "Detour Alpha-7 (Bypass Ridge)",
    distanceKm: 78.4,
    etaMinutes: 108,
    riskLabel: "Optimal (0 Hazards)",
    geometry: {
      type: "LineString",
      coordinates: [
        [88.5482, 27.2658],
        [88.5738, 27.2895],
        [88.6248, 27.3152],
        [88.681, 27.3484],
      ],
    },
    updatedAt: iso(),
  },
  {
    id: "route-a",
    name: "Primary Route A (NH-29)",
    distanceKm: 66.0,
    etaMinutes: 9999,
    riskLabel: "Critical Block",
    geometry: {
      type: "LineString",
      coordinates: [
        [88.5482, 27.2658],
        [88.5775, 27.2978],
        [88.6031, 27.329],
        [88.6194, 27.3474],
      ],
    },
    updatedAt: iso(),
  },
  {
    id: "corridor-beta",
    name: "Corridor Beta (River Run)",
    distanceKm: 84.2,
    etaMinutes: 135,
    riskLabel: "Flood Risk",
    geometry: {
      type: "LineString",
      coordinates: [
        [88.5482, 27.2658],
        [88.5351, 27.2554],
        [88.5172, 27.2383],
        [88.5001, 27.2198],
      ],
    },
    updatedAt: iso(),
  },
];

export const seedWeatherStations: WeatherStationRecord[] = [
  {
    id: "station-seala",
    name: "Sela Ridge Station",
    conditionLabel: "Freezing fog",
    latitude: 27.5014,
    longitude: 88.7139,
    metrics: [
      { label: "Temperature", value: "-6.2°C" },
      { label: "Wind Speed", value: "18 km/h" },
      { label: "Pressure", value: "1009 hPa" },
      { label: "Visibility", value: "2.1 km" },
    ],
    advisory: "Chain up all northbound units before ascent.",
    updatedAt: iso(),
  },
  {
    id: "station-kali",
    name: "Kali Flood Gauge",
    conditionLabel: "Rising water",
    latitude: 27.2383,
    longitude: 88.5172,
    metrics: [
      { label: "Temperature", value: "17.8°C" },
      { label: "Wind Speed", value: "11 km/h" },
      { label: "Pressure", value: "1006 hPa" },
      { label: "Visibility", value: "4.8 km" },
    ],
    advisory: "Bridge clearance reduced. Maintain detour routing.",
    updatedAt: iso(),
  },
];

export const seedIncidents: IncidentReportRecord[] = [
  {
    id: "incident-001",
    reportId: "IR-2048",
    timestamp: "2026-09-12 08:12",
    location: "NH-29 KM 142",
    hazardType: "Landslide",
    severity: "Critical",
    status: "Open",
    updatedAt: iso(),
  },
  {
    id: "incident-002",
    reportId: "IR-2051",
    timestamp: "2026-09-12 08:29",
    location: "Kali River Bridge",
    hazardType: "Flood surge",
    severity: "High",
    status: "Monitoring",
    updatedAt: iso(),
  },
];

export const seedNotifications: NotificationRecord[] = [
  {
    id: "note-001",
    title: "Convoy Alpha-01 cleared",
    description: "Lead unit confirmed on Alpha-7 detour and broadcasting position every 15s.",
    severity: "info",
    createdAt: iso(),
    readAt: null,
  },
  {
    id: "note-002",
    title: "Weather threshold crossed",
    description: "Sela Ridge Station dropped below -6°C. Maintain chain-up advisory.",
    severity: "warning",
    createdAt: iso(),
    readAt: null,
  },
];

export const seedKpi: KpiSnapshot = {
  id: "kpi-live",
  fleetCount: seedFleetUnits.length,
  hazardCount: seedHazards.length,
  routeCount: seedRoutes.length,
  telemetryPingMs: 14,
  networkMbps: 8.4,
  memoryPercent: 34,
  updatedAt: iso(),
};

/* ═══════════════════════════════════════════════════════════════════════════
   XAI Scoring Engine — Multi-factor heuristic route recommendation
   ───────────────────────────────────────────────────────────────────────────
   Risk Score = w_rain · R_rain + w_slope · R_slope + w_block · R_block + w_vis · R_vis

   Factor weights (SIH brief):
     rain   : 0.35  — heavy rainfall / precipitation rate
     slope  : 0.24  — slope / landslide susceptibility index
     block  : 0.12  — active field incident reports
     vis    : 0.07  — visibility / black ice risk
     (remaining 0.22 is implicit base safety margin)

   Suitability = 100 - RiskScore  (higher = safer)
   ═══════════════════════════════════════════════════════════════════════════ */

interface RiskFactor {
  key: string;
  label: string;
  weight: number;
  risk: number;        // 0–100 factor risk
  contribution: number; // weight * risk (percentage points)
  note: string;
}

interface RouteRiskProfile {
  routeId: string;
  routeName: string;
  distanceKm: number;
  blocked: boolean;
  factors: RiskFactor[];
  riskScore: number;
  suitabilityScore: number;
  distanceVarianceKm: number;
  delayMinutes: number;
}

function evaluateRouteRisk(route: typeof seedRoutes[0]): RouteRiskProfile {
  const blocked = route.id === "route-a";
  const baselineDistanceKm = 66.0; // Route A as baseline

  // ─── Per-route factor risks (0–100 scale) ───
  let rainRisk: number;
  let slopeRisk: number;
  let blockRisk: number;
  let visRisk: number;

  if (route.id === "route-a") {
    // Blocked route → maximum risk in blockage + high slope (landslide zone)
    rainRisk = 72;
    slopeRisk = 91;
    blockRisk = 100; // fully blocked
    visRisk = 45;
  } else if (route.id === "detour-alpha-7") {
    // Bypass ridge → low risk overall
    rainRisk = 22;
    slopeRisk = 18;
    blockRisk = 0;   // zero active hazard crossings
    visRisk = 12;
  } else {
    // Corridor Beta (river run) → flood + moderate other risks
    rainRisk = 68;
    slopeRisk = 34;
    blockRisk = 28;
    visRisk = 31;
  }

  // ─── Weights (SIH brief) ───
  const wRain = 0.35;
  const wSlope = 0.24;
  const wBlock = 0.12;
  const wVis = 0.07;

  const factors: RiskFactor[] = [
    {
      key: "rain",
      label: "Heavy rainfall / precipitation rate",
      weight: wRain,
      risk: rainRisk,
      contribution: Number((wRain * rainRisk).toFixed(1)),
      note: rainRisk > 60
        ? "Sustained precipitation exceeds safe drainage capacity"
        : rainRisk > 30
          ? "Moderate rain — manageable for heavy cargo units"
          : "Light conditions — no significant precipitation impact",
    },
    {
      key: "slope",
      label: "Slope / landslide susceptibility index",
      weight: wSlope,
      risk: slopeRisk,
      contribution: Number((wSlope * slopeRisk).toFixed(1)),
      note: slopeRisk > 70
        ? "Active slope creep detected — secondary slide imminent"
        : slopeRisk > 30
          ? "Moderate gradient — GPS waypoints advise reduced speed"
          : "Gentle terrain — road surface within safe tolerance",
    },
    {
      key: "block",
      label: "Active field incident reports",
      weight: wBlock,
      risk: blockRisk,
      contribution: Number((wBlock * blockRisk).toFixed(1)),
      note: blockRisk === 100
        ? "Route fully obstructed — rockfall debris 4,200m³"
        : blockRisk > 0
          ? "Partial incidents reported — single-lane alternating"
          : "Zero active hazard crossings on this corridor",
    },
    {
      key: "vis",
      label: "Visibility / black ice risk",
      weight: wVis,
      risk: visRisk,
      contribution: Number((wVis * visRisk).toFixed(1)),
      note: visRisk > 40
        ? "Sub-zero surface producing black ice patches — chain mandate"
        : visRisk > 20
          ? "Fog patches — headlamps and convoy spacing advisory"
          : "Clear visibility — no ice formation detected",
    },
  ];

  const riskScore = Number(
    factors.reduce((sum, f) => sum + f.contribution, 0).toFixed(1)
  );
  const suitabilityScore = Number((100 - riskScore).toFixed(1));

  const distanceVarianceKm = Number(
    (route.distanceKm - baselineDistanceKm).toFixed(1)
  );

  // Delay estimate: ~1.45 min per extra km for convoy speed ≈ 50 km/h average
  const delayMinutes = blocked
    ? 240 // +4h blocked
    : Math.max(0, Math.round(distanceVarianceKm * 1.45));

  return {
    routeId: route.id,
    routeName: route.name,
    distanceKm: route.distanceKm,
    blocked,
    factors,
    riskScore,
    suitabilityScore,
    distanceVarianceKm,
    delayMinutes,
  };
}

export function recommendRoute(): RecommendationResult {
  const profiles = seedRoutes.map(evaluateRouteRisk);

  // Select the route with highest suitability among non-blocked
  const viable = profiles.filter((p) => !p.blocked);
  const best = viable.sort((a, b) => b.suitabilityScore - a.suitabilityScore)[0]
    ?? profiles[0]!;

  return {
    routeId: best.routeId,
    routeName: best.routeName,
    score: best.suitabilityScore,
    riskScore: best.riskScore,
    suitabilityScore: best.suitabilityScore,
    explanation: [
      `XAI Engine selected ${best.routeName} with a ${best.suitabilityScore}% suitability score.`,
      `Composite risk score: ${best.riskScore}% (weighted across ${best.factors.length} hazard dimensions).`,
      best.distanceVarianceKm > 0
        ? `Distance penalty: +${best.distanceVarianceKm} km (+${best.delayMinutes} min estimated delay) vs baseline Route A (66.0 km).`
        : "Shortest available corridor with no distance penalty.",
      `Dominant factor: ${best.factors.sort((a, b) => b.contribution - a.contribution)[0]!.label} (+${best.factors.sort((a, b) => b.contribution - a.contribution)[0]!.contribution}%).`,
      "Fuel burn remains within the convoy's reserve threshold at projected speed.",
    ],
    factors: best.factors,
    comparison: profiles.map((p) => ({
      routeId: p.routeId,
      routeName: p.routeName,
      distanceKm: p.distanceKm,
      distanceVarianceKm: p.distanceVarianceKm,
      delayMinutes: p.delayMinutes,
      blocked: p.blocked,
      riskScore: p.riskScore,
      suitabilityScore: p.suitabilityScore,
    })),
    generatedAt: iso(),
  };
}