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
          <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-32 w-[550px] h-[550px] bg-indigo-50/40 rounded-full blur-3xl" />
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
            {TAB_VIEWS[activeTab](setActiveTab)}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
