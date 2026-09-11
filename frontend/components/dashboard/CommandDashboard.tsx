"use client";

import type { TabId } from "@/lib/types";

interface CommandDashboardProps {
  onNavigate: (tab: TabId) => void;
}

export default function CommandDashboard({ onNavigate }: CommandDashboardProps) {
  return (
    <section className="tab-fade-in">
      <div className="apple-glass rounded-3xl p-8 shadow-apple-card border border-white max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-apple-blue">
          Command Dashboard
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Live dashboard widgets removed
        </h1>
        <p className="mt-3 text-sm text-slate-600 max-w-2xl">
          The placeholder analytics, incident cards, and simulated map have been
          cleared out. Add the real operational widgets when you are ready.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="rounded-xl bg-apple-blue px-4 py-2 text-sm font-semibold text-white"
            onClick={() => onNavigate("hazards")}
          >
            Open Hazards
          </button>
        </div>
      </div>
    </section>
  );
}
