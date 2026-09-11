"use client";

import { useEffect, useSyncExternalStore } from "react";
import { io, type Socket } from "socket.io-client";
import {
  CONVOY_PINS,
  HAZARDS,
  INCIDENT_REPORTS,
  ROUTE_OPTIONS,
  WEATHER_STATIONS,
} from "./data";
import type { NotificationAlert } from "./types";

type BackendHazard = {
  id: string;
  title: string;
  severity: "critical" | "high" | "moderate";
  corridorName: string;
  coords: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  status: "open" | "monitoring" | "isolated";
  description: string;
  geometry: { type: "Point"; coordinates: [number, number] };
  updatedAt: string;
};

type BackendFleetUnit = {
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
};

type BackendRoute = {
  id: string;
  name: string;
  distanceKm: number;
  etaMinutes: number;
  riskLabel: string;
  geometry: { type: "LineString"; coordinates: [number, number][] };
  updatedAt: string;
};

type BackendWeatherStation = {
  id: string;
  name: string;
  conditionLabel: string;
  latitude: number;
  longitude: number;
  metrics: Array<{ label: string; value: string; valueClassName?: string }>;
  advisory: string;
  updatedAt: string;
};

type BackendIncident = {
  id: string;
  reportId: string;
  timestamp: string;
  location: string;
  hazardType: string;
  severity: "Critical" | "High" | "Moderate" | "Low";
  status: string;
  updatedAt: string;
};

type BackendNotification = {
  id: string;
  title: string;
  description: string;
  severity: string;
  createdAt: string;
  readAt: string | null;
};

type BackendKpi = {
  id: string;
  fleetCount: number;
  hazardCount: number;
  routeCount: number;
  telemetryPingMs: number;
  networkMbps: number;
  memoryPercent: number;
  updatedAt: string;
};

type BackendSnapshot = {
  hazards: BackendHazard[];
  fleetUnits: BackendFleetUnit[];
  routes: BackendRoute[];
  weatherStations: BackendWeatherStation[];
  incidentReports: BackendIncident[];
  notifications: BackendNotification[];
  kpi: BackendKpi;
};

export interface LiveHazard extends BackendHazard {
  severityLabel: string;
  severityClassName: string;
  quarantineClassName: string;
  icon: string;
  iconClassName: string;
  liveRiskIndex: number;
  liveUpdatedAt: string;
}

export interface LiveFleetUnit extends BackendFleetUnit {
  statusClassName: string;
  fuelBarClassName: string;
  liveSpeedKmh: string;
  liveLatencyMs: string;
  liveFuelPercent: number;
  liveUpdatedAt: string;
}

export interface LiveRoute extends BackendRoute {
  nameClassName: string;
  time: string;
  timeClassName: string;
  riskClassName: string;
  liveEta: string;
  liveDelay: string;
  liveUpdatedAt: string;
}

export interface LiveWeatherStation extends BackendWeatherStation {
  conditionClassName: string;
  advisoryClassName: string;
  metrics: Array<{ label: string; value: string; valueClassName: string }>;
  liveUpdatedAt: string;
}

export interface LiveIncident extends BackendIncident {
  severityClassName: string;
  statusClassName: string;
  liveAge: string;
  liveUpdatedAt: string;
}

export interface TelemetrySnapshot {
  backendConnected: boolean;
  utcTime: string;
  localTime: string;
  memory: number;
  pingMs: number;
  throughput: string;
  fleetCount: number;
  hazardCount: number;
  routeCount: number;
  weatherCount: number;
  leadUnit: { callsign: string };
  leadHazard: { title: string };
  primaryRoute: { name: string };
  latestIncident: { reportId: string } | null;
  hazards: LiveHazard[];
  fleetUnits: LiveFleetUnit[];
  routes: LiveRoute[];
  weatherStations: LiveWeatherStation[];
  incidentReports: LiveIncident[];
  notifications: NotificationAlert[];
}

const FALLBACK_URL = "http://localhost:4000";
const listeners = new Set<() => void>();

let socket: Socket | null = null;
let initializationStarted = false;
let fallbackTimer: number | null = null;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseDuration(duration: string) {
  const hoursMatch = duration.match(/(\d+)h/);
  const minutesMatch = duration.match(/(\d+)m/);
  return {
    hours: hoursMatch ? Number(hoursMatch[1]) : 0,
    minutes: minutesMatch ? Number(minutesMatch[1]) : 0,
  };
}

