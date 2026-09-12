"use client";

import { useTelemetrySnapshot } from "@/lib/telemetry-store";

export default function IncidentReports() {
  const { incidentReports: reports, backendConnected } = useTelemetrySnapshot();

  return (
    <section className="tab-fade-in">
      <div className="apple-glass rounded-3xl p-8 shadow-apple-card border border-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-apple-blue">
          Incident Reports
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Live report archive.
        </h1>
        <p className="mt-3 text-sm text-slate-600 max-w-2xl">
          Recent incident records stay current with live age markers and status
          updates so the command team can scan the archive at a glance.
        </p>
        <p className={`mt-3 text-xs font-semibold uppercase tracking-[0.2em] ${backendConnected ? "text-apple-green" : "text-apple-orange"}`}>
          {backendConnected ? "Backend telemetry connected" : "Showing fallback telemetry"}
        </p>

        <div className="mt-6 space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="apple-glass-card rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{report.reportId}</p>
                  <p className="text-xs text-slate-500">{report.location}</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`rounded-full px-2.5 py-1 font-bold uppercase tracking-[0.2em] ${report.severityClassName}`}>
                    {report.severity}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 font-bold uppercase tracking-[0.2em] ${report.statusClassName}`}>
                    {report.status}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                <p className="text-slate-600">{report.hazardType}</p>
                <p className="font-semibold text-slate-900">{report.liveAge}</p>
              </div>
              <div className="mt-3 text-xs text-slate-500">
                Recorded {report.timestamp} UTC, updated {report.liveUpdatedAt} UTC
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
