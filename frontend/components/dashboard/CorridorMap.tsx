"use client";

import { useRef, useState, type PointerEvent } from "react";
import {
  divIcon,
  type DivIcon,
  type LatLngExpression,
} from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip } from "react-leaflet";
import Icon from "../Icon";
import { MAP_LAYERS, HAZARDS as STATIC_HAZARDS } from "@/lib/data";
import { useTelemetrySnapshot } from "@/lib/telemetry-store";

/* ─── Sector-07 center: 27.3°N, 88.6°E ─── */
const DEFAULT_CENTER: LatLngExpression = [27.3, 88.6];
const DEFAULT_ZOOM = 10;

type LayerId = "hazards" | "fleet" | "routes";

/* ────────────────────────────────────────────
   Hazard severity → colors & material icon
   ──────────────────────────────────────────── */
const HAZARD_STYLES: Record<
  string,
  { bg: string; pulse: string; ring: string; icon: string }
> = {
  "hz-nh29": {
    bg: "background:linear-gradient(135deg,#ff3b30,#d62d20)",
    pulse: "#ff3b30",
    ring: "border-color:#ff3b30",
    icon: "landslide",
  },
  "hz-kali": {
    bg: "background:linear-gradient(135deg,#ff9500,#e08600)",
    pulse: "#ff9500",
    ring: "border-color:#ff9500",
    icon: "flood",
  },
  "hz-sela": {
    bg: "background:linear-gradient(135deg,#007aff,#005ecb)",
    pulse: "#007aff",
    ring: "border-color:#007aff",
    icon: "severe_cold",
  },
  "hz-teesta": {
    bg: "background:linear-gradient(135deg,#64748b,#475569)",
    pulse: "#64748b",
    ring: "border-color:#64748b",
    icon: "warning",
  },
};

/* ────────────────────────────────────────────
   Fleet unit → colors & material icon
   ──────────────────────────────────────────── */
const FLEET_STYLES: Record<
  string,
  { bg: string; pulse: string; ring: string; icon: string }
> = {
  "alpha-01": {
    bg: "background:linear-gradient(135deg,#007aff,#005ecb)",
    pulse: "#007aff",
    ring: "border-color:#007aff",
    icon: "navigation",
  },
  "bravo-04": {
    bg: "background:linear-gradient(135deg,#34c759,#28a745)",
    pulse: "#34c759",
    ring: "border-color:#34c759",
    icon: "local_shipping",
  },
  "charlie-09": {
    bg: "background:linear-gradient(135deg,#ff9500,#e08600)",
    pulse: "#ff9500",
    ring: "border-color:#ff9500",
    icon: "near_me",
  },
  "delta-12": {
    bg: "background:linear-gradient(135deg,#af52de,#9b37cc)",
    pulse: "#af52de",
    ring: "border-color:#af52de",
    icon: "local_hospital",
  },
};

/* ────────────────────────────────────────────
   Pulsing custom HTML DivIcon builder
   ──────────────────────────────────────────── */
