"use client";

export default function MapWidget() {
  return (
    <div className="relative w-full rounded-3xl border border-dashed border-slate-200 bg-white/70 px-6 py-16 text-center shadow-apple-card">
      <div className="mx-auto max-w-md">
        <p className="text-xs font-semibold uppercase tracking-wider text-apple-blue">
          Map removed
        </p>
        <h2 className="mt-2 text-xl font-bold text-slate-900">
          Live map will be added later
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          The placeholder satellite map, convoy pins, and layer toggles have been
          cleared out so you can plug in the real map component when it is ready.
        </p>
      </div>
    </div>
  );
}
