"use client";

import MapWidget from "./MapWidget";
import type { TabId } from "@/lib/types";
import { useTelemetrySnapshot } from "@/lib/telemetry-store";

interface CommandDashboardProps {
  onNavigate: (tab: TabId) => void;
}

export default function CommandDashboard({ onNavigate }: CommandDashboardProps) {
  const snapshot = useTelemetrySnapshot();

  return (
    <section className="tab-fade-in">
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="apple-glass rounded-3xl p-8 shadow-apple-card border border-white overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-apple-blue via-apple-green to-apple-orange" />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-apple-blue">
                Command Dashboard
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                Live convoy operations are now online.
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-600">
                Current signals are pulled from the backend snapshot, with
                fleet, hazard, weather, and route status refreshing in real
                time.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-right shadow-sm">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Last sync
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {snapshot.utcTime} UTC
              </div>
              <div className="text-xs text-slate-500">{snapshot.localTime}</div>
              <div className={`mt-2 text-[10px] font-bold uppercase tracking-[0.2em] ${snapshot.backendConnected ? "text-apple-green" : "text-apple-orange"}`}>
                {snapshot.backendConnected ? "Backend online" : "Fallback mode"}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Fleet units",
                value: snapshot.fleetCount,
                hint: "Tracked live",
                tone: "text-apple-blue",
              },
              {
                label: "Active hazards",
                value: snapshot.hazardCount,
                hint: "Under watch",
                tone: "text-apple-red",
              },
              {
                label: "Route options",
                value: snapshot.routeCount,
                hint: "Available now",
                tone: "text-apple-green",
              },
              {
                label: "Telemetry ping",
                value: `${snapshot.pingMs} ms`,
                hint: snapshot.throughput,
                tone: "text-apple-orange",
              },
            ].map((card) => (
              <div
                key={card.label}
                className="apple-glass-card rounded-2xl p-4"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {card.label}
                </div>
                <div className={`mt-2 text-2xl font-bold ${card.tone}`}>
                  {card.value}
                </div>
                <div className="mt-1 text-xs text-slate-500">{card.hint}</div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <MapWidget />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <button
              className="rounded-2xl bg-apple-blue px-4 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px]"
              onClick={() => onNavigate("hazards")}
            >
              Open hazards feed
            </button>
            <button
              className="rounded-2xl bg-white/80 px-4 py-3 text-sm font-semibold text-slate-800 border border-slate-200 transition hover:bg-white"
              onClick={() => onNavigate("fleet")}
            >
              Review convoy telemetry
            </button>
            <button
              className="rounded-2xl bg-white/80 px-4 py-3 text-sm font-semibold text-slate-800 border border-slate-200 transition hover:bg-white"
              onClick={() => onNavigate("routes")}
            >
              Compare live routes
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="apple-glass rounded-3xl p-6 shadow-apple-card border border-white">
            <p className="text-xs font-semibold uppercase tracking-wider text-apple-blue">
              Live readout
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3">
                <span className="text-slate-500">Lead convoy</span>
                <span className="font-semibold text-slate-900">
                  {snapshot.leadUnit.callsign}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3">
                <span className="text-slate-500">Critical hazard</span>
                <span className="font-semibold text-slate-900">
                  {snapshot.leadHazard.title}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3">
                <span className="text-slate-500">Primary route</span>
                <span className="font-semibold text-slate-900">
                  {snapshot.primaryRoute.name}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3">
                <span className="text-slate-500">Latest incident</span>
                <span className="font-semibold text-slate-900">
                  {snapshot.latestIncident?.reportId ?? "No open report"}
                </span>
              </div>
            </div>
          </div>

          <div className="apple-glass rounded-3xl p-6 shadow-apple-card border border-white">
            <p className="text-xs font-semibold uppercase tracking-wider text-apple-blue">
              Active systems
            </p>
            <div className="mt-4 space-y-3 text-sm">
              {[
                ["Fleet telemetry", `${snapshot.fleetCount} live units`],
                ["Weather feed", `${snapshot.weatherCount} stations`],
                ["Route engine", `${snapshot.routeCount} route options`],
                ["Telemetry health", `Memory ${snapshot.memory}%`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-semibold text-slate-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
