"use client";

import { useEffect, useState } from "react";
import MapWidget from "./MapWidget";
import type { TabId } from "@/lib/types";
import { useTelemetrySnapshot } from "@/lib/telemetry-store";
import { fetchSnapshot, socket } from "@/lib/api";

interface CommandDashboardProps {
  onNavigate: (tab: TabId) => void;
}

interface AiExplanation {
  factor: string;
  impact: string;
  detail: string;
}

interface AiRoute {
  id: string;
  name: string;
  distanceKm: number;
  etaMinutes: number;
  riskLabel: string;
  aiScore: number;
  confidence: string;
  explanations: AiExplanation[];
}

export default function CommandDashboard({ onNavigate }: CommandDashboardProps) {
  const snapshot = useTelemetrySnapshot();
  const [liveData, setLiveData] = useState<any>(null);
  const [aiRecommendation, setAiRecommendation] = useState<AiRoute | null>(null);
  const [aiEngine, setAiEngine] = useState<string>("");

  useEffect(() => {
    // 1. Grab initial state immediately
    fetchSnapshot().then(setLiveData).catch(console.error);

    // 2. Listen for the real-time drift simulation
    socket.on("telemetry:update", (data) => {
      setLiveData(data);
    });

    return () => {
      socket.off("telemetry:update");
    };
  }, []);

  // Re-run the AI scoring whenever telemetry updates
  useEffect(() => {
    if (!liveData) return;

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
    fetch(`${backendUrl}/api/routes/recommend`, { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        setAiRecommendation(data.recommendedRoute);
        setAiEngine(data.poweredBy || "heuristic-fallback");
      })
      .catch(console.error);
  }, [liveData]);

  if (!liveData) {
    return (
      <div className="p-8 text-apple-blue animate-pulse text-lg font-semibold">
        Establishing Sat-Link to Sector 07...
      </div>
    );
  }

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
          {/* AI Logistics Intelligence Card */}
          {aiRecommendation && (
            <div className="apple-glass rounded-3xl p-6 shadow-apple-card border border-emerald-200/50 overflow-hidden relative">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-apple-green via-apple-blue to-apple-purple" />
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-apple-green text-white shadow-sm">
                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                </span>
                <p className="text-xs font-semibold uppercase tracking-wider text-apple-green">
                  AI Logistics Intelligence
                </p>
                <span className={`ml-auto text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full ${aiEngine === "gemini" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                  {aiEngine === "gemini" ? "🧠 Gemini AI" : "⚙️ Heuristic"}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-1">
                AI Optimal Route: {aiRecommendation.name}
              </h3>

              <div className="flex items-center gap-4 mb-5">
                <span className="text-3xl font-bold text-apple-green">
                  {aiRecommendation.aiScore}<span className="text-lg text-slate-400">/100</span>
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-500">
                    Confidence: {aiRecommendation.confidence}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {aiRecommendation.distanceKm} km · {aiRecommendation.riskLabel}
                  </span>
                </div>
              </div>

              {/* Score bar */}
              <div className="mb-5 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-apple-green to-apple-blue transition-all duration-700"
                  style={{ width: `${aiRecommendation.aiScore}%` }}
                />
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
                  XAI Decision Breakdown
                </p>
                {aiRecommendation.explanations.map((exp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl bg-slate-900/90 px-3 py-2.5 backdrop-blur-sm"
                  >
                    <span className="text-sm font-medium text-white">{exp.factor}</span>
                    <div className="flex items-center gap-3 text-right">
                      <span className={`text-sm font-bold ${exp.impact.startsWith("-") ? "text-apple-red" : "text-apple-green"}`}>
                        {exp.impact}
                      </span>
                      <span className="text-[11px] text-slate-400 max-w-[180px] text-right leading-tight">
                        {exp.detail}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* Live data stream verification panel */}
          <div className="apple-glass rounded-3xl p-6 shadow-apple-card border border-white">
            <p className="text-xs font-semibold uppercase tracking-wider text-apple-green">
              Live Data Stream ✓
            </p>
            <pre className="mt-3 max-h-48 overflow-auto text-xs text-green-400 bg-black/90 p-4 rounded-2xl font-mono">
              {JSON.stringify(liveData.kpi, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}


