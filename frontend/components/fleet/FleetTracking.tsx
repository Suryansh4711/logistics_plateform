"use client";

import { useTelemetrySnapshot } from "@/lib/telemetry-store";

export default function FleetTracking() {
  const { fleetUnits: units, backendConnected } = useTelemetrySnapshot();

  return (
    <section className="tab-fade-in">
      <div className="apple-glass rounded-3xl p-8 shadow-apple-card border border-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-apple-blue">
          Fleet Tracking
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Live unit telemetry.
        </h1>
        <p className="mt-3 text-sm text-slate-600 max-w-2xl">
          Speed, latency, and fuel status are derived from the active convoy
          feed and update continuously.
        </p>
        <p className={`mt-3 text-xs font-semibold uppercase tracking-[0.2em] ${backendConnected ? "text-apple-green" : "text-apple-orange"}`}>
          {backendConnected ? "Backend telemetry connected" : "Showing fallback telemetry"}
        </p>

        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          {units.map((unit) => (
            <div key={unit.id} className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{unit.callsign}</p>
                  <p className="text-xs text-slate-500">{unit.role}</p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${unit.statusClassName}`}>
                  {unit.status}
                </span>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Speed</span>
                  <span className="font-semibold text-slate-900">{unit.liveSpeedKmh}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Latency</span>
                  <span className="font-semibold text-slate-900">{unit.liveLatencyMs}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Fuel</span>
                  <span className="font-semibold text-slate-900">{unit.liveFuelPercent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${unit.fuelBarClassName}`} style={{ width: `${unit.liveFuelPercent}%` }} />
                </div>
              </div>
              <div className="mt-4 text-xs text-slate-500">
                Position updated {unit.liveUpdatedAt} UTC
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
