"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "../Icon";
import { useToast } from "../toast/ToastProvider";
import { DEFAULT_USER_PROFILE } from "@/lib/data";
import type { TabId, UserProfile as UserProfileType } from "@/lib/types";
import { useTelemetrySnapshot } from "@/lib/telemetry-store";

export type ProfileScreen = "overview" | "edit" | "preferences" | "report" | "activity";

export interface UserProfileProps {
  onNavigate?: (tab: TabId) => void;
  initialScreen?: ProfileScreen;
  activeScreen?: ProfileScreen;
  setScreen?: (screen: ProfileScreen) => void;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

interface ActivityLogItem {
  id: string;
  time: string;
  action: string;
  category: "incident" | "fleet" | "route" | "weather" | "security";
  icon: string;
  color: string;
  bg: string;
}

const INITIAL_ACTIVITIES: ActivityLogItem[] = [
  { id: "act-1", time: "2m ago", action: "Approved Detour Alpha-7 broadcast to fleet", category: "route", icon: "check_circle", color: "text-apple-green", bg: "bg-emerald-50" },
  { id: "act-2", time: "18m ago", action: "Filed incident report #INC-2024-0143 at NH-29 KM 142", category: "incident", icon: "report", color: "text-apple-red", bg: "bg-red-50" },
  { id: "act-3", time: "1h ago", action: "Updated fleet unit Bravo-04 route assignment", category: "fleet", icon: "local_shipping", color: "text-apple-blue", bg: "bg-blue-50" },
  { id: "act-4", time: "3h ago", action: "Reviewed weather advisory for Sela Pass corridor", category: "weather", icon: "cloud", color: "text-apple-cyan", bg: "bg-cyan-50" },
  { id: "act-5", time: "6h ago", action: "Dispatched drone recon for Kali River surge zone", category: "security", icon: "flight", color: "text-apple-purple", bg: "bg-purple-50" },
  { id: "act-6", time: "12h ago", action: "Updated profile preferences: Sound alerts enabled", category: "security", icon: "tune", color: "text-slate-600", bg: "bg-slate-100" },
  { id: "act-7", time: "1d ago", action: "Completed strategic corridor simulation Sector 07", category: "route", icon: "alt_route", color: "text-apple-green", bg: "bg-emerald-50" },
];

export default function UserProfile({
  onNavigate,
  initialScreen = "overview",
  activeScreen: externalScreen,
  setScreen: externalSetScreen,
}: UserProfileProps) {
  const { showToast } = useToast();
  const telemetry = useTelemetrySnapshot();

  // Screen selection state: controlled (external) vs uncontrolled (internal)
  const [internalScreen, setInternalScreen] = useState<ProfileScreen>(initialScreen);
  const currentScreen = externalScreen !== undefined ? externalScreen : internalScreen;

  const handleSetScreen = useCallback(
    (screen: ProfileScreen) => {
      if (externalSetScreen) {
        externalSetScreen(screen);
      } else {
        setInternalScreen(screen);
      }
    },
    [externalSetScreen]
  );

  // Dynamic Profile state
  const [profile, setProfile] = useState<UserProfileType>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("aegisops_user_profile");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return { ...DEFAULT_USER_PROFILE };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [activities, setActivities] = useState<ActivityLogItem[]>(INITIAL_ACTIVITIES);
  const [activityFilter, setActivityFilter] = useState<string>("all");

  // Photos upload state for incident reporting
  const [uploadedPhotos, setUploadedPhotos] = useState<
    { file: File; preview: string; uploading: boolean; uploaded: boolean; url?: string }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [editForm, setEditForm] = useState({
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    callsign: profile.callsign,
    rank: profile.rank,
    role: profile.role,
    unit: profile.unit,
    sector: profile.sector,
    clearanceLevel: profile.clearanceLevel,
  });

  const [reportForm, setReportForm] = useState({
    location: "",
    hazardType: "Landslide",
    severity: "Moderate" as "Critical" | "High" | "Moderate" | "Low",
    description: "",
    coordinates: "",
  });

  // Sync profile from backend on mount
  useEffect(() => {
    async function fetchProfile() {
      setIsLoadingProfile(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/profile`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setEditForm({
            name: data.name ?? DEFAULT_USER_PROFILE.name,
            email: data.email ?? DEFAULT_USER_PROFILE.email,
            phone: data.phone ?? DEFAULT_USER_PROFILE.phone,
            callsign: data.callsign ?? DEFAULT_USER_PROFILE.callsign,
            rank: data.rank ?? DEFAULT_USER_PROFILE.rank,
            role: data.role ?? DEFAULT_USER_PROFILE.role,
            unit: data.unit ?? DEFAULT_USER_PROFILE.unit,
            sector: data.sector ?? DEFAULT_USER_PROFILE.sector,
            clearanceLevel: data.clearanceLevel ?? DEFAULT_USER_PROFILE.clearanceLevel,
          });
          if (typeof window !== "undefined") {
            localStorage.setItem("aegisops_user_profile", JSON.stringify(data));
          }
        }
      } catch {
        // use local state
      } finally {
        setIsLoadingProfile(false);
      }
    }
    void fetchProfile();
  }, []);

  // Save profile to backend & local storage
  const handleSaveProfile = useCallback(async () => {
    setIsSaving(true);

    const initials =
      editForm.name
        .split(" ")
        .filter((w) => /^[A-Z]/i.test(w))
        .map((w) => w[0].toUpperCase())
        .join("")
        .slice(0, 2) || "AR";

    const updatedData: Partial<UserProfileType> = {
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
      callsign: editForm.callsign,
      rank: editForm.rank,
      role: editForm.role,
      unit: editForm.unit,
      sector: editForm.sector,
      clearanceLevel: editForm.clearanceLevel,
      avatarInitials: initials,
      lastActive: new Date().toISOString(),
    };

    try {
      const res = await fetch(`${BACKEND_URL}/api/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (res.ok) {
        const saved = await res.json();
        setProfile(saved);
        if (typeof window !== "undefined") {
          localStorage.setItem("aegisops_user_profile", JSON.stringify(saved));
        }
      } else {
        setProfile((prev) => {
          const next = { ...prev, ...updatedData };
          if (typeof window !== "undefined") {
            localStorage.setItem("aegisops_user_profile", JSON.stringify(next));
          }
          return next;
        });
      }
    } catch {
      setProfile((prev) => {
        const next = { ...prev, ...updatedData };
        if (typeof window !== "undefined") {
          localStorage.setItem("aegisops_user_profile", JSON.stringify(next));
        }
        return next;
      });
    } finally {
      setIsSaving(false);
      showToast("Profile updated successfully!");

      // Add to activity log dynamically
      setActivities((prev) => [
        {
          id: `act-${Date.now()}`,
          time: "Just now",
          action: `Updated profile info (${editForm.callsign} - ${editForm.role})`,
          category: "security",
          icon: "person",
          color: "text-apple-blue",
          bg: "bg-blue-50",
        },
        ...prev,
      ]);

      handleSetScreen("overview");
    }
  }, [editForm, showToast, handleSetScreen]);

  // Handle Photo selection for incident reporting
  const handlePhotosSelected = useCallback(
    (files: FileList | File[]) => {
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
        showToast("Please select valid image files (JPG, PNG, WebP)");
        return;
      }

      setUploadedPhotos((prev) => [...prev, ...newPhotos].slice(0, 5));
      showToast(`${newPhotos.length} photo(s) attached`);
    },
    [uploadedPhotos.length, showToast]
  );

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
      // fallback local previews
    }