function createPulsingPin(
  kind: "hazard" | "fleet",
  id: string,
  label: string,
): DivIcon {
  const styles =
    kind === "hazard"
      ? HAZARD_STYLES[id] ?? HAZARD_STYLES["hz-teesta"]!
      : FLEET_STYLES[id] ?? FLEET_STYLES["alpha-01"]!;

  const pulseColor = styles.pulse;
  const kindLabel = kind === "hazard" ? "HAZARD" : "FLEET";

  return divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;user-select:none;position:relative">
        <!-- Outer pulse ring -->
        <div style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:52px;height:52px;border-radius:16px;${styles.bg};opacity:0.18;animation:corridorPulse 2s ease-in-out infinite"></div>

        <!-- Card body -->
        <div style="
          display:flex;align-items:center;gap:8px;
          padding:8px 12px;
          border-radius:16px;
          background:linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,255,255,0.82));
          backdrop-filter:blur(24px) saturate(180%);
          -webkit-backdrop-filter:blur(24px) saturate(180%);
          border:1.5px solid rgba(255,255,255,0.9);
          box-shadow:0 12px 32px rgba(15,23,42,0.14),0 2px 6px rgba(15,23,42,0.06);
          position:relative;z-index:2;
        ">
          <!-- Icon badge -->
          <span style="
            display:flex;align-items:center;justify-content:center;
            width:32px;height:32px;border-radius:12px;
            ${styles.bg};
            color:#fff;
            box-shadow:0 4px 14px ${pulseColor}55;
          ">
            <span class="material-symbols-outlined" style="font-size:17px;line-height:1">${styles.icon}</span>
          </span>

          <!-- Text -->
          <div style="text-align:left">
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#94a3b8">${kindLabel}</div>
            <div style="font-size:11px;font-weight:700;color:#0f172a;white-space:nowrap">${label}</div>
          </div>
        </div>

        <!-- Stem -->
        <div style="width:2px;height:14px;background:#cbd5e1;position:relative;z-index:1"></div>

        <!-- Dot with pulse -->
        <div style="position:relative">
          <div style="
            position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
            width:20px;height:20px;border-radius:50%;
            background:${pulseColor};opacity:0.3;
            animation:corridorDotPulse 1.5s ease-in-out infinite;
          "></div>
          <div style="
            width:12px;height:12px;border-radius:50%;
            ${styles.bg};
            border:2.5px solid #fff;
            box-shadow:0 2px 8px ${pulseColor}44;
            position:relative;z-index:2;
          "></div>
        </div>
      </div>
    `,
    iconSize: [120, 86],
    iconAnchor: [60, 82],
    popupAnchor: [0, -74],
  });
}

/* ────────────────────────────────────────────
   Static Teesta Gorge data (not in backend seed)
   ──────────────────────────────────────────── */
const TEESTA_GORGE = {
  id: "hz-teesta",
  latitude: 27.1367,
  longitude: 88.475,
  title: "Teesta Gorge Rockfall",
};

/* ────────────────────────────────────────────
   Route polyline styling
   ──────────────────────────────────────────── */
function routePathOptions(routeId: string) {
  if (routeId === "route-a") {
    // Primary Route A → dashed red / blocked
    return {
      color: "#ff3b30",
      weight: 5,
      opacity: 0.85,
      dashArray: "8 10",
      lineCap: "round" as const,
      lineJoin: "round" as const,
    };
  }
  if (routeId === "detour-alpha-7") {
    // Detour Alpha-7 → glowing apple-blue / optimal
    return {
      color: "#007aff",
      weight: 5,
      opacity: 0.95,
      dashArray: undefined,
      lineCap: "round" as const,
      lineJoin: "round" as const,
      className: "route-glow-blue",
    };
  }
  // Corridor Beta → orange / river risk
  return {
    color: "#ff9500",
    weight: 4,
    opacity: 0.85,
    dashArray: "12 6",
    lineCap: "round" as const,
    lineJoin: "round" as const,
  };
}

function routeTooltipLabel(routeId: string) {
  if (routeId === "route-a") return "⛔ Route A — BLOCKED";
  if (routeId === "detour-alpha-7") return "✅ Detour Alpha-7 — OPTIMAL";
  return "⚠️ Corridor Beta — FLOOD RISK";
}

/* ────────────────────────────────────────────
   CorridorMap component
   ──────────────────────────────────────────── */
export default function CorridorMap() {
  const { hazards, fleetUnits, routes } = useTelemetrySnapshot();
  const mapRef = useRef<HTMLDivElement>(null);
  const layerPanelRef = useRef<HTMLDivElement>(null);
  const [layersVisible, setLayersVisible] = useState<Record<LayerId, boolean>>({
    hazards: true,
    fleet: true,
    routes: true,
  });
  const [layerPanelPosition, setLayerPanelPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingLayers, setIsDraggingLayers] = useState(false);

  function handleLayerPanelPointerDown(event: PointerEvent<HTMLDivElement>) {
    const map = mapRef.current;
    const panel = layerPanelRef.current;
    if (!map || !panel) return;

    const mapBounds = map.getBoundingClientRect();
    const panelBounds = panel.getBoundingClientRect();
    const offsetX = event.clientX - panelBounds.left;
    const offsetY = event.clientY - panelBounds.top;

    setIsDraggingLayers(true);
    event.currentTarget.setPointerCapture(event.pointerId);

    function movePanel(moveEvent: globalThis.PointerEvent) {
      const maxX = mapBounds.width - panelBounds.width;
      const maxY = mapBounds.height - panelBounds.height;
      const x = Math.min(maxX, Math.max(0, moveEvent.clientX - mapBounds.left - offsetX));
      const y = Math.min(maxY, Math.max(0, moveEvent.clientY - mapBounds.top - offsetY));
      setLayerPanelPosition({ x, y });
    }

    function stopMoving() {
      setIsDraggingLayers(false);
      window.removeEventListener("pointermove", movePanel);
      window.removeEventListener("pointerup", stopMoving);
    }

    window.addEventListener("pointermove", movePanel);
    window.addEventListener("pointerup", stopMoving, { once: true });
  }

  /* ─── Build the merged hazard list (backend + Teesta if missing) ─── */
  const allHazards = hazards.some((h) => h.id === "hz-teesta")
    ? hazards
    : [
        ...hazards,
        {
          ...STATIC_HAZARDS.find((h) => h.id === "hz-teesta")!,
          ...TEESTA_GORGE,
          status: "monitoring" as const,
          corridorName: "Teesta Gorge",
          coords: "27°08'12\"N 88°28'30\"E",
          radiusMeters: 600,
          description: "Loose gravel and periodic rock slides triggered by continuous precipitation.",
          geometry: { type: "Point" as const, coordinates: [88.475, 27.1367] as [number, number] },
          updatedAt: new Date().toISOString(),
          severityLabel: "Moderate Severity",
          severityClassName: "text-slate-600 bg-slate-100 border-slate-100",
          quarantineClassName: "bg-slate-100 hover:bg-slate-200 text-slate-800 border-transparent",
          icon: "warning",
          iconClassName: "text-slate-600",
          liveRiskIndex: 52,
          liveUpdatedAt: new Date().toISOString(),
          severity: "moderate" as const,
        },
      ];

  return (
    <div
      ref={mapRef}
      className="relative h-[560px] w-full overflow-hidden rounded-3xl border border-white shadow-apple-card"
    >
      {/* Pulse keyframes injected once */}
      <style>{`
        @keyframes corridorPulse {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.18; }
          50% { transform: translateX(-50%) scale(1.25); opacity: 0.08; }
        }
        @keyframes corridorDotPulse {
          0%, 100% { transform: translate(-50%,-50%) scale(1); opacity: 0.3; }
          50% { transform: translate(-50%,-50%) scale(1.8); opacity: 0.05; }
        }
        .route-glow-blue {
          filter: drop-shadow(0 0 8px rgba(0,122,255,0.55));
        }
        .dark-map .leaflet-tile-pane {
          filter: invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9);
        }
        .dark-map .leaflet-marker-pane,
        .dark-map .leaflet-shadow-pane,
        .dark-map .leaflet-tooltip-pane,
        .dark-map .leaflet-popup-pane,
        .dark-map .leaflet-overlay-pane svg {
          filter: none !important;
        }
      `}</style>

      <MapContainer
        center={DEFAULT_CENTER}
        className="h-full w-full"
        scrollWheelZoom={false}
        zoom={DEFAULT_ZOOM}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* ── Route polylines ── */}
        {layersVisible.routes &&
          routes.map((route) => {
            const opts = routePathOptions(route.id);
            return (
              <Polyline
                key={route.id}
                pathOptions={opts}
                positions={route.geometry.coordinates.map(
                  ([longitude, latitude]) => [latitude, longitude] as [number, number],
                )}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -6]}
                  opacity={1}
                  permanent
                  className="!rounded-xl !border-none !bg-white/95 !px-3 !py-1.5 !text-[11px] !font-bold !text-slate-800 !shadow-popover !backdrop-blur-sm"
                >
                  {routeTooltipLabel(route.id)}
                </Tooltip>
              </Polyline>
            );
          })}

        {/* ── Route A glow underlay ── */}
        {layersVisible.routes &&
          routes
            .filter((r) => r.id === "detour-alpha-7")
            .map((route) => (
              <Polyline
                key={`${route.id}-glow`}
                pathOptions={{
                  color: "#007aff",
                  weight: 14,
                  opacity: 0.15,
                  lineCap: "round",
                  lineJoin: "round",
                }}
                positions={route.geometry.coordinates.map(
                  ([longitude, latitude]) => [latitude, longitude] as [number, number],
                )}
              />
            ))}

        {/* ── Hazard markers (4 canonical) ── */}
        {layersVisible.hazards &&
          allHazards.map((hazard) => (
            <Marker
              key={hazard.id}
              icon={createPulsingPin("hazard", hazard.id, hazard.title)}
              position={[hazard.latitude, hazard.longitude]}
            />
          ))}

        {/* ── Fleet markers (4 units) ── */}
        {layersVisible.fleet &&
          fleetUnits.map((unit) => (
            <Marker
              key={unit.id}
              icon={createPulsingPin("fleet", unit.id, unit.callsign)}
              position={[unit.latitude, unit.longitude]}
            />
          ))}
      </MapContainer>

      {/* ── Draggable layer panel ── */}
      <div
        ref={layerPanelRef}
        className={`${layerPanelPosition ? "absolute left-0 top-0" : "absolute bottom-4 right-4"} apple-glass z-[1000] w-40 rounded-2xl border border-white/75 p-2 shadow-[0_14px_35px_rgba(15,23,42,0.16),0_2px_8px_rgba(15,23,42,0.08)] backdrop-blur-xl`}
        style={layerPanelPosition ? { left: layerPanelPosition.x, top: layerPanelPosition.y } : undefined}
      >
        <div
          className={`flex touch-none cursor-move items-center justify-between border-b border-slate-100 pb-1.5 text-[10px] font-semibold text-slate-800 ${isDraggingLayers ? "cursor-grabbing" : ""}`}
          onPointerDown={handleLayerPanelPointerDown}
          title="Drag layers panel"
        >
          <span className="flex items-center gap-1.5">
            <Icon name="layers" className="text-apple-blue text-xs" /> Layers
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-apple-green animate-pulse" />
            <span className="text-[9px] font-bold text-apple-green">Live</span>
          </span>
        </div>
        <div className="mt-1.5 space-y-0.5 text-[10px]">
          {MAP_LAYERS.map((layer) => {
            const id = layer.id as LayerId;
            const active = layersVisible[id];
            return (
              <button
                key={layer.id}
                className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 font-medium transition-colors ${
                  active ? "bg-slate-100 text-slate-900" : "bg-slate-50 text-slate-400"
                }`}
                onClick={() =>
                  setLayersVisible((prev) => ({ ...prev, [id]: !prev[id] }))
                }
              >
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${layer.dotClassName}`} />
                  {layer.label}
                </span>
                <span className="text-[8px] uppercase tracking-wider">
                  {active ? "On" : "Off"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Sector badge ── */}
      <div className="absolute right-4 top-4 z-[1000] flex items-center gap-2 rounded-2xl border border-white/90 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-popover backdrop-blur">
        <span className="h-2 w-2 rounded-full bg-apple-blue animate-pulse" />
        Sector 07 • Light Map
      </div>

      {/* ── Status bar ── */}
      <div className="absolute bottom-4 left-4 z-[1000] flex items-center gap-3 rounded-2xl border border-white/90 bg-white/90 px-4 py-2 text-[11px] font-semibold text-slate-600 shadow-popover backdrop-blur">
        <span className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${layersVisible.hazards ? "bg-apple-red" : "bg-slate-300"}`} />
          Hazards
        </span>
        <span className="text-slate-300">·</span>
        <span className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${layersVisible.fleet ? "bg-apple-blue" : "bg-slate-300"}`} />
          Fleet
        </span>
        <span className="text-slate-300">·</span>
        <span className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${layersVisible.routes ? "bg-apple-green" : "bg-slate-300"}`} />
          Routes
        </span>
      </div>
    </div>
  );
}
