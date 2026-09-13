"use client";

import { useCallback, useRef, useState } from "react";
import Icon from "../Icon";
import { useToast } from "../toast/ToastProvider";
import { DEFAULT_USER_PROFILE } from "@/lib/data";
import type { UserProfile as UserProfileType } from "@/lib/types";

interface UserProfileProps {
  onNavigate: (tab: "dashboard" | "hazards" | "fleet" | "routes" | "weather" | "reports" | "profile") => void;
}

type ActiveSection = "overview" | "edit" | "preferences" | "report";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function UserProfile({ onNavigate }: UserProfileProps) {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<UserProfileType>({ ...DEFAULT_USER_PROFILE });
  const [activeSection, setActiveSection] = useState<ActiveSection>("overview");
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<{ file: File; preview: string; uploading: boolean; uploaded: boolean; url?: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editable form state
  const [editForm, setEditForm] = useState({
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    callsign: profile.callsign,
    unit: profile.unit,
    sector: profile.sector,
  });

  // Incident Report form state
  const [reportForm, setReportForm] = useState({
    location: "",
    hazardType: "Landslide",
    severity: "Moderate" as "Critical" | "High" | "Moderate" | "Low",
    description: "",
    coordinates: "",
  });

  const handleEditChange = useCallback((field: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSaveProfile = useCallback(async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    setProfile((prev) => ({
      ...prev,
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
      callsign: editForm.callsign,
      unit: editForm.unit,
      sector: editForm.sector,
      avatarInitials: editForm.name
        .split(" ")
        .filter((w) => /^[A-Z]/.test(w))
        .map((w) => w[0])
        .join("")
        .slice(0, 2) || "AR",
      lastActive: new Date().toISOString(),
    }));

    setIsSaving(false);
    showToast("Profile updated successfully");
    setActiveSection("overview");
  }, [editForm, showToast]);

  const handlePhotosSelected = useCallback((files: FileList | File[]) => {
    const newPhotos = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 5 - uploadedPhotos.length)
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        uploading: false,
        uploaded: false,
      }));

    if (newPhotos.length === 0) {
      showToast("Please select image files (JPG, PNG, WebP)");
      return;
    }

    setUploadedPhotos((prev) => [...prev, ...newPhotos].slice(0, 5));
    showToast(`${newPhotos.length} photo(s) added`);
  }, [uploadedPhotos.length, showToast]);

  const handleRemovePhoto = useCallback((index: number) => {
    setUploadedPhotos((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  }, []);

  const uploadPhotosToServer = useCallback(async (): Promise<string[]> => {
    if (uploadedPhotos.length === 0) return [];

    const formData = new FormData();
    uploadedPhotos.forEach((photo) => {
      formData.append("photos", photo.file);
    });

    setUploadedPhotos((prev) => prev.map((p) => ({ ...p, uploading: true })));

    try {
      const response = await fetch(`${BACKEND_URL}/api/uploads`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const urls = data.files.map((f: { url: string }) => f.url);
        setUploadedPhotos((prev) =>
          prev.map((p, i) => ({ ...p, uploading: false, uploaded: true, url: urls[i] || "" }))
        );
        return urls;
      }
    } catch {
      // Offline mode — photos stay local
    }

    setUploadedPhotos((prev) => prev.map((p) => ({ ...p, uploading: false })));
    return uploadedPhotos.map((p) => p.preview);
  }, [uploadedPhotos]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handlePhotosSelected(e.dataTransfer.files);
    }
  }, [handlePhotosSelected]);

  const handleSubmitReport = useCallback(async () => {
    if (!reportForm.location || !reportForm.description) {
      showToast("Please fill in all required fields");
      return;
    }

    setIsSaving(true);

    // Upload photos first
    let photoUrls: string[] = [];
    if (uploadedPhotos.length > 0) {
      photoUrls = await uploadPhotosToServer();
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: reportForm.location,
          hazardType: reportForm.hazardType,
          severity: reportForm.severity,
          description: reportForm.description,
          coordinates: reportForm.coordinates,
          reportedBy: profile.callsign,
          photos: photoUrls,
        }),
      });

      if (response.ok) {
        setProfile((prev) => ({
          ...prev,
          incidentsReported: prev.incidentsReported + 1,
        }));
        const photoNote = photoUrls.length > 0 ? ` with ${photoUrls.length} photo(s)` : "";
        showToast(`Incident report submitted${photoNote}: ${reportForm.hazardType} at ${reportForm.location}`);
        setReportForm({
          location: "",
          hazardType: "Landslide",
          severity: "Moderate",
          description: "",
          coordinates: "",
        });
        setUploadedPhotos([]);
        setActiveSection("overview");
      } else {
        setProfile((prev) => ({
          ...prev,
          incidentsReported: prev.incidentsReported + 1,
        }));
        showToast(`Incident report logged: ${reportForm.hazardType} at ${reportForm.location}`);
        setReportForm({
          location: "",
          hazardType: "Landslide",
          severity: "Moderate",
          description: "",
          coordinates: "",
        });
        setUploadedPhotos([]);
        setActiveSection("overview");
      }
    } catch {
      setProfile((prev) => ({
        ...prev,
        incidentsReported: prev.incidentsReported + 1,
      }));
      showToast(`Incident report filed locally: ${reportForm.hazardType} at ${reportForm.location}`);
      setReportForm({
        location: "",
        hazardType: "Landslide",
        severity: "Moderate",
        description: "",
        coordinates: "",
      });
      setUploadedPhotos([]);
      setActiveSection("overview");
    } finally {
      setIsSaving(false);
    }
  }, [reportForm, profile.callsign, showToast]);

  const handlePreferenceToggle = useCallback((key: keyof UserProfileType["preferences"]) => {
    setProfile((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: !prev.preferences[key],
      },
    }));
    showToast(`Preference updated: ${key}`);
  }, [showToast]);

  const sectionTabs: { id: ActiveSection; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "dashboard" },
    { id: "edit", label: "Edit Profile", icon: "edit" },
    { id: "preferences", label: "Preferences", icon: "tune" },
    { id: "report", label: "File Report", icon: "add_circle" },
  ];

  const stats = [
    { label: "Missions", value: profile.missionsCompleted, icon: "military_tech", color: "text-apple-blue", bg: "bg-blue-50" },
    { label: "Incidents", value: profile.incidentsReported, icon: "report", color: "text-apple-red", bg: "bg-red-50" },
    { label: "Routes", value: profile.routesPlanned, icon: "alt_route", color: "text-apple-green", bg: "bg-emerald-50" },
    { label: "Fleet", value: profile.fleetManaged, icon: "local_shipping", color: "text-apple-purple", bg: "bg-purple-50" },
  ];

  return (
    <section className="tab-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-br from-[#0f2f66] via-[#1a4a9e] to-[#3b82f6] p-8 shadow-apple-card mb-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/5 blur-2xl" />

        <div className="relative flex flex-wrap items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm text-white ring-2 ring-white/30 shadow-lg">
              <span className="text-2xl font-black tracking-[0.2em]">{profile.avatarInitials}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-apple-green border-2 border-white shadow-sm" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white tracking-tight">{profile.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold text-white/90">
                <Icon name="badge" className="text-sm" />
                {profile.role}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold text-white/90">
                <Icon name="radar" className="text-sm" />
                {profile.callsign}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-apple-green/20 text-xs font-semibold text-apple-green">
                <Icon name="verified_user" className="text-sm" />
                {profile.clearanceLevel}
              </span>
            </div>
            <p className="mt-2 text-xs text-white/60">
              {profile.unit} &bull; {profile.sector}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-sm text-white text-xs font-semibold hover:bg-white/25 transition-all"
              onClick={() => setActiveSection("edit")}
            >
              <Icon name="edit" className="text-sm" />
              Edit
            </button>
            <button
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-apple-green/90 text-white text-xs font-semibold hover:bg-apple-green transition-all shadow-md"
              onClick={() => setActiveSection("report")}
            >
              <Icon name="add_circle" className="text-sm" />
              File Report
            </button>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {sectionTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeSection === tab.id
                ? "bg-white text-apple-blue shadow-apple-glass border border-slate-200/60"
                : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
            }`}
          >
            <Icon name={tab.icon} className="text-base" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Section */}
      {activeSection === "overview" && (
        <div className="space-y-6 tab-fade-in">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="apple-glass-card rounded-2xl p-5 cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <div className={`inline-flex p-2.5 rounded-xl ${stat.bg} mb-3`}>
                  <Icon name={stat.icon} className={`text-xl ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label} Completed</p>
              </div>
            ))}
          </div>

          {/* Profile Details Cards */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Personal Details */}
            <div className="apple-glass rounded-2xl p-6 border border-white">
              <div className="flex items-center gap-2 mb-5">
                <Icon name="person" className="text-lg text-apple-blue" />
                <h3 className="text-sm font-bold text-slate-900">Personal Details</h3>
              </div>
              <div className="space-y-4">
                {[
                  { icon: "badge", label: "Full Name", value: profile.name },
                  { icon: "shield", label: "Rank", value: profile.rank },
                  { icon: "mail", label: "Email", value: profile.email },
                  { icon: "phone", label: "Phone", value: profile.phone },
                  { icon: "radar", label: "Callsign", value: profile.callsign },
                  { icon: "verified_user", label: "Clearance", value: profile.clearanceLevel },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <Icon name={item.icon} className="text-base text-slate-400" />
                      <span className="text-xs text-slate-500">{item.label}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Assignment Details */}
            <div className="apple-glass rounded-2xl p-6 border border-white">
              <div className="flex items-center gap-2 mb-5">
                <Icon name="military_tech" className="text-lg text-apple-orange" />
                <h3 className="text-sm font-bold text-slate-900">Assignment &amp; Activity</h3>
              </div>
              <div className="space-y-4">
                {[
                  { icon: "group", label: "Unit", value: profile.unit },
                  { icon: "map", label: "Sector", value: profile.sector },
                  { icon: "work", label: "Role", value: profile.role },
                  { icon: "calendar_today", label: "Joined", value: new Date(profile.joinedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
                  { icon: "schedule", label: "Last Active", value: "Just now" },
                  { icon: "trending_up", label: "Uptime", value: "99.4%" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <Icon name={item.icon} className="text-base text-slate-400" />
                      <span className="text-xs text-slate-500">{item.label}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="apple-glass rounded-2xl p-6 border border-white">
            <div className="flex items-center gap-2 mb-5">
              <Icon name="history" className="text-lg text-apple-indigo" />
              <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
            </div>
            <div className="space-y-3">
              {[
                { time: "2m ago", action: "Approved Detour Alpha-7 broadcast to fleet", icon: "check_circle", color: "text-apple-green", bg: "bg-emerald-50" },
                { time: "18m ago", action: "Filed incident report #INC-2024-0143 at NH-29 KM 142", icon: "report", color: "text-apple-red", bg: "bg-red-50" },
                { time: "1h ago", action: "Updated fleet unit Bravo-04 route assignment", icon: "local_shipping", color: "text-apple-blue", bg: "bg-blue-50" },
                { time: "3h ago", action: "Reviewed weather advisory for Sela Pass corridor", icon: "cloud", color: "text-apple-cyan", bg: "bg-cyan-50" },
                { time: "6h ago", action: "Dispatched drone recon for Kali River surge zone", icon: "flight", color: "text-apple-purple", bg: "bg-purple-50" },
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/50 transition-colors">
                  <div className={`p-1.5 rounded-lg ${activity.bg} shrink-0`}>
                    <Icon name={activity.icon} className={`text-base ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700">{activity.action}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Section */}
      {activeSection === "edit" && (
        <div className="tab-fade-in apple-glass rounded-2xl p-8 border border-white shadow-apple-card">
          <div className="flex items-center gap-2 mb-6">
            <Icon name="edit" className="text-lg text-apple-blue" />
            <h3 className="text-lg font-bold text-slate-900">Edit Profile</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { field: "name", label: "Full Name", icon: "badge", type: "text", placeholder: "Enter full name" },
              { field: "callsign", label: "Callsign", icon: "radar", type: "text", placeholder: "e.g., Sentinel-01" },
              { field: "email", label: "Email Address", icon: "mail", type: "email", placeholder: "name@aegisops.mil" },
              { field: "phone", label: "Phone Number", icon: "phone", type: "tel", placeholder: "+91 XXXXX XXXXX" },
              { field: "unit", label: "Assigned Unit", icon: "group", type: "text", placeholder: "Unit designation" },
              { field: "sector", label: "Operating Sector", icon: "map", type: "text", placeholder: "Sector assignment" },
            ].map((input) => (
              <div key={input.field}>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
                  <Icon name={input.icon} className="text-sm text-slate-400" />
                  {input.label}
                </label>
                <input
                  type={input.type}
                  value={editForm[input.field as keyof typeof editForm]}
                  onChange={(e) => handleEditChange(input.field, e.target.value)}
                  placeholder={input.placeholder}
                  className="w-full bg-white/80 border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 focus:border-apple-blue/30 transition-all"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-apple-blue text-white text-sm font-semibold hover:bg-blue-600 transition-all shadow-apple-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name={isSaving ? "sync" : "save"} className={`text-base ${isSaving ? "animate-spin" : ""}`} />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={() => {
                setEditForm({
                  name: profile.name,
                  email: profile.email,
                  phone: profile.phone,
                  callsign: profile.callsign,
                  unit: profile.unit,
                  sector: profile.sector,
                });
                setActiveSection("overview");
              }}
              className="px-6 py-3 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Preferences Section */}
      {activeSection === "preferences" && (
        <div className="tab-fade-in space-y-6">
          <div className="apple-glass rounded-2xl p-8 border border-white shadow-apple-card">
            <div className="flex items-center gap-2 mb-6">
              <Icon name="tune" className="text-lg text-apple-blue" />
              <h3 className="text-lg font-bold text-slate-900">System Preferences</h3>
            </div>

            <div className="space-y-1">
              {[
                { key: "notifications" as const, label: "Push Notifications", desc: "Receive alerts for hazards, fleet updates, and weather changes", icon: "notifications_active" },
                { key: "soundAlerts" as const, label: "Sound Alerts", desc: "Play audio cues for critical incident alerts", icon: "volume_up" },
                { key: "autoRefresh" as const, label: "Auto Refresh", desc: "Automatically refresh telemetry data from backend", icon: "autorenew" },
                { key: "darkMode" as const, label: "Dark Mode", desc: "Switch to dark theme for low-light environments", icon: "dark_mode" },
              ].map((pref) => (
                <div
                  key={pref.key}
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-white/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100">
                      <Icon name={pref.icon} className="text-lg text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{pref.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{pref.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePreferenceToggle(pref.key)}
                    className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
                      profile.preferences[pref.key]
                        ? "bg-apple-green"
                        : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
                        profile.preferences[pref.key]
                          ? "translate-x-[22px]"
                          : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Static Preferences */}
          <div className="apple-glass rounded-2xl p-8 border border-white shadow-apple-card">
            <div className="flex items-center gap-2 mb-6">
              <Icon name="settings" className="text-lg text-apple-purple" />
              <h3 className="text-lg font-bold text-slate-900">Display Settings</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
                  <Icon name="refresh" className="text-sm text-slate-400" />
                  Telemetry Refresh Interval
                </label>
                <select
                  value={profile.preferences.telemetryInterval}
                  onChange={(e) => {
                    setProfile((prev) => ({
                      ...prev,
                      preferences: { ...prev.preferences, telemetryInterval: Number(e.target.value) },
                    }));
                    showToast(`Telemetry interval set to ${e.target.value}s`);
                  }}
                  className="w-full bg-white/80 border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 transition-all"
                >
                  <option value={3}>3 seconds</option>
                  <option value={5}>5 seconds</option>
                  <option value={10}>10 seconds</option>
                  <option value={30}>30 seconds</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
                  <Icon name="map" className="text-sm text-slate-400" />
                  Map Style
                </label>
                <select
                  value={profile.preferences.mapStyle}
                  onChange={(e) => {
                    setProfile((prev) => ({
                      ...prev,
                      preferences: { ...prev.preferences, mapStyle: e.target.value },
                    }));
                    showToast(`Map style changed to ${e.target.value}`);
                  }}
                  className="w-full bg-white/80 border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 transition-all"
                >
                  <option>Satellite Hybrid</option>
                  <option>Street Map</option>
                  <option>Terrain</option>
                  <option>Dark Mode</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
                  <Icon name="language" className="text-sm text-slate-400" />
                  Language
                </label>
                <select
                  value={profile.preferences.language}
                  onChange={(e) => {
                    setProfile((prev) => ({
                      ...prev,
                      preferences: { ...prev.preferences, language: e.target.value },
                    }));
                    showToast(`Language set to ${e.target.value}`);
                  }}
                  className="w-full bg-white/80 border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 transition-all"
                >
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Bengali</option>
                  <option>Assamese</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
                  <Icon name="schedule" className="text-sm text-slate-400" />
                  Timezone
                </label>
                <select
                  value={profile.preferences.timezone}
                  onChange={(e) => {
                    setProfile((prev) => ({
                      ...prev,
                      preferences: { ...prev.preferences, timezone: e.target.value },
                    }));
                    showToast(`Timezone set to ${e.target.value}`);
                  }}
                  className="w-full bg-white/80 border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 transition-all"
                >
                  <option>Asia/Kolkata (GMT+5:30)</option>
                  <option>UTC (GMT+0:00)</option>
                  <option>US/Eastern (GMT-5:00)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Report Section */}
      {activeSection === "report" && (
        <div className="tab-fade-in apple-glass rounded-2xl p-8 border border-white shadow-apple-card">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="add_circle" className="text-lg text-apple-red" />
            <h3 className="text-lg font-bold text-slate-900">File Incident Report</h3>
          </div>
          <p className="text-sm text-slate-500 mb-6">
            Submit a new incident report. This will be broadcast to the command center and all active field units.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
                <Icon name="location_on" className="text-sm text-apple-red" />
                Location <span className="text-apple-red">*</span>
              </label>
              <input
                type="text"
                value={reportForm.location}
                onChange={(e) => setReportForm((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., NH-29 KM 142, Sela Pass"
                className="w-full bg-white/80 border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-apple-red/30 focus:border-apple-red/30 transition-all"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
                <Icon name="my_location" className="text-sm text-apple-blue" />
                Coordinates
              </label>
              <input
                type="text"
                value={reportForm.coordinates}
                onChange={(e) => setReportForm((prev) => ({ ...prev, coordinates: e.target.value }))}
                placeholder="e.g., 27.329N 88.603E"
                className="w-full bg-white/80 border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/30 focus:border-apple-blue/30 transition-all"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
                <Icon name="warning" className="text-sm text-apple-orange" />
                Hazard Type
              </label>
              <select
                value={reportForm.hazardType}
                onChange={(e) => setReportForm((prev) => ({ ...prev, hazardType: e.target.value }))}
                className="w-full bg-white/80 border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-apple-orange/30 transition-all"
              >
                <option>Landslide</option>
                <option>Flash Flood</option>
                <option>Road Icing</option>
                <option>Rockfall</option>
                <option>Bridge Damage</option>
                <option>Vehicle Breakdown</option>
                <option>Weather Emergency</option>
                <option>Security Incident</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
                <Icon name="priority_high" className="text-sm text-apple-red" />
                Severity Level
              </label>
              <div className="flex gap-2">
                {(["Low", "Moderate", "High", "Critical"] as const).map((level) => {
                  const colorMap = {
                    Low: "border-slate-200 bg-slate-50 text-slate-600",
                    Moderate: "border-blue-200 bg-blue-50 text-apple-blue",
                    High: "border-orange-200 bg-orange-50 text-apple-orange",
                    Critical: "border-red-200 bg-red-50 text-apple-red",
                  };
                  const activeColorMap = {
                    Low: "border-slate-400 bg-slate-200 text-slate-800 shadow-sm",
                    Moderate: "border-apple-blue bg-blue-100 text-apple-blue shadow-sm ring-1 ring-apple-blue/20",
                    High: "border-apple-orange bg-orange-100 text-apple-orange shadow-sm ring-1 ring-apple-orange/20",
                    Critical: "border-apple-red bg-red-100 text-apple-red shadow-sm ring-1 ring-apple-red/20",
                  };
                  return (
                    <button
                      key={level}
                      onClick={() => setReportForm((prev) => ({ ...prev, severity: level }))}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        reportForm.severity === level
                          ? activeColorMap[level]
                          : `${colorMap[level]} hover:opacity-80`
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
                <Icon name="description" className="text-sm text-slate-400" />
                Description <span className="text-apple-red">*</span>
              </label>
              <textarea
                value={reportForm.description}
                onChange={(e) => setReportForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the incident in detail: what happened, current impact, estimated scale, and any immediate actions taken..."
                rows={4}
                className="w-full bg-white/80 border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/30 transition-all resize-none"
              />
            </div>
          </div>

          {/* Photo Upload Section */}
          <div className="mt-6">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-3">
              <Icon name="photo_camera" className="text-sm text-apple-teal" />
              Hazard Photos <span className="text-slate-400 font-normal">(up to 5 images, max 10MB each)</span>
            </label>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative w-full border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 ${
                isDragging
                  ? "border-apple-blue bg-blue-50/60 scale-[1.01]"
                  : "border-slate-200/80 bg-white/50 hover:border-apple-blue/40 hover:bg-blue-50/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handlePhotosSelected(e.target.files);
                  e.target.value = "";
                }}
              />
              <div className="flex flex-col items-center gap-2">
                <div className={`p-3 rounded-xl transition-colors ${
                  isDragging ? "bg-apple-blue/10" : "bg-slate-100"
                }`}>
                  <Icon
                    name={isDragging ? "download" : "cloud_upload"}
                    className={`text-3xl transition-colors ${
                      isDragging ? "text-apple-blue" : "text-slate-400"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {isDragging ? "Drop images here" : "Drag & drop hazard photos"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    or <span className="text-apple-blue font-medium">browse files</span> &bull; JPG, PNG, WebP
                  </p>
                </div>
              </div>

              {uploadedPhotos.length >= 5 && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <p className="text-sm font-semibold text-slate-500">Maximum 5 photos reached</p>
                </div>
              )}
            </div>

            {/* Photo Previews */}
            {uploadedPhotos.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {uploadedPhotos.map((photo, index) => (
                  <div key={index} className="group relative rounded-xl overflow-hidden border border-slate-200/80 shadow-sm bg-white">
                    <div className="aspect-square relative">
                      <img
                        src={photo.preview}
                        alt={`Hazard photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Uploading overlay */}
                      {photo.uploading && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                          <div className="flex flex-col items-center gap-1">
                            <Icon name="sync" className="text-2xl text-white animate-spin" />
                            <span className="text-[10px] text-white font-semibold">Uploading...</span>
                          </div>
                        </div>
                      )}
                      {/* Uploaded checkmark */}
                      {photo.uploaded && !photo.uploading && (
                        <div className="absolute top-1.5 left-1.5 p-0.5 rounded-full bg-apple-green shadow-md">
                          <Icon name="check" className="text-xs text-white" />
                        </div>
                      )}
                      {/* Remove button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto(index);
                        }}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-apple-red transition-all duration-200 shadow-md"
                      >
                        <Icon name="close" className="text-xs" />
                      </button>
                    </div>
                    {/* File info */}
                    <div className="p-1.5">
                      <p className="text-[10px] text-slate-600 font-medium truncate">{photo.file.name}</p>
                      <p className="text-[9px] text-slate-400">{(photo.file.size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Report Preview */}
          {(reportForm.location || reportForm.description) && (
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Report Preview</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {reportForm.location && (
                  <span className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700">
                    {"\uD83D\uDCCD"} {reportForm.location}
                  </span>
                )}
                <span className={`px-2 py-1 rounded-lg border font-semibold ${
                  reportForm.severity === "Critical" ? "bg-red-50 border-red-200 text-apple-red" :
                  reportForm.severity === "High" ? "bg-orange-50 border-orange-200 text-apple-orange" :
                  reportForm.severity === "Moderate" ? "bg-blue-50 border-blue-200 text-apple-blue" :
                  "bg-slate-50 border-slate-200 text-slate-600"
                }`}>
                  {reportForm.severity}
                </span>
                <span className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700">
                  {"\u26A0\uFE0F"} {reportForm.hazardType}
                </span>
                {uploadedPhotos.length > 0 && (
                  <span className="px-2 py-1 rounded-lg bg-teal-50 border border-teal-200 text-apple-teal font-semibold">
                    {"\uD83D\uDCF7"} {uploadedPhotos.length} photo{uploadedPhotos.length > 1 ? "s" : ""} attached
                  </span>
                )}
                <span className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-500">
                  By {profile.callsign}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={handleSubmitReport}
              disabled={isSaving || !reportForm.location || !reportForm.description}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-apple-red text-white text-sm font-semibold hover:bg-red-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name={isSaving ? "sync" : "send"} className={`text-base ${isSaving ? "animate-spin" : ""}`} />
              {isSaving ? "Submitting..." : "Submit Report"}
            </button>
            <button
              onClick={() => setActiveSection("overview")}
              className="px-6 py-3 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
