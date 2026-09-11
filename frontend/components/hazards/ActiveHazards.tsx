"use client";

import { useTelemetrySnapshot } from "@/lib/telemetry-store";

export default function ActiveHazards() {
  const { hazards, backendConnected } = useTelemetrySnapshot();

  return (
    <section className="tab-fade-in">
      <div className="apple-glass rounded-3xl p-8 shadow-apple-card border border-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-apple-blue">
          Active Hazards
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Live corridor risk feed.
        </h1>
        <p className="mt-3 text-sm text-slate-600 max-w-2xl">
          Hazard positions, severity bands, and quarantine status refresh from
          the shared corridor data on every tick.
        </p>
        <p className={`mt-3 text-xs font-semibold uppercase tracking-[0.2em] ${backendConnected ? "text-apple-green" : "text-apple-orange"}`}>
          {backendConnected ? "Backend telemetry connected" : "Showing fallback telemetry"}
        </p>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {hazards.map((hazard) => (
            <div key={hazard.id} className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${hazard.severityClassName}`}>
                    {hazard.severityLabel}
                  </p>
                  <h2 className="mt-3 text-lg font-semibold text-slate-900">{hazard.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{hazard.corridorName}</p>
                </div>
                <span className={`rounded-xl border px-3 py-1.5 text-sm font-semibold ${hazard.quarantineClassName}`}>
                  Risk {hazard.liveRiskIndex}/100
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-600">{hazard.description}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>{hazard.coords}</span>
                <span>Updated {hazard.liveUpdatedAt} UTC</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
