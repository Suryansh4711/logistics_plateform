"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import type { TabId } from "@/lib/types";
import { useToast } from "./toast/ToastProvider";
import { useTelemetrySnapshot } from "@/lib/telemetry-store";

interface HeaderProps {
  onNavigate: (tab: TabId) => void;
}

const SEARCH_ROUTES: { keywords: string[]; tab: TabId }[] = [
  { keywords: ["hazard", "landslide"], tab: "hazards" },
  { keywords: ["fleet", "truck", "alpha"], tab: "fleet" },
  { keywords: ["route", "detour"], tab: "routes" },
  { keywords: ["weather", "ice"], tab: "weather" },
];

export default function Header({ onNavigate }: HeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { notifications } = useTelemetrySnapshot();
  const [visibleNotifications, setVisibleNotifications] = useState(notifications);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    setVisibleNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleGlobalSearch(term: string) {
    if (!term) return;
    const lower = term.toLowerCase();
    const match = SEARCH_ROUTES.find((route) =>
      route.keywords.some((keyword) => lower.includes(keyword)),
    );
    if (match) onNavigate(match.tab);
  }

  function clearNotifications() {
    setVisibleNotifications([]);
    void Promise.all(
      visibleNotifications.map((notification) =>
        fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000"}/api/notifications/${notification.id}/read`,
          { method: "POST" },
        ),
      ),
    );
    showToast("Notifications marked as read");
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-18 z-50 apple-glass shadow-[0_10px_30px_rgba(148,163,184,0.14)] border-b border-white/80 px-5 lg:px-6 flex items-center justify-between transition-all">
      {/* Left: AegisOps Logo & Status */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-3 rounded-2xl bg-white/80 border border-slate-200/70 px-3 py-2 shadow-sm backdrop-blur-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0f2f66] via-apple-blue to-[#66a9ff] text-white shadow-[0_12px_24px_rgba(0,122,255,0.28)] ring-1 ring-white/60">
            <Icon name="hexagon" className="text-lg" />
          </div>
          <div className="min-w-0 leading-none">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[0.72rem] font-semibold tracking-[0.42em] text-slate-700 uppercase">
                Aegis
              </span>
              <span className="text-xl font-black tracking-[0.24em] text-apple-blue uppercase">
                OPS
              </span>
            </div>
            <div className="mt-1 text-[10px] font-semibold tracking-[0.35em] text-slate-500 uppercase">
              GIS // Tactical HUD
            </div>
          </div>
        </div>
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 shrink-0">
          <span className="w-2 h-2 rounded-full bg-apple-green animate-pulse" />
          <span className="text-[11px] font-semibold text-emerald-700">
            Operational
          </span>
        </div>
      </div>

      {/* Center: Search Capsule & Sat-Link Indicator */}
      <div className="hidden lg:flex items-center gap-3">
        <div className="relative w-[22rem]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon name="search" className="text-lg" />
          </span>
          <input
            ref={searchInputRef}
            className="w-full bg-slate-100/80 border border-slate-200/70 rounded-full pl-9 pr-8 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 focus:bg-white transition-all"
            onChange={(event) => handleGlobalSearch(event.target.value)}
            placeholder="Search corridors, fleet, geofences..."
            type="text"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
            ⌘K
          </kbd>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/85 border border-slate-200/70 rounded-full text-xs shadow-2xs">
          <Icon name="satellite_alt" className="text-sm text-apple-blue" />
          <span className="font-mono text-[11px] text-slate-800 font-medium">
            27°19&apos;N 88°36&apos;E
          </span>
          <span className="text-[10px] text-apple-green font-semibold bg-emerald-50 px-1 rounded">
            ±0.4m
          </span>
        </div>
      </div>

      {/* Right: Bell Notification, Settings & User Profile */}
      <div className="flex items-center gap-2.5 relative">
        <button
          className="relative w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
          onClick={() => setNotificationsOpen((open) => !open)}
        >
          <Icon name="notifications" className="text-xl" />
          {visibleNotifications.length > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-apple-red" />
          )}
        </button>
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
          onClick={() =>
            showToast("GIS Configuration: All geo-layers synchronized")
          }
        >
          <Icon name="settings" className="text-xl" />
        </button>
        <div className="flex items-center gap-2 pl-2 pr-2 py-1 rounded-full bg-white/90 border border-slate-200/80 shadow-2xs hover:bg-white transition-all cursor-pointer">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 via-slate-700 to-apple-blue text-white ring-2 ring-apple-blue/20">
            <span className="text-[11px] font-black tracking-[0.18em]">AR</span>
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-800 leading-tight">
              Cmdr. A. Reid
            </span>
            <span className="text-[10px] text-apple-blue font-medium leading-tight">
              Operations Lead
            </span>
          </div>
        </div>

        {notificationsOpen && (
          <div className="absolute top-12 right-0 w-80 apple-glass-strong rounded-2xl shadow-popover border border-white p-4 z-50">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">
                Incident Alerts ({visibleNotifications.length})
              </span>
              <button
                className="text-[11px] text-apple-blue hover:underline"
                onClick={clearNotifications}
              >
                Mark read
              </button>
            </div>
            <div className="space-y-2 mt-3">
              {visibleNotifications.length === 0 ? (
                <div className="text-xs text-slate-400 py-3 text-center">
                  All notifications marked as read
                </div>
              ) : (
                visibleNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-2.5 rounded-xl border text-xs flex gap-2.5 items-start ${notification.containerClassName}`}
                  >
                    <Icon
                      name={notification.icon}
                      className={`text-base shrink-0 mt-0.5 ${notification.iconClassName}`}
                    />
                    <div>
                      <p className="font-semibold text-slate-900">
                        {notification.title}
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        {notification.description}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
