"use client";

import dynamic from "next/dynamic";

const CorridorMap = dynamic(() => import("./CorridorMap"), {
  ssr: false,
  loading: () => (
    <div className="relative h-[560px] w-full overflow-hidden rounded-3xl border border-white bg-white/70 shadow-apple-card">
      <div className="absolute inset-0 animate-pulse bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(241,245,249,0.88))]" />
      <div className="relative flex h-full items-center justify-center px-6 text-center">
        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-apple-blue">
            Loading map
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">
            Corridor map mounting on the client
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Leaflet is being loaded client-side so the map can render safely in Next.
          </p>
        </div>
      </div>
    </div>
  ),
});

export default function MapWidget() {
  return <CorridorMap />;
}