function formatUtcTime(now: Date) {
  return now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

function formatLocalTime(now: Date) {
  return now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
}

function wave(now: Date, seed: number, amplitude: number, periodMs: number) {
  return Math.sin(now.getTime() / periodMs + seed) * amplitude;
}

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function backendUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? FALLBACK_URL;
}

function severityLabel(severity: BackendHazard["severity"]) {
  if (severity === "critical") return "Critical Severity";
  if (severity === "high") return "High Severity";
  return "Moderate Severity";
}

function severityClassName(severity: BackendHazard["severity"]) {
  if (severity === "critical") return "text-apple-red bg-red-50 border-red-200";
  if (severity === "high") return "text-apple-orange bg-orange-50 border-orange-200";
  return "text-apple-blue bg-blue-50 border-blue-200";
}

function quarantineClassName(severity: BackendHazard["severity"]) {
  if (severity === "critical") return "bg-red-50 hover:bg-red-100 text-apple-red border-red-200";
  if (severity === "high") return "bg-orange-50 hover:bg-orange-100 text-apple-orange border-orange-200";
  return "bg-blue-50 hover:bg-blue-100 text-apple-blue border-blue-200";
}

function liveRiskIndex(hazard: BackendHazard, now: Date) {
  const base = hazard.severity === "critical" ? 88 : hazard.severity === "high" ? 74 : 61;
  const statusBonus = hazard.status === "isolated" ? -16 : hazard.status === "open" ? 6 : 0;
  return clamp(Math.round(base + statusBonus + wave(now, hazard.latitude, 4, 90_000)), 0, 100);
}

function routeClassNames(routeId: string) {
  if (routeId === "route-a") {
    return {
      nameClassName: "text-slate-800",
      timeClassName: "text-apple-red",
      riskClassName: "bg-red-50 text-apple-red",
    };
  }

  if (routeId === "detour-alpha-7") {
    return {
      nameClassName: "text-apple-blue",
      timeClassName: "text-apple-blue",
      riskClassName: "bg-emerald-50 text-apple-green",
    };
  }

  return {
    nameClassName: "text-slate-800",
    timeClassName: "text-slate-800",
    riskClassName: "bg-orange-50 text-apple-orange",
  };
}

function weatherClassName(conditionLabel: string) {
  if (conditionLabel.toLowerCase().includes("fog") || conditionLabel.toLowerCase().includes("freeze")) {
    return {
      conditionClassName: "bg-blue-50 text-apple-blue border-blue-200",
      advisoryClassName: "bg-blue-50 text-apple-blue border border-blue-100",
    };
  }
  return {
    conditionClassName: "bg-orange-50 text-apple-orange border-orange-200",
    advisoryClassName: "bg-orange-50 text-apple-orange border border-orange-100",
  };
}

function weatherMetricClassName(label: string) {
  if (label === "Temperature") return "text-apple-blue";
  if (label === "Wind Speed") return "text-apple-orange";
  if (label === "Pressure") return "text-slate-900";
  return "text-apple-green";
}

function notificationView(notification: BackendNotification): NotificationAlert {
  const severity = notification.severity.toLowerCase();
  if (severity.includes("warn")) {
    return {
      id: notification.id,
      icon: "warning",
      iconClassName: "text-apple-orange",
      containerClassName: "bg-orange-50 border-orange-200",
      title: notification.title,
      description: notification.description,
    };
  }

  if (severity.includes("crit")) {
    return {
      id: notification.id,
      icon: "error",
      iconClassName: "text-apple-red",
      containerClassName: "bg-red-50 border-red-200",
      title: notification.title,
      description: notification.description,
    };
  }

  return {
    id: notification.id,
    icon: "notifications",
    iconClassName: "text-apple-blue",
    containerClassName: "bg-blue-50 border-blue-200",
    title: notification.title,
    description: notification.description,
  };
}