    setUploadedPhotos((prev) => prev.map((p) => ({ ...p, uploading: false })));
    return uploadedPhotos.map((p) => p.preview);
  }, [uploadedPhotos]);

  // Submit incident report
  const handleSubmitReport = useCallback(async () => {
    if (!reportForm.location || !reportForm.description) {
      showToast("Please fill in all required fields (Location & Description)");
      return;
    }

    setIsSaving(true);
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

      const nextCount = profile.incidentsReported + 1;
      setProfile((prev) => ({ ...prev, incidentsReported: nextCount }));

      // Sync backend profile counter
      fetch(`${BACKEND_URL}/api/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incidentsReported: nextCount }),
      }).catch(() => {});

      const photoNote = photoUrls.length > 0 ? ` with ${photoUrls.length} photo(s)` : "";
      showToast(
        response.ok
          ? `Report filed live${photoNote}: ${reportForm.hazardType} at ${reportForm.location}`
          : `Incident logged: ${reportForm.hazardType} at ${reportForm.location}`
      );

      // Add to dynamic activity log
      setActivities((prev) => [
        {
          id: `act-${Date.now()}`,
          time: "Just now",
          action: `Filed ${reportForm.severity} incident report: ${reportForm.hazardType} at ${reportForm.location}`,
          category: "incident",
          icon: "report",
          color: "text-apple-red",
          bg: "bg-red-50",
        },
        ...prev,
      ]);

      setReportForm({
        location: "",
        hazardType: "Landslide",
        severity: "Moderate",
        description: "",
        coordinates: "",
      });
      setUploadedPhotos([]);
      handleSetScreen("overview");
    } catch {
      const nextCount = profile.incidentsReported + 1;
      setProfile((prev) => ({ ...prev, incidentsReported: nextCount }));
      showToast(`Incident report recorded locally: ${reportForm.hazardType}`);
      handleSetScreen("overview");
    } finally {
      setIsSaving(false);
    }
  }, [reportForm, profile, uploadedPhotos, uploadPhotosToServer, showToast, handleSetScreen]);

  // Handle preference toggle
  const handlePreferenceToggle = useCallback(
    (key: keyof UserProfileType["preferences"]) => {
      setProfile((prev) => {
        const nextVal = !prev.preferences[key];
        const nextPreferences = { ...prev.preferences, [key]: nextVal };
        const updated = { ...prev, preferences: nextPreferences };

        if (typeof window !== "undefined") {
          localStorage.setItem("aegisops_user_profile", JSON.stringify(updated));
        }

        fetch(`${BACKEND_URL}/api/profile`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferences: nextPreferences }),
        }).catch(() => {});

        showToast(`Preference updated: ${key} is now ${nextVal ? "ON" : "OFF"}`);
        return updated;
      });
    },
    [showToast]
  );

  // Screen Tab definitions
  const screenTabs: { id: ProfileScreen; label: string; icon: string; badge?: string }[] = [
    { id: "overview", label: "Overview", icon: "dashboard" },
    { id: "edit", label: "Edit Profile", icon: "edit" },
    { id: "preferences", label: "Preferences", icon: "tune" },
    { id: "report", label: "File Report", icon: "add_circle", badge: "Live" },
    { id: "activity", label: "Activity Log", icon: "history", badge: `${activities.length}` },
  ];

  // Live telemetry stat cards
  const stats = [
    {
      id: "missions",
      label: "Missions",
      value: profile.missionsCompleted,
      subtext: "Completed",
      icon: "military_tech",
      color: "text-apple-blue",
      bg: "bg-blue-50",
      action: () => onNavigate?.("dashboard"),
      tooltip: "Click to open Command Dashboard",
    },
    {
      id: "incidents",
      label: "Incidents",
      value: Math.max(profile.incidentsReported, telemetry.incidentReports.length),
      subtext: "Reported",
      icon: "report",
      color: "text-apple-red",
      bg: "bg-red-50",
      action: () => handleSetScreen("report"),
      tooltip: "Click to file a new incident report",
    },
    {
      id: "routes",
      label: "Active Routes",
      value: Math.max(profile.routesPlanned, telemetry.routeCount),
      subtext: "Corridors",
      icon: "alt_route",
      color: "text-apple-green",
      bg: "bg-emerald-50",
      action: () => onNavigate?.("routes"),
      tooltip: "Click to inspect route planning",
    },
    {
      id: "fleet",
      label: "Fleet Units",
      value: Math.max(profile.fleetManaged, telemetry.fleetCount),
      subtext: "In Transit",
      icon: "local_shipping",
      color: "text-apple-purple",
      bg: "bg-purple-50",
      action: () => onNavigate?.("fleet"),
      tooltip: "Click to open live fleet tracking",
    },
  ];

  const filteredActivities = activities.filter((act) => {
    if (activityFilter === "all") return true;
    return act.category === activityFilter;
  });

  return (
    <section className="tab-fade-in space-y-6">
      {/* Dynamic Profile Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-br from-[#0f2f66] via-[#1a4a9e] to-[#3b82f6] p-6 lg:p-8 shadow-apple-card">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_60%)]" />
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/5 blur-2xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-6">
          {/* User Info & Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md text-white ring-2 ring-white/30 shadow-xl">
                <span className="text-2xl font-black tracking-[0.2em]">{profile.avatarInitials}</span>
              </div>
              <div
                className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-apple-green border-2 border-white shadow-sm"
                title="Status: Active Operational"
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-white tracking-tight">{profile.name}</h1>
                {isLoadingProfile && (
                  <span className="text-xs text-white/70 animate-pulse flex items-center gap-1">
                    <Icon name="sync" className="text-xs animate-spin" /> Syncing...
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold text-white/90">
                  <Icon name="badge" className="text-sm" />
                  {profile.role}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold text-white/90">
                  <Icon name="radar" className="text-sm" />
                  {profile.callsign}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-xs font-semibold text-emerald-300 border border-emerald-400/30">
                  <Icon name="verified_user" className="text-sm text-emerald-400" />
                  {profile.clearanceLevel}
                </span>
              </div>
              <p className="mt-2 text-xs text-white/70">
                {profile.unit} &bull; {profile.sector}
              </p>
            </div>
          </div>

          {/* Quick setScreen Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => handleSetScreen("overview")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentScreen === "overview"
                  ? "bg-white text-apple-blue shadow-md"
                  : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              <Icon name="dashboard" className="text-sm" />
              Overview
            </button>

            <button
              onClick={() => handleSetScreen("edit")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentScreen === "edit"
                  ? "bg-white text-apple-blue shadow-md"
                  : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              <Icon name="edit" className="text-sm" />
              Edit Profile
            </button>

            <button
              onClick={() => handleSetScreen("report")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-md ${
                currentScreen === "report"
                  ? "bg-white text-apple-red"
                  : "bg-apple-green text-white hover:bg-emerald-600"
              }`}
            >
              <Icon name="add_circle" className="text-sm" />
              File Report
            </button>

            <button
              onClick={() => handleSetScreen("preferences")}
              className={`p-2 rounded-xl text-xs font-semibold transition-all ${
                currentScreen === "preferences"
                  ? "bg-white text-apple-blue shadow-md"
                  : "bg-white/15 text-white hover:bg-white/25"
              }`}
              title="System Preferences"
            >
              <Icon name="tune" className="text-base" />
            </button>
          </div>
        </div>
      </div>

      {/* setScreen Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200/60">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
          Screen UI:
        </span>
        {screenTabs.map((tab) => {
          const isActive = currentScreen === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSetScreen(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 border ${
                isActive
                  ? "bg-white text-apple-blue shadow-apple-card border-apple-blue/30 ring-2 ring-apple-blue/10"
                  : "bg-white/60 text-slate-600 hover:bg-white border-transparent hover:text-slate-900"
              }`}
            >
              <Icon name={tab.icon} className={`text-base ${isActive ? "text-apple-blue" : "text-slate-400"}`} />
              {tab.label}
              {tab.badge && (
                <span
                  className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? "bg-apple-blue/10 text-apple-blue" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ───────────────────────────────────────────────────────────────────────────
          SCREEN 1: OVERVIEW
         ─────────────────────────────────────────────────────────────────────────── */}
      {currentScreen === "overview" && (
        <div className="space-y-6 tab-fade-in">
          {/* Dynamic Interactive Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.id}
                onClick={stat.action}
                title={stat.tooltip}
                className="apple-glass-card rounded-2xl p-5 cursor-pointer hover:scale-[1.02] hover:shadow-apple-glow transition-all duration-300 border border-white group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`inline-flex p-2.5 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform`}>
                    <Icon name={stat.icon} className={`text-xl ${stat.color}`} />
                  </div>
                  <Icon name="arrow_forward" className="text-slate-300 group-hover:text-slate-600 text-sm transition-colors" />
                </div>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{stat.value}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
                  <span className="text-[10px] text-slate-400 font-medium">{stat.subtext}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Profile Details Cards */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Personal Details */}
            <div className="apple-glass rounded-2xl p-6 border border-white shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Icon name="person" className="text-lg text-apple-blue" />
                  <h3 className="text-sm font-bold text-slate-900">Personal Details</h3>
                </div>
                <button
                  onClick={() => handleSetScreen("edit")}
                  className="text-xs text-apple-blue font-semibold hover:underline flex items-center gap-1"
                >
                  <Icon name="edit" className="text-xs" /> Edit
                </button>
              </div>
              <div className="space-y-3.5">
                {[
                  { icon: "badge", label: "Full Name", value: profile.name },
                  { icon: "shield", label: "Rank", value: profile.rank },
                  { icon: "mail", label: "Email", value: profile.email },
                  { icon: "phone", label: "Phone", value: profile.phone },
                  { icon: "radar", label: "Callsign", value: profile.callsign },
                  { icon: "verified_user", label: "Clearance Level", value: profile.clearanceLevel },
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

            {/* Assignment & System Status */}
            <div className="apple-glass rounded-2xl p-6 border border-white shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Icon name="military_tech" className="text-lg text-apple-orange" />
                  <h3 className="text-sm font-bold text-slate-900">Assignment &amp; Status</h3>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-apple-green animate-pulse" />
                  Live Sync
                </span>
              </div>
              <div className="space-y-3.5">
                {[
                  { icon: "group", label: "Unit Designation", value: profile.unit },
                  { icon: "map", label: "Operating Sector", value: profile.sector },
                  { icon: "work", label: "Current Role", value: profile.role },
                  { icon: "calendar_today", label: "Member Since", value: new Date(profile.joinedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) },
                  { icon: "network_check", label: "Telemetry Latency", value: `${telemetry.pingMs} ms (${telemetry.throughput})` },
                  { icon: "memory", label: "System Memory", value: `${telemetry.memory}% utilized` },
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

          {/* Activity Preview Card */}
          <div className="apple-glass rounded-2xl p-6 border border-white shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Icon name="history" className="text-lg text-apple-indigo" />
                <h3 className="text-sm font-bold text-slate-900">Recent Activity Feed</h3>
              </div>
              <button
                onClick={() => handleSetScreen("activity")}
                className="text-xs font-semibold text-apple-blue hover:underline flex items-center gap-1"
              >
                View full audit log ({activities.length}) <Icon name="arrow_forward" className="text-xs" />
              </button>
            </div>
            <div className="space-y-2.5">
              {activities.slice(0, 4).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/60 hover:bg-white border border-slate-100 transition-all"
                >
                  <div className={`p-2 rounded-lg ${activity.bg} shrink-0`}>
                    <Icon name={activity.icon} className={`text-base ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-800 font-medium">{activity.action}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────
          SCREEN 2: EDIT PROFILE
         ─────────────────────────────────────────────────────────────────────────── */}
      {currentScreen === "edit" && (
        <div className="tab-fade-in apple-glass rounded-2xl p-6 lg:p-8 border border-white shadow-apple-card">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Icon name="edit" className="text-apple-blue" /> Edit Profile Information
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Update operational credentials, rank, callsign, and contact details.
              </p>
            </div>
            <button
              onClick={() => handleSetScreen("overview")}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg bg-slate-100"
            >
              Cancel
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { field: "name", label: "Full Name", icon: "badge", type: "text", placeholder: "e.g., Cmdr. A. Reid" },
              { field: "callsign", label: "Tactical Callsign", icon: "radar", type: "text", placeholder: "e.g., Sentinel-01" },
              { field: "rank", label: "Rank / Officer Title", icon: "shield", type: "text", placeholder: "e.g., Commander" },
              { field: "role", label: "Assigned Role", icon: "work", type: "text", placeholder: "e.g., Operations Lead" },
              { field: "email", label: "Email Address", icon: "mail", type: "email", placeholder: "name@aegisops.mil" },
              { field: "phone", label: "Contact Phone", icon: "phone", type: "tel", placeholder: "+91 98765 43210" },
              { field: "unit", label: "Unit Designation", icon: "group", type: "text", placeholder: "e.g., NER Corridor Command" },
              { field: "sector", label: "Operating Sector", icon: "map", type: "text", placeholder: "e.g., Sector 07" },
              { field: "clearanceLevel", label: "Security Clearance", icon: "verified_user", type: "text", placeholder: "e.g., Level 4 — Strategic" },
            ].map((input) => (
              <div key={input.field}>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
                  <Icon name={input.icon} className="text-sm text-slate-400" />
                  {input.label}
                </label>
                <input
                  type={input.type}
                  value={editForm[input.field as keyof typeof editForm] || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, [input.field]: e.target.value }))
                  }
                  placeholder={input.placeholder}
                  className="w-full bg-white/90 border border-slate-200/90 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 focus:border-apple-blue transition-all"
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
              {isSaving ? "Saving..." : "Save Profile Changes"}
            </button>
            <button
              onClick={() => handleSetScreen("overview")}
              className="px-6 py-3 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────
          SCREEN 3: PREFERENCES
         ─────────────────────────────────────────────────────────────────────────── */}
      {currentScreen === "preferences" && (
        <div className="tab-fade-in space-y-6">
          <div className="apple-glass rounded-2xl p-6 lg:p-8 border border-white shadow-apple-card">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Icon name="tune" className="text-apple-blue" /> System &amp; Notification Preferences
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Customize telemetry alerts, sound cues, auto-refresh intervals, and theme settings.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {[
                {
                  key: "notifications" as const,
                  label: "Push Notifications",
                  desc: "Receive immediate popup alerts for new hazard incidents and route closures",
                  icon: "notifications_active",
                },
                {
                  key: "soundAlerts" as const,
                  label: "Sound Cues & Audio Alerts",
                  desc: "Play sound notifications when critical severity events occur",
                  icon: "volume_up",
                },
                {
                  key: "autoRefresh" as const,
                  label: "Live Telemetry Auto-Refresh",
                  desc: "Automatically poll backend websocket for live convoy telemetry updates",
                  icon: "autorenew",
                },
                {
                  key: "darkMode" as const,
                  label: "Low-Light Dark Theme",
                  desc: "Optimize high-contrast HUD for tactical night operations",
                  icon: "dark_mode",
                },
              ].map((pref) => (
                <div
                  key={pref.key}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white/60 hover:bg-white border border-slate-100 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-xl bg-slate-100 shrink-0">
                      <Icon name={pref.icon} className="text-xl text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{pref.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{pref.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePreferenceToggle(pref.key)}
                    className={`relative w-13 h-7.5 w-12 h-7 rounded-full transition-all duration-300 shrink-0 ${
                      profile.preferences[pref.key] ? "bg-apple-green" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
                        profile.preferences[pref.key] ? "translate-x-[22px]" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Display & Map Settings */}
          <div className="apple-glass rounded-2xl p-6 lg:p-8 border border-white shadow-apple-card">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Icon name="settings" className="text-apple-purple" /> Display &amp; GIS Map Settings
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
                  <Icon name="refresh" className="text-sm text-slate-400" />
                  Telemetry Interval
                </label>
                <select
                  value={profile.preferences.telemetryInterval}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setProfile((prev) => ({
                      ...prev,
                      preferences: { ...prev.preferences, telemetryInterval: val },
                    }));
                    showToast(`Telemetry refresh rate set to ${val} seconds`);
                  }}
                  className="w-full bg-white/90 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-apple-blue/40"
                >
                  <option value={3}>3 seconds (Real-time)</option>
                  <option value={5}>5 seconds (Standard)</option>
                  <option value={10}>10 seconds (Eco mode)</option>
                  <option value={30}>30 seconds (Low bandwidth)</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
                  <Icon name="map" className="text-sm text-slate-400" />
                  GIS Map Style
                </label>
                <select
                  value={profile.preferences.mapStyle}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProfile((prev) => ({
                      ...prev,
                      preferences: { ...prev.preferences, mapStyle: val },
                    }));
                    showToast(`Map style changed to ${val}`);
                  }}
                  className="w-full bg-white/90 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-apple-blue/40"
                >
                  <option>Satellite Hybrid</option>
                  <option>Street Map</option>
                  <option>Terrain Elevation</option>
                  <option>Dark Mode GIS</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────
          SCREEN 4: FILE REPORT
         ─────────────────────────────────────────────────────────────────────────── */}
      {currentScreen === "report" && (
        <div className="tab-fade-in apple-glass rounded-2xl p-6 lg:p-8 border border-white shadow-apple-card">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Icon name="add_circle" className="text-apple-red" /> Submit Incident &amp; Hazard Report
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                File a real-time incident report with coordinates, photos, and severity rating.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
              Reporter: {profile.callsign}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
                <Icon name="location_on" className="text-sm text-apple-red" />
                Location Designation <span className="text-apple-red">*</span>
              </label>
              <input
                type="text"
                value={reportForm.location}
                onChange={(e) => setReportForm((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., NH-29 KM 142, Sela Pass Passway"
                className="w-full bg-white/90 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-apple-red/40 transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
                <Icon name="my_location" className="text-sm text-apple-blue" />
                GPS Coordinates
              </label>
              <input
                type="text"
                value={reportForm.coordinates}
                onChange={(e) => setReportForm((prev) => ({ ...prev, coordinates: e.target.value }))}
                placeholder="e.g., 27.329N 88.603E"
                className="w-full bg-white/90 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
                <Icon name="warning" className="text-sm text-apple-orange" />
                Hazard Type Category
              </label>
              <select
                value={reportForm.hazardType}
                onChange={(e) => setReportForm((prev) => ({ ...prev, hazardType: e.target.value }))}
                className="w-full bg-white/90 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-apple-orange/40 transition-all"
              >
                <option>Landslide</option>
                <option>Flash Flood</option>
                <option>Road Icing</option>
                <option>Rockfall</option>
                <option>Bridge Damage</option>
                <option>Vehicle Breakdown</option>
                <option>Weather Emergency</option>
                <option>Security Incident</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
                <Icon name="priority_high" className="text-sm text-apple-red" />
                Severity Rating
              </label>
              <div className="flex gap-2">
                {(["Low", "Moderate", "High", "Critical"] as const).map((level) => {
                  const isActive = reportForm.severity === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setReportForm((prev) => ({ ...prev, severity: level }))}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        isActive
                          ? level === "Critical"
                            ? "bg-red-500 text-white border-red-600 shadow-md"
                            : level === "High"
                            ? "bg-amber-500 text-white border-amber-600 shadow-md"
                            : level === "Moderate"
                            ? "bg-apple-blue text-white border-blue-600 shadow-md"
                            : "bg-slate-700 text-white border-slate-800 shadow-md"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
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
                Incident Description <span className="text-apple-red">*</span>
              </label>
              <textarea
                value={reportForm.description}
                onChange={(e) => setReportForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe current road conditions, debris scale, impact on convoy units, and requested detour..."
                rows={4}
                className="w-full bg-white/90 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 resize-none transition-all"
              />
            </div>
          </div>

          {/* Photo Drag & Drop Section */}
          <div className="mt-6">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
              <Icon name="photo_camera" className="text-sm text-apple-teal" />
              Attach Site Photos (Up to 5 images)
            </label>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files.length > 0) {
                  handlePhotosSelected(e.dataTransfer.files);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-apple-blue bg-blue-50/70 scale-[1.01]"
                  : "border-slate-200 bg-white/60 hover:border-apple-blue/50 hover:bg-blue-50/20"
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
                <Icon name="cloud_upload" className="text-3xl text-apple-blue" />
                <p className="text-xs font-semibold text-slate-700">
                  Drag &amp; drop photos here or <span className="text-apple-blue underline">browse</span>
                </p>
              </div>
            </div>

            {/* Photo Previews */}
            {uploadedPhotos.length > 0 && (
              <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-3">
                {uploadedPhotos.map((photo, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 group">
                    <img src={photo.preview} alt="Uploaded preview" className="w-full h-20 object-cover" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhoto(idx);
                      }}
                      className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Icon name="close" className="text-xs" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={handleSubmitReport}
              disabled={isSaving || !reportForm.location || !reportForm.description}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-apple-red text-white text-sm font-semibold hover:bg-red-600 transition-all shadow-md disabled:opacity-50"
            >
              <Icon name={isSaving ? "sync" : "send"} className={`text-base ${isSaving ? "animate-spin" : ""}`} />
              {isSaving ? "Submitting..." : "Submit Incident Report"}
            </button>
            <button
              onClick={() => handleSetScreen("overview")}
              className="px-6 py-3 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────
          SCREEN 5: ACTIVITY LOG & AUDIT HISTORY
         ─────────────────────────────────────────────────────────────────────────── */}
      {currentScreen === "activity" && (
        <div className="tab-fade-in apple-glass rounded-2xl p-6 lg:p-8 border border-white shadow-apple-card">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Icon name="history" className="text-apple-indigo" /> User Activity &amp; Audit Log
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Detailed timeline of user profile actions, incident reports, and tactical commands.
              </p>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              {["all", "incident", "route", "fleet", "security"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActivityFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    activityFilter === cat
                      ? "bg-white text-apple-blue shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredActivities.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No activity records match selected filter.</p>
            ) : (
              filteredActivities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/70 hover:bg-white border border-slate-100 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2.5 rounded-xl ${act.bg} shrink-0`}>
                      <Icon name={act.icon} className={`text-lg ${act.color}`} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{act.action}</p>
                      <span className="inline-block text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                        Category: {act.category}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 shrink-0">{act.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}
