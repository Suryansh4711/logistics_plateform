"use client";

import { useTelemetrySnapshot } from "@/lib/telemetry-store";

export default function WeatherIntel() {
  const { weatherStations: stations, backendConnected } = useTelemetrySnapshot();

  return (
    <section className="tab-fade-in">
      <div className="apple-glass rounded-3xl p-8 shadow-apple-card border border-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-apple-blue">
          Weather Intel
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Live weather station feed.
        </h1>
        <p className="mt-3 text-sm text-slate-600 max-w-2xl">
          Station conditions update from the shared telemetry layer so the
          corridor dashboard stays synchronized with the latest weather.
        </p>
        <p className={`mt-3 text-xs font-semibold uppercase tracking-[0.2em] ${backendConnected ? "text-apple-green" : "text-apple-orange"}`}>
          {backendConnected ? "Backend telemetry connected" : "Showing fallback telemetry"}
        </p>

        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          {stations.map((station) => (
            <div key={station.id} className="apple-glass-card rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{station.name}</p>
                  <p className="text-xs text-slate-500">{station.conditionLabel}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${station.conditionClassName}`}>
                  Live
                </span>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                {station.metrics.map((metric) => (
                  <div key={metric.label} className="flex justify-between text-slate-600">
                    <span>{metric.label}</span>
                    <span className={`font-semibold ${metric.valueClassName}`}>{metric.value}</span>
                  </div>
                ))}
              </div>
              <div className={`mt-4 rounded-2xl px-3 py-2 text-xs ${station.advisoryClassName}`}>
                {station.advisory}
              </div>
              <div className="mt-3 text-xs text-slate-500">Updated {station.liveUpdatedAt} UTC</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