function buildSnapshotFromBackend(raw: BackendSnapshot, now = new Date()): TelemetrySnapshot {
  const hazards = raw.hazards.map((hazard) => ({
    ...hazard,
    severityLabel: severityLabel(hazard.severity),
    severityClassName: severityClassName(hazard.severity),
    quarantineClassName: quarantineClassName(hazard.severity),
    icon: hazard.severity === "critical" ? "landslide" : hazard.severity === "high" ? "flood" : "warning",
    iconClassName: hazard.severity === "critical" ? "text-apple-red" : hazard.severity === "high" ? "text-apple-orange" : "text-apple-blue",
    liveRiskIndex: liveRiskIndex(hazard, now),
    liveUpdatedAt: formatUtcTime(now),
  }));

  const fleetUnits = raw.fleetUnits.map((unit, index) => ({
    ...unit,
    statusClassName: index % 2 === 0 ? "bg-emerald-50 text-apple-green border-emerald-200" : "bg-blue-50 text-apple-blue border-blue-200",
    fuelBarClassName: index % 2 === 0 ? "bg-apple-green" : "bg-apple-blue",
    liveSpeedKmh: `${unit.speedKmh.toFixed(1)} km/h`,
    liveLatencyMs: `${unit.latencyMs} ms`,
    liveFuelPercent: unit.fuelPercent,
    liveUpdatedAt: formatUtcTime(now),
  }));

  const routes = raw.routes.map((route) => {
    const routeStyles = routeClassNames(route.id);
    const etaMinutes = route.id === "route-a" ? route.etaMinutes : route.etaMinutes + Math.round(wave(now, route.distanceKm, 5, 75_000));
    return {
      ...route,
      ...routeStyles,
      time: route.id === "route-a" ? "Blocked (+4h)" : `${Math.floor(etaMinutes / 60)}h ${String(etaMinutes % 60).padStart(2, "0")}m`,
      liveEta: route.id === "route-a" ? "Blocked" : `${Math.floor(etaMinutes / 60)}h ${String(etaMinutes % 60).padStart(2, "0")}m`,
      liveDelay: route.id === "route-a" ? "+4h" : `+${Math.max(0, etaMinutes - route.etaMinutes)}m`,
      liveUpdatedAt: formatUtcTime(now),
    };
  });

  const weatherStations = raw.weatherStations.map((station) => ({
    ...station,
    ...weatherClassName(station.conditionLabel),
    metrics: station.metrics.map((metric) => ({
      ...metric,
      valueClassName: metric.valueClassName ?? weatherMetricClassName(metric.label),
    })),
    liveUpdatedAt: formatUtcTime(now),
  }));

  const incidentReports = raw.incidentReports.map((report, index) => ({
    ...report,
    severityClassName:
      report.severity === "Critical"
        ? "bg-red-50 text-apple-red"
        : report.severity === "High"
          ? "bg-orange-50 text-apple-orange"
          : "bg-blue-50 text-apple-blue",
    statusClassName: index === 0 ? "bg-red-50 text-apple-red" : "bg-blue-50 text-apple-blue",
    liveAge: `${Math.max(0, index * 4 + now.getUTCMinutes() % 6)}m ago`,
    liveUpdatedAt: formatUtcTime(now),
  }));

  const notifications = raw.notifications.map(notificationView);
  const leadUnit = fleetUnits[0] ?? { callsign: CONVOY_PINS[0]?.callsign ?? "Unknown" };
  const leadHazard = hazards[0] ?? { title: HAZARDS[0]?.title ?? "No hazards" };
  const primaryRoute = routes[0] ?? { name: ROUTE_OPTIONS[0]?.name ?? "No routes" };
  const latestIncident = incidentReports[0] ? { reportId: incidentReports[0].reportId } : null;

  return {
    backendConnected: true,
    utcTime: formatUtcTime(now),
    localTime: formatLocalTime(now),
    memory: raw.kpi.memoryPercent,
    pingMs: raw.kpi.telemetryPingMs,
    throughput: `${raw.kpi.networkMbps.toFixed(1)} MB/s`,
    fleetCount: raw.kpi.fleetCount,
    hazardCount: raw.kpi.hazardCount,
    routeCount: raw.kpi.routeCount,
    weatherCount: raw.weatherStations.length,
    leadUnit,
    leadHazard,
    primaryRoute,
    latestIncident,
    hazards,
    fleetUnits,
    routes,
    weatherStations,
    incidentReports,
    notifications,
  };
}

