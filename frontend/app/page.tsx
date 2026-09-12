"use client";

import { useState, type ReactNode } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { ToastProvider } from "@/components/toast/ToastProvider";
import CommandDashboard from "@/components/dashboard/CommandDashboard";
import ActiveHazards from "@/components/hazards/ActiveHazards";
import FleetTracking from "@/components/fleet/FleetTracking";
import RoutePlanning from "@/components/routes/RoutePlanning";
import WeatherIntel from "@/components/weather/WeatherIntel";
import IncidentReports from "@/components/reports/IncidentReports";
import type { TabId } from "@/lib/types";

const TAB_VIEWS: Record<TabId, (onNavigate: (tab: TabId) => void) => ReactNode> = {
  dashboard: (onNavigate) => <CommandDashboard onNavigate={onNavigate} />,
  hazards: () => <ActiveHazards />,
  fleet: () => <FleetTracking />,
  routes: () => <RoutePlanning />,
  weather: () => <WeatherIntel />,
  reports: () => <IncidentReports />,
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [sidebarCompact, setSidebarCompact] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen relative">
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-32 left-1/4 w-[540px] h-[540px] bg-blue-100/45 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-32 w-[580px] h-[580px] bg-indigo-50/45 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,122,255,0.06),transparent_30%),radial-gradient(circle_at_top_right,rgba(52,199,89,0.06),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(175,82,222,0.045),transparent_24%)]" />
        </div>

        <Header onNavigate={setActiveTab} />
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          compact={sidebarCompact}
          onToggleCompact={() => setSidebarCompact((prev) => !prev)}
        />

        <div
          className={`pt-16 min-h-screen relative z-10 transition-all duration-300 ${
            sidebarCompact ? "pl-20" : "pl-64"
          }`}
        >
          <main className="p-6 lg:p-8 max-w-[1680px] mx-auto">
            {activeTab === "dashboard" && (
              <div className="mb-4 overflow-hidden rounded-3xl border border-white/80 bg-white/75 px-5 py-3.5 shadow-apple-card backdrop-blur-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-apple-blue">
                      AegisOps Command Center
                    </p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                      Real-time GIS tactical HUD for corridor operations.
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-apple-green animate-pulse" />
                    Backend live sync active
                  </div>
                </div>
              </div>
            )}
            {TAB_VIEWS[activeTab](setActiveTab)}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
