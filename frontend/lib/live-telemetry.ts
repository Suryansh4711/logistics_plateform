"use client";

import { useEffect, useState } from "react";
import {
  CONVOY_PINS,
  FLEET_UNITS,
  HAZARDS,
  INCIDENT_REPORTS,
  ROUTE_OPTIONS,
  WEATHER_STATIONS,
} from "./data";
import type {
  FleetUnit,
  Hazard,
  IncidentReport,
  RouteOption,
  WeatherStation,
} from "./types";

const HOUR = 60 * 60 * 1000;

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

export function useLiveClock(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return now;
}

export function getLiveDashboardSnapshot(now: Date) {
  const fleetCount = FLEET_UNITS.length;
  const hazardCount = HAZARDS.length;
  const routeCount = ROUTE_OPTIONS.length;
  const weatherCount = WEATHER_STATIONS.length;
  const pingMs = Math.round(12 + wave(now, 1, 3.5, 45_000));
  const throughput = (7.9 + wave(now, 2, 0.8, 60_000)).toFixed(1);
  const memory = clamp(Math.round(32 + wave(now, 3, 4, 90_000)), 18, 54);

  return {
    utcTime: formatUtcTime(now),
    localTime: formatLocalTime(now),
    fleetCount,
    hazardCount,
    routeCount,
    weatherCount,
    pingMs,
    throughput,
    memory,
    leadUnit: CONVOY_PINS[0],
    leadHazard: HAZARDS[0],
    primaryRoute: ROUTE_OPTIONS[0],
    latestIncident: INCIDENT_REPORTS[0] ?? null,
  };
}

export interface LiveFleetUnit extends FleetUnit {
  liveSpeedKmh: string;
  liveLatencyMs: string;
  liveFuelPercent: number;
  liveUpdatedAt: string;
}

export function getLiveFleetUnits(now: Date): LiveFleetUnit[] {
  return FLEET_UNITS.map((unit, index) => {
    const speedBase = Number.parseFloat(unit.speedKmh);
    const speed = Math.max(0, speedBase + wave(now, index + 4, 3.2, 30_000));
    const latency = Math.max(8, Math.round(12 + wave(now, index + 9, 4, 24_000)));
    const fuel = clamp(
      Math.round(unit.fuelPercent + wave(now, index + 13, 4, 120_000)),
      0,
      100,
    );

    return {
      ...unit,
      liveSpeedKmh: `${speed.toFixed(1)} km/h`,
      liveLatencyMs: `${latency} ms`,
      liveFuelPercent: fuel,
      liveUpdatedAt: formatUtcTime(now),
    };
  });
}

export interface LiveHazard extends Hazard {
  liveRiskIndex: number;
  liveUpdatedAt: string;
}

export function getLiveHazards(now: Date): LiveHazard[] {
  return HAZARDS.map((hazard, index) => ({
    ...hazard,
    liveRiskIndex: clamp(
      Math.round(72 + wave(now, index + 2, 12, 90_000)),
      0,
      100,
    ),
    liveUpdatedAt: formatUtcTime(now),
  }));
}

export interface LiveRoute extends RouteOption {
  liveEta: string;
  liveDelay: string;
  liveUpdatedAt: string;
}

export function getLiveRoutes(now: Date): LiveRoute[] {
  return ROUTE_OPTIONS.map((route, index) => {
    const parsed = parseDuration(route.time);
    const extraMinutes = clamp(Math.round(wave(now, index + 5, 6, 75_000)), 0, 35);

    if (route.id === "route-a") {
      return {
        ...route,
        liveEta: "Blocked",
        liveDelay: "+4h",
        liveUpdatedAt: formatUtcTime(now),
      };
    }

    const totalMinutes = parsed.hours * 60 + parsed.minutes + extraMinutes;
    const liveHours = Math.floor(totalMinutes / 60);
    const liveMinutes = totalMinutes % 60;

    return {
      ...route,
      liveEta: `${liveHours}h ${liveMinutes < 10 ? "0" : ""}${liveMinutes}m`,
      liveDelay: `+${extraMinutes}m`,
      liveUpdatedAt: formatUtcTime(now),
    };
  });
}

export interface LiveWeatherStation extends WeatherStation {
  liveUpdatedAt: string;
}

export function getLiveWeatherStations(now: Date): LiveWeatherStation[] {
  return WEATHER_STATIONS.map((station, index) => ({
    ...station,
    liveUpdatedAt: formatUtcTime(now),
    metrics: station.metrics.map((metric, metricIndex) => {
      if (metric.label.includes("Temperature")) {
        const base = Number.parseFloat(metric.value.replace(/[^0-9.-]/g, ""));
        const delta = wave(now, index + metricIndex + 3, 1.2, 80_000);
        return {
          ...metric,
          value: `${(base + delta).toFixed(1)}°C`,
        };
      }

      if (metric.label.includes("Wind Speed")) {
        return {
          ...metric,
          value: metric.value.replace(/\d+/, (match) => String(Math.max(4, Number(match) + Math.round(wave(now, index + 4, 3, 70_000))))),
        };
      }

      if (metric.label.includes("Pressure")) {
        const base = Number.parseFloat(metric.value);
        const delta = Math.round(wave(now, index + metricIndex + 6, 4, 120_000));
        return {
          ...metric,
          value: `${Math.round(base + delta)} hPa`,
        };
      }

      if (metric.label.includes("Visibility")) {
        return {
          ...metric,
          value: metric.value,
        };
      }

      return metric;
    }),
  }));
}

export interface LiveIncident extends IncidentReport {
  liveAge: string;
  liveUpdatedAt: string;
}

export function getLiveIncidents(now: Date): LiveIncident[] {
  if (INCIDENT_REPORTS.length === 0) {
    const hazard = HAZARDS[0];

    return [
      {
        id: "live-hazard-01",
        reportId: "IR-LIVE-001",
        timestamp: formatUtcTime(now),
        location: hazard.corridorName,
        hazardType: hazard.title,
        severity: "Critical",
        severityClassName: "bg-red-50 text-apple-red",
        status: "Monitoring",
        statusClassName: "bg-blue-50 text-apple-blue",
        action: {
          label: "Open Alert",
          className: "bg-apple-blue text-white",
          toastMessage: "Live corridor alert opened from hazard telemetry",
        },
        liveAge: "0m ago",
        liveUpdatedAt: formatUtcTime(now),
      },
    ];
  }

  return INCIDENT_REPORTS.map((report, index) => {
    const ageMinutes = index * 4 + (now.getUTCMinutes() % 5);

    return {
      ...report,
      liveAge: `${ageMinutes}m ago`,
      liveUpdatedAt: formatUtcTime(now),
    };
  });
}

export function getLiveLeadRoute(now: Date) {
  const route = ROUTE_OPTIONS[0];
  const totalMinutes = parseDuration(route.time).hours * 60 + parseDuration(route.time).minutes;
  const jitter = Math.round(wave(now, 7, 5, 65_000));
  const minutes = totalMinutes + jitter;
  return {
    name: route.name,
    updatedAt: formatUtcTime(now),
    eta: `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`,
  };
}