function buildFallbackSnapshot(now: Date = new Date()): TelemetrySnapshot {
  const hazardSeed = HAZARDS;
  const fleetSeed = CONVOY_PINS.map((pin, index) => ({
    id: pin.id,
    callsign: pin.callsign,
    role: pin.role,
    status: pin.role === "lead" ? "En Route" : "Detour A-7",
    latitude: pin.latitude,
    longitude: pin.longitude,
    speedKmh: pin.role === "lead" ? 58.4 : 42.1,
    latencyMs: pin.role === "lead" ? 14 : 21,
    fuelPercent: pin.role === "lead" ? 82 : 64,
    headingDeg: index === 0 ? 48 : 31,
    updatedAt: formatUtcTime(now),
  }));

  const routeSeed = ROUTE_OPTIONS.map((route) => ({
    id: route.id,
    name: route.name,
    distanceKm: Number(route.distanceKm.replace(/[^0-9.]/g, "")),
    etaMinutes: route.id === "route-a" ? 9999 : parseDuration(route.time).hours * 60 + parseDuration(route.time).minutes,
    riskLabel: route.riskLabel,
    geometry: { type: "LineString" as const, coordinates: route.path.map(([lat, lng]) => [lng, lat] as [number, number]) },
    updatedAt: formatUtcTime(now),
  }));

  const weatherSeed = WEATHER_STATIONS.map((station) => ({
    id: station.id,
    name: station.name,
    conditionLabel: station.conditionLabel,
    latitude: 0,
    longitude: 0,
    metrics: station.metrics.map((metric) => ({
      ...metric,
      valueClassName: weatherMetricClassName(metric.label),
    })),
    advisory: station.advisory,
    updatedAt: formatUtcTime(now),
  }));

  const incidentSeed = INCIDENT_REPORTS.map((report, index) => ({
    id: report.id,
    reportId: report.reportId,
    timestamp: now.toISOString(),
    location: report.location,
    hazardType: report.hazardType,
    severity: "Moderate" as const,
    status: "Open",
    updatedAt: formatUtcTime(now),
  }));

  const fallbackKpi = {
    id: "kpi-fallback",
    fleetCount: fleetSeed.length,
    hazardCount: hazardSeed.length,
    routeCount: routeSeed.length,
    telemetryPingMs: Math.round(12 + wave(now, 1, 3, 45_000)),
    networkMbps: Number((7.9 + wave(now, 2, 0.8, 60_000)).toFixed(1)),
    memoryPercent: clamp(Math.round(32 + wave(now, 3, 4, 90_000)), 18, 54),
    updatedAt: formatUtcTime(now),
  };

  const raw: BackendSnapshot = {
    hazards: hazardSeed.map((hazard) => ({
      id: hazard.id,
      title: hazard.title,
      severity: hazard.severity,
      corridorName: hazard.corridorName,
      coords: hazard.coords,
      latitude: hazard.latitude,
      longitude: hazard.longitude,
      radiusMeters: 0,
      status: "open",
      description: hazard.description,
      geometry: { type: "Point", coordinates: [hazard.longitude, hazard.latitude] },
      updatedAt: formatUtcTime(now),
    })),
    fleetUnits: fleetSeed,
    routes: routeSeed,
    weatherStations: weatherSeed,
    incidentReports: incidentSeed,
    notifications: [],
    kpi: fallbackKpi,
  };

  return buildSnapshotFromBackend(raw, now);
}

function getSnapshot() {
  return currentSnapshot;
}

let currentSnapshot = buildFallbackSnapshot();

async function initializeTelemetry() {
  if (initializationStarted || typeof window === "undefined") {
    return;
  }

  initializationStarted = true;

  const url = backendUrl();

  try {
    const response = await fetch(`${url}/api/snapshot`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Telemetry snapshot request failed with ${response.status}`);
    }

    const snapshot = (await response.json()) as BackendSnapshot;
    currentSnapshot = buildSnapshotFromBackend(snapshot, new Date());
    notify();

    socket = io(url, {
      transports: ["websocket"],
      withCredentials: false,
    });

    socket.on("telemetry:update", (payload: BackendSnapshot) => {
      currentSnapshot = buildSnapshotFromBackend(payload, new Date());
      notify();
    });

    socket.on("disconnect", () => {
      currentSnapshot = { ...currentSnapshot, backendConnected: false };
      notify();
    });

    socket.on("connect", () => {
      currentSnapshot = { ...currentSnapshot, backendConnected: true };
      notify();
    });
  } catch {
    if (fallbackTimer === null) {
      fallbackTimer = window.setInterval(() => {
        currentSnapshot = buildFallbackSnapshot(new Date());
        notify();
      }, 1000);
    }
  }
}

export function useTelemetrySnapshot() {
  useEffect(() => {
    void initializeTelemetry();
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function getTelemetrySnapshot() {
  return currentSnapshot;
}
