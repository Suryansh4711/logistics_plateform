import cors from "cors";
import { pool } from "./db/pool";
import { evaluateRouteRisk } from "./ai/gemini";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  seedFleetUnits,
  seedHazards,
  seedIncidents,
  seedKpi,
  seedNotifications,
  seedProfile,
  seedRoutes,
  seedWeatherStations,
} from "./seed";
import type {
  FleetUnitRecord,
  HazardRecord,
  IncidentReportRecord,
  KpiSnapshot,
  LiveSnapshot,
  NotificationRecord,
  RouteRecord,
  UserProfileRecord,
  WeatherStationRecord,
} from "./types";

dotenv.config();

const PORT = Number(process.env.PORT ?? 4000);
const HOST = process.env.HOST ?? "0.0.0.0";

function parseCorsOrigin(value: string | undefined): boolean | string | string[] {
  if (!value || value === "*") {
    return true;
  }

  const origins = value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    return true;
  }

  return origins.length === 1 ? origins[0] : origins;
}

const CORS_ORIGIN = parseCorsOrigin(process.env.CORS_ORIGIN);

const app = express();
app.set("trust proxy", 1);
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// --- File Upload Setup ---
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use("/uploads", express.static(UPLOADS_DIR));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `hazard-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|bmp|heic/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype.split("/")[1] || "");
    cb(null, extOk || mimeOk);
  },
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
  },
  transports: ["websocket", "polling"],
});

const state = {
  hazards: [...seedHazards],
  fleetUnits: [...seedFleetUnits],
  routes: [...seedRoutes],
  weatherStations: [...seedWeatherStations],
  incidentReports: [...seedIncidents],
  notifications: [...seedNotifications],
  kpi: { ...seedKpi },
  profile: { ...seedProfile },
};

function toSnapshot(): LiveSnapshot {
  return {
    hazards: state.hazards,
    fleetUnits: state.fleetUnits,
    routes: state.routes,
    weatherStations: state.weatherStations,
    incidentReports: state.incidentReports,
    notifications: state.notifications,
    kpi: state.kpi,
    profile: state.profile,
  };
}

function emitSnapshot() {
  io.emit("telemetry:update", toSnapshot());
  io.emit("hazards:update", state.hazards);
  io.emit("fleet:update", state.fleetUnits);
  io.emit("routes:update", state.routes);
  io.emit("weather:update", state.weatherStations);
  io.emit("reports:update", state.incidentReports);
  io.emit("notifications:update", state.notifications);
  io.emit("kpis:update", state.kpi);
  io.emit("profile:update", state.profile);
}

function makeGeoPoint(latitude: number, longitude: number) {
  return { type: "Point" as const, coordinates: [longitude, latitude] as [number, number] };
}

function toRouteGeometry(route: RouteRecord) {
  return {
    ...route,
    geometry: {
      type: "LineString" as const,
      coordinates: route.geometry.coordinates,
    },
  };
}

function updateLiveState() {
  const now = new Date().toISOString();

  state.kpi = {
    ...state.kpi,
    telemetryPingMs: 12 + Math.round(Math.random() * 8),
    networkMbps: Number((7.8 + Math.random() * 1.7).toFixed(1)),
    memoryPercent: Math.max(22, Math.min(58, state.kpi.memoryPercent + (Math.random() > 0.5 ? 1 : -1))),
    updatedAt: now,
  };

  state.fleetUnits = state.fleetUnits.map((unit, index) => {
    const headingDelta = index % 2 === 0 ? 1 : -1;
    const speedDrift = (Math.random() - 0.5) * 4;
    const latitudeDrift = (Math.random() - 0.5) * 0.002;
    const longitudeDrift = (Math.random() - 0.5) * 0.002;

    return {
      ...unit,
      latitude: Number((unit.latitude + latitudeDrift).toFixed(6)),
      longitude: Number((unit.longitude + longitudeDrift).toFixed(6)),
      speedKmh: Number(Math.max(0, unit.speedKmh + speedDrift).toFixed(1)),
      latencyMs: Math.max(8, unit.latencyMs + (Math.random() > 0.5 ? 1 : -1)),
      fuelPercent: Math.max(0, Math.min(100, unit.fuelPercent - (Math.random() > 0.9 ? 1 : 0))),
      headingDeg: (unit.headingDeg + headingDelta + 360) % 360,
      updatedAt: now,
    };
  });

  state.hazards = state.hazards.map((hazard) => ({
    ...hazard,
    status: hazard.status === "open" && Math.random() > 0.92 ? "isolated" : hazard.status,
    updatedAt: now,
  }));

  state.weatherStations = state.weatherStations.map((station, index) => {
    const updatedMetrics = station.metrics.map((metric) => {
      if (metric.label === "Temperature") {
        const base = Number(metric.value.replace(/[^0-9.-]/g, ""));
        return { ...metric, value: `${(base + (Math.random() - 0.5) * 0.4).toFixed(1)}°C` };
      }

      if (metric.label === "Wind Speed") {
        const base = Number(metric.value.replace(/[^0-9.-]/g, ""));
        return { ...metric, value: `${Math.max(0, Math.round(base + (Math.random() > 0.5 ? 1 : -1)))} km/h` };
      }

      if (metric.label === "Pressure") {
        const base = Number(metric.value.replace(/[^0-9.-]/g, ""));
        return { ...metric, value: `${Math.round(base + (index % 2 === 0 ? 1 : -1))} hPa` };
      }

      return metric;
    });

    return {
      ...station,
      metrics: updatedMetrics,
      updatedAt: now,
    };
  });

  state.notifications = [
    {
      id: `note-${Date.now()}`,
      title: "Telemetry refresh",
      description: "Live fleet and weather data were refreshed from the command service.",
      severity: "info",
      createdAt: now,
      readAt: null,
    },
    ...state.notifications,
  ].slice(0, 10);

  emitSnapshot();
}

function findHazard(id: string) {
  return state.hazards.find((hazard) => hazard.id === id);
}

function findFleetUnit(id: string) {
  return state.fleetUnits.find((unit) => unit.id === id);
}

function findReport(id: string) {
  return state.incidentReports.find((report) => report.id === id);
}

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "logistics-platform-backend" });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "logistics-platform-backend", timestamp: new Date().toISOString() });
});

app.get("/api/snapshot", (_req, res) => {
  res.json(toSnapshot());
});

app.get("/api/hazards", (_req, res) => {
  res.json(state.hazards);
});

app.get("/api/fleet", (_req, res) => {
  res.json(state.fleetUnits);
});

app.get("/api/routes", (_req, res) => {
  res.json(state.routes.map(toRouteGeometry));
});

app.get("/api/weather", (_req, res) => {
  res.json(state.weatherStations);
});

app.get("/api/reports", (_req, res) => {
  res.json(state.incidentReports);
});

app.post("/api/reports", (req, res) => {
  const { location, hazardType, severity, description, coordinates, reportedBy } = req.body;

  if (!location || !hazardType || !severity) {
    return res.status(400).json({ error: "Missing required fields: location, hazardType, severity" });
  }

  const reportIndex = state.incidentReports.length + 1;
  const now = new Date().toISOString();

  const newReport: IncidentReportRecord = {
    id: `inc-${Date.now()}`,
    reportId: `INC-2024-${String(reportIndex + 142).padStart(4, "0")}`,
    timestamp: now,
    location,
    hazardType,
    severity: severity as "Critical" | "High" | "Moderate" | "Low",
    status: "Open",
    updatedAt: now,
  };

  state.incidentReports = [newReport, ...state.incidentReports];

  state.notifications = [
    {
      id: `note-${Date.now()}`,
      title: `New incident report: ${hazardType}`,
      description: `${reportedBy ?? "Unknown"} filed a ${severity} ${hazardType} incident at ${location}.`,
      severity: severity === "Critical" ? "critical" : severity === "High" ? "warning" : "info",
      createdAt: now,
      readAt: null,
    },
    ...state.notifications,
  ].slice(0, 10);

  emitSnapshot();
  return res.status(201).json(newReport);
});

// --- Hazard Photo Upload ---
app.post("/api/uploads", upload.array("photos", 5), (req, res) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const uploaded = files.map((f) => ({
    filename: f.filename,
    originalName: f.originalname,
    size: f.size,
    url: `${baseUrl}/uploads/${f.filename}`,
  }));

  return res.status(201).json({ files: uploaded });
});

app.get("/api/notifications", (_req, res) => {
  res.json(state.notifications);
});

app.get("/api/kpis", (_req, res) => {
  res.json(state.kpi);
});

// --- User Profile Endpoints ---
app.get("/api/profile", (_req, res) => {
  res.json(state.profile);
});

app.patch("/api/profile", (req, res) => {
  const updates = req.body || {};
  const now = new Date().toISOString();

  state.profile = {
    ...state.profile,
    ...updates,
    preferences: {
      ...state.profile.preferences,
      ...(updates.preferences || {}),
    },
    updatedAt: now,
    lastActive: now,
  };

  emitSnapshot();
  return res.json(state.profile);
});

app.post("/api/profile/reset", (_req, res) => {
  state.profile = { ...seedProfile, updatedAt: new Date().toISOString() };
  emitSnapshot();
  return res.json(state.profile);
});

let lastGeminiResponse: any = null;
let lastGeminiCallTime = 0;
const GEMINI_CACHE_MS = 60000; // 60 seconds to respect daily quota limits

app.post("/api/routes/recommend", async (req, res) => {
  const { routes, hazards, weatherStations } = state;

  // --- Try OpenRouter AI first ---
  if (process.env.OPENROUTER_API_KEY) {
    const now = Date.now();
    if (lastGeminiResponse && now - lastGeminiCallTime < GEMINI_CACHE_MS) {
      // Return cached AI result to save API quota
      return res.json(lastGeminiResponse);
    }

    try {
      // eslint-disable-next-line no-console
      console.log("🧠 Calling OpenRouter AI for route analysis...");
      
      const evaluatedPromises = routes.map(async (route) => {
        const riskData = await evaluateRouteRisk(route, hazards, weatherStations);
        return {
          ...route,
          aiScore: riskData.aiScore,
          confidence: riskData.confidence,
          explanations: riskData.explanations
        };
      });

      const evaluated = await Promise.all(evaluatedPromises);
      evaluated.sort((a, b) => b.aiScore - a.aiScore);

      const aiResult = {
        recommendedRoute: evaluated[0],
        alternatives: evaluated.slice(1),
        generatedAt: new Date().toISOString(),
        poweredBy: "openrouter"
      };

      // eslint-disable-next-line no-console
      console.log(`✅ OpenRouter recommended: ${aiResult.recommendedRoute.name} (score: ${aiResult.recommendedRoute.aiScore})`);
      
      // Cache the result
      lastGeminiResponse = aiResult;
      lastGeminiCallTime = now;
      
      return res.json(aiResult);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console
      console.warn("⚠️ OpenRouter AI failed, falling back to heuristic:", message);
    }
  }

  // --- Heuristic fallback (if Gemini key is missing or call fails) ---
  const evaluatedRoutes = routes.map((route) => {
    let score = 100;
    const explanations: Array<{ factor: string; impact: string; detail: string }> = [];

    const baseDistance = 66.0;
    if (route.distanceKm > baseDistance) {
      const penalty = Math.round((route.distanceKm - baseDistance) * 0.8);
      score -= penalty;
      explanations.push({
        factor: "Distance Overhead",
        impact: `-${penalty}`,
        detail: `+${(route.distanceKm - baseDistance).toFixed(1)}km detour required`,
      });
    }

    const severeWeather = weatherStations.find(
      (w) =>
        w.conditionLabel.toLowerCase().includes("rising") ||
        w.conditionLabel.toLowerCase().includes("heavy") ||
        w.conditionLabel.toLowerCase().includes("blizzard"),
    );
    if (severeWeather && route.name.includes("Beta")) {
      score -= 25;
      explanations.push({
        factor: "Weather Risk",
        impact: "-25",
        detail: `High risk of localized flooding due to ${severeWeather.conditionLabel}`,
      });
    }

    const freezingStation = weatherStations.find(
      (w) =>
        w.conditionLabel.toLowerCase().includes("freez") ||
        w.conditionLabel.toLowerCase().includes("fog"),
    );
    if (freezingStation && route.name.includes("Beta")) {
      const visPenalty = 7;
      score -= visPenalty;
      explanations.push({
        factor: "Visibility / Black Ice",
        impact: `-${visPenalty}`,
        detail: `${freezingStation.conditionLabel} detected at ${freezingStation.name}`,
      });
    }

    const blockingHazard = hazards.find(
      (h) => h.severity === "critical" && route.name.includes("Primary"),
    );
    if (blockingHazard) {
      score -= 80;
      explanations.push({
        factor: "Critical Obstruction",
        impact: "-80",
        detail: `${blockingHazard.title} completely blocking transit`,
      });
    }

    const nearbyHazards = hazards.filter(
      (h) => h.severity === "high" && route.name.includes("Beta"),
    );
    if (nearbyHazards.length > 0) {
      const hazPenalty = nearbyHazards.length * 12;
      score -= hazPenalty;
      explanations.push({
        factor: "Hazard Proximity",
        impact: `-${hazPenalty}`,
        detail: `${nearbyHazards.length} high-severity hazard(s) along corridor`,
      });
    }

    if (explanations.length === 0) {
      explanations.push({
        factor: "Clear Corridor",
        impact: "+0",
        detail: "No active hazards or weather risks detected on this route",
      });
    }

    return {
      id: route.id,
      name: route.name,
      distanceKm: route.distanceKm,
      etaMinutes: route.etaMinutes,
      riskLabel: route.riskLabel,
      aiScore: Math.max(0, score),
      confidence: (Math.max(0, score) * 0.98).toFixed(1) + "%",
      explanations,
    };
  });

  evaluatedRoutes.sort((a, b) => b.aiScore - a.aiScore);

  res.json({
    recommendedRoute: evaluatedRoutes[0],
    alternatives: evaluatedRoutes.slice(1),
    generatedAt: new Date().toISOString(),
    poweredBy: "heuristic-fallback" as const,
  });
});

app.patch("/api/hazards/:id", (req, res) => {
  const hazard = findHazard(req.params.id);
  if (!hazard) {
    return res.status(404).json({ error: "Hazard not found" });
  }

  const updated: HazardRecord = {
    ...hazard,
    status: req.body?.status ?? hazard.status,
    radiusMeters: Number(req.body?.radiusMeters ?? hazard.radiusMeters),
    updatedAt: new Date().toISOString(),
    geometry: makeGeoPoint(hazard.latitude, hazard.longitude),
  };

  state.hazards = state.hazards.map((item) => (item.id === hazard.id ? updated : item));
  emitSnapshot();
  return res.json(updated);
});

app.patch("/api/fleet/:id", (req, res) => {
  const unit = findFleetUnit(req.params.id);
  if (!unit) {
    return res.status(404).json({ error: "Fleet unit not found" });
  }

  const updated: FleetUnitRecord = {
    ...unit,
    status: req.body?.status ?? unit.status,
    latitude: Number(req.body?.latitude ?? unit.latitude),
    longitude: Number(req.body?.longitude ?? unit.longitude),
    speedKmh: Number(req.body?.speedKmh ?? unit.speedKmh),
    latencyMs: Number(req.body?.latencyMs ?? unit.latencyMs),
    fuelPercent: Number(req.body?.fuelPercent ?? unit.fuelPercent),
    headingDeg: Number(req.body?.headingDeg ?? unit.headingDeg),
    updatedAt: new Date().toISOString(),
  };

  state.fleetUnits = state.fleetUnits.map((item) => (item.id === unit.id ? updated : item));
  emitSnapshot();
  return res.json(updated);
});

app.post("/api/fleet/:id/ping", (req, res) => {
  const unit = findFleetUnit(req.params.id);
  if (!unit) {
    return res.status(404).json({ error: "Fleet unit not found" });
  }

  const updated = {
    ...unit,
    latencyMs: Math.max(6, unit.latencyMs - 1),
    updatedAt: new Date().toISOString(),
  };

  state.fleetUnits = state.fleetUnits.map((item) => (item.id === unit.id ? updated : item));
  emitSnapshot();
  return res.json(updated);
});

app.patch("/api/reports/:id", (req, res) => {
  const report = findReport(req.params.id);
  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }

  const updated: IncidentReportRecord = {
    ...report,
    status: req.body?.status ?? report.status,
    updatedAt: new Date().toISOString(),
  };

  state.incidentReports = state.incidentReports.map((item) => (item.id === report.id ? updated : item));
  emitSnapshot();
  return res.json(updated);
});

app.post("/api/reports/:id/dispatch", (req, res) => {
  const report = findReport(req.params.id);
  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }

  const updated: IncidentReportRecord = {
    ...report,
    status: "Dispatched",
    updatedAt: new Date().toISOString(),
  };

  state.incidentReports = state.incidentReports.map((item) => (item.id === report.id ? updated : item));
  state.notifications = [
    {
      id: `note-${Date.now()}`,
      title: `Dispatch action executed for ${report.reportId}`,
      description: `The report was handed off to the field team from ${report.location}.`,
      severity: "info",
      createdAt: new Date().toISOString(),
      readAt: null,
    },
    ...state.notifications,
  ].slice(0, 10);
  emitSnapshot();
  return res.json(updated);
});

app.post("/api/notifications/:id/read", (req, res) => {
  const notification = state.notifications.find((item) => item.id === req.params.id);
  if (!notification) {
    return res.status(404).json({ error: "Notification not found" });
  }

  const updated = { ...notification, readAt: new Date().toISOString() };
  state.notifications = state.notifications.map((item) => (item.id === notification.id ? updated : item));
  emitSnapshot();
  return res.json(updated);
});

app.post("/api/telemetry/broadcast", (_req, res) => {
  updateLiveState();
  res.json({ ok: true });
});

io.on("connection", (socket) => {
  socket.emit("telemetry:update", toSnapshot());
});

setInterval(updateLiveState, 5000);

if (process.env.DATABASE_URL) {
  pool.query("SELECT NOW()", (err, res) => {
    if (err) {
      console.error("Database connection failed:", err.message);
    } else {
      // eslint-disable-next-line no-console
      console.log("Connected to PostgreSQL database at:", res.rows[0].now);
    }
  });
} else {
  console.warn("DATABASE_URL is not set; starting without a database connection.");
}

httpServer.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://${HOST}:${PORT}`);
});