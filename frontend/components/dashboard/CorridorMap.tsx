"use client";

import { useRef, useState, type PointerEvent } from "react";
import {
  divIcon,
  type DivIcon,
  type LatLngExpression,
} from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip } from "react-leaflet";
import Icon from "../Icon";
import { MAP_LAYERS } from "@/lib/data";
import { useTelemetrySnapshot } from "@/lib/telemetry-store";

const DEFAULT_CENTER: LatLngExpression = [27.29, 88.58];
const DEFAULT_ZOOM = 10;

type LayerId = "hazards" | "fleet" | "routes";

function createPinIcon(kind: "hazard" | "fleet", label: string, iconName: string, tone: string): DivIcon {
  return divIcon({
    className: "",
    html: `
      <div class="flex flex-col items-center select-none">
        <div class="apple-glass-strong flex items-center gap-2 rounded-2xl border border-white/90 px-3 py-2 shadow-popover">
          <span class="flex h-8 w-8 items-center justify-center rounded-xl ${tone} text-white shadow-apple-glow">
            <span class="material-symbols-outlined select-none text-[18px] leading-none">${iconName}</span>
          </span>
          <div class="text-left">
            <div class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">${kind}</div>
            <div class="text-xs font-bold text-slate-900">${label}</div>
          </div>
        </div>
        <div class="h-4 w-0.5 bg-slate-300"></div>
        <div class="h-3 w-3 rounded-full ${tone} border-2 border-white shadow-md"></div>
      </div>
    `,
    iconSize: [96, 72],
    iconAnchor: [48, 68],
    popupAnchor: [0, -60],
  });
}

function routeColor(routeId: string) {
  if (routeId === "detour-alpha-7") return "#007aff";
  if (routeId === "route-a") return "#ff3b30";
  return "#ff9500";
}

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

  return (
    <div ref={mapRef} className="relative h-[560px] w-full overflow-hidden rounded-3xl border border-white shadow-apple-card">
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

        {layersVisible.routes &&
          routes.map((route) => (
            <Polyline
              key={route.id}
              pathOptions={{
                color: routeColor(route.id),
                weight: route.id === "route-a" ? 5 : 4,
                opacity: 0.9,
                dashArray: route.id === "route-a" ? "6 8" : undefined,
              }}
              positions={route.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude] as [number, number])}
            >
              <Tooltip direction="top" opacity={1} permanent>
                {route.name}
              </Tooltip>
            </Polyline>
          ))}

        {layersVisible.hazards &&
          hazards.map((hazard) => (
            <Marker
              key={hazard.id}
              icon={createPinIcon("hazard", hazard.title, hazard.icon, "bg-apple-red")}
              position={[hazard.latitude, hazard.longitude]}
            >
              <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent>
                {hazard.title}
              </Tooltip>
            </Marker>
          ))}

        {layersVisible.fleet &&
          fleetUnits.map((pin) => (
            <Marker
              key={pin.id}
              icon={createPinIcon(
                "fleet",
                pin.callsign,
                pin.role.toLowerCase().includes("lead") ? "navigation" : "near_me",
                pin.role.toLowerCase().includes("lead") ? "bg-apple-blue" : "bg-apple-green",
              )}
              position={[pin.latitude, pin.longitude]}
            >
              <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent>
                {pin.callsign}
              </Tooltip>
            </Marker>
          ))}
      </MapContainer>

      <div
        ref={layerPanelRef}
        className={`${layerPanelPosition ? "absolute left-0 top-0" : "absolute bottom-4 right-4"} apple-glass z-[1000] w-36 rounded-2xl border border-white/75 p-1.5 shadow-[0_14px_35px_rgba(15,23,42,0.16),0_2px_8px_rgba(15,23,42,0.08)] backdrop-blur-xl`}
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
          <span className="text-[9px] font-bold text-apple-blue">Live</span>
        </div>
        <div className="mt-1 space-y-0.5 text-[10px]">
          {MAP_LAYERS.map((layer) => {
            const id = layer.id as LayerId;
            const active = layersVisible[id];
            return (
              <button
                key={layer.id}
                className={`flex w-full items-center justify-between rounded-md px-1.5 py-1 font-medium transition-colors ${
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

      <div className="absolute right-4 top-4 z-[1000] rounded-2xl border border-white/90 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-popover backdrop-blur">
        OSM Base Map
      </div>

      <div className="absolute bottom-4 left-4 z-[1000] rounded-2xl border border-white/90 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-700 shadow-popover backdrop-blur">
        Hazards: {layersVisible.hazards ? "On" : "Off"} · Fleet: {layersVisible.fleet ? "On" : "Off"} · Routes: {layersVisible.routes ? "On" : "Off"}
      </div>
    </div>
  );
}
