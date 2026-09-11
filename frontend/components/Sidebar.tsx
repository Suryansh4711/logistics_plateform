"use client";

import Icon from "./Icon";
import { NAV_ITEMS } from "@/lib/data";
import type { TabId } from "@/lib/types";

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  compact: boolean;
  onToggleCompact: () => void;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  compact,
  onToggleCompact,
}: SidebarProps) {
  return (
    <aside
      className={`fixed left-0 top-16 bottom-0 z-40 apple-glass border-r border-white/60 p-3.5 flex flex-col justify-between transition-all duration-300 ${
        compact ? "w-20" : "w-64"
      }`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2 pt-1">
          {!compact && (
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Command Modules
            </span>
          )}
          <button
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            onClick={onToggleCompact}
            title="Toggle Sidebar rail"
          >
            <Icon name="menu_open" className="text-lg" />
          </button>
        </div>

        <nav className="flex flex-col gap-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`nav-item flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-xs text-left ${
                  compact ? "justify-center px-0" : ""
                } ${
                  isActive
                    ? "bg-white text-apple-blue shadow-apple-glass font-semibold border border-slate-200/60"
                    : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    name={item.icon}
                    className={`text-lg shrink-0 ${
                      isActive ? "" : item.iconClassName
                    }`}
                  />
                  {!compact && <span>{item.label}</span>}
                </div>
                {!compact &&
                  (item.id === "dashboard" ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-apple-blue" />
                  ) : item.badge.text ? (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${item.badge.className}`}
                    >
                      {item.badge.text}
                    </span>
                  ) : null)}
              </button>
            );
          })}
        </nav>
      </div>

      {!compact && (
        <div className="apple-glass rounded-2xl p-3 shadow-2xs border border-white flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-apple-green" />
              <span className="text-xs font-semibold text-slate-800">
                Telemetry Health
              </span>
            </div>
            <span className="text-[10px] font-bold text-apple-green">
              NOMINAL
            </span>
          </div>
          <div className="space-y-1.5 pt-1 text-[11px]">
            <div className="flex justify-between text-slate-500">
              <span>Memory</span>
              <span className="font-mono font-semibold text-slate-700">
                34%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-apple-blue rounded-full w-[34%]" />
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Network</span>
              <span className="font-mono font-semibold text-slate-700">
                8.4 MB/s
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-apple-green rounded-full w-[62%]" />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
