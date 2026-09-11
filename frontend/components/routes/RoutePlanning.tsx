"use client";

import { useTelemetrySnapshot } from "@/lib/telemetry-store";

export default function RoutePlanning() {
  const { routes, backendConnected } = useTelemetrySnapshot();

  return (
    <section className="tab-fade-in">
      <div className="apple-glass rounded-3xl p-8 shadow-apple-card border border-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-apple-blue">
          Route Planning
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Live route scenarios.
        </h1>
        <p className="mt-3 text-sm text-slate-600 max-w-2xl">
          The planning surface now reflects the active corridor options and
          their latest ETA and delay estimates.
        </p>
        <p className={`mt-3 text-xs font-semibold uppercase tracking-[0.2em] ${backendConnected ? "text-apple-green" : "text-apple-orange"}`}>
          {backendConnected ? "Backend telemetry connected" : "Showing fallback telemetry"}
        </p>

        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          {routes.map((route) => (
            <div key={route.id} className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-sm font-semibold ${route.nameClassName}`}>{route.name}</p>
                  <p className="text-xs text-slate-500">{route.distanceKm}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${route.riskClassName}`}>
                  {route.riskLabel}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                <span>ETA</span>
                <span className={`font-semibold ${route.timeClassName}`}>{route.liveEta}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                <span>Delay</span>
                <span className="font-semibold text-slate-900">{route.liveDelay}</span>
              </div>
              <div className="mt-4 text-xs text-slate-500">Refreshed {route.liveUpdatedAt} UTC</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
