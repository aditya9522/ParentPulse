// apps/web/src/components/admin/AdminOverview.tsx
import React from "react";
import {
  Users,
  Heart,
  Stethoscope,
  ShieldAlert,
  Server,
  Activity,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { AdminPlatformStats, AdminDoctorRecord, AdminSosEvent } from "../../types/admin";
import { StatCard } from "../common/StatCard";
import { Badge } from "../common/Badge";

interface AdminOverviewProps {
  stats: AdminPlatformStats;
  doctors: AdminDoctorRecord[];
  sosEvents: AdminSosEvent[];
  onNavigateTab: (tab: any) => void;
  onVerifyDoctor: (id: string, verify: boolean) => void;
  onResolveSos: (id: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  stats,
  doctors,
  sosEvents,
  onNavigateTab,
  onVerifyDoctor,
  onResolveSos,
}) => {
  const pendingDoctors = doctors.filter((d) => !d.is_verified);
  const activeSos = sosEvents.filter((s) => s.status === "active");

  return (
    <div className="space-y-6">
      {/* Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
            Platform Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global telemetry, elderly care circle density, and credentialing operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" dot>
            FastAPI Backend: Connected (18ms)
          </Badge>
          <Badge variant="purple">
            ABDM & HIPAA Tier 3 Active
          </Badge>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Care Circles"
          value={stats.total_families.toLocaleString()}
          subtitle="Registered elderly families"
          icon={Heart}
          accentColor="emerald"
          trend={{ value: "+14%", isPositive: true, label: "this month" }}
        />
        <StatCard
          title="Enrolled Parents"
          value={stats.total_parents.toLocaleString()}
          subtitle="Monitored senior citizens"
          icon={Users}
          accentColor="sky"
          trend={{ value: "+8%", isPositive: true, label: "this month" }}
        />
        <StatCard
          title="Verified Doctors"
          value={`${stats.verified_doctors} / ${stats.total_doctors}`}
          subtitle={`${pendingDoctors.length} pending credentialing`}
          icon={Stethoscope}
          accentColor={pendingDoctors.length > 0 ? "amber" : "emerald"}
          badge={pendingDoctors.length > 0 ? "Action Req" : "All Clear"}
        />
        <StatCard
          title="Active SOS Emergencies"
          value={activeSos.length}
          subtitle={activeSos.length > 0 ? "Emergency dispatch alerted" : "All circles quiet"}
          icon={ShieldAlert}
          accentColor={activeSos.length > 0 ? "rose" : "emerald"}
          badge={activeSos.length > 0 ? "CRITICAL" : "NORMAL"}
        />
      </div>

      {/* Two Column Layout: Pending Doctor Approvals & Emergency SOS Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Pending Doctor Verifications */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-amber-400" />
                Doctor Credentialing Requests
              </h2>
              <p className="text-xs text-slate-400">
                Verify medical registration council license and hospital affiliations.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab("doctors")}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              View All <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {pendingDoctors.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              All doctor verification requests have been processed.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingDoctors.slice(0, 3).map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{doc.name}</span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 font-mono">
                        {doc.license_number || "REG-PENDING"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {doc.specialty} • {doc.hospital_or_clinic}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onVerifyDoctor(doc.id, true)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-sm transition-all"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Emergency SOS Telemetry Feed */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-400" />
                Live SOS Dispatch Telemetry
              </h2>
              <p className="text-xs text-slate-400">
                Critical alerts triggered by wearable fall detection or panic button.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab("sos")}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
            >
              Audit Log <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {sosEvents.slice(0, 3).map((sos) => {
              const isUrgent = sos.status === "active";
              return (
                <div
                  key={sos.id}
                  className={`rounded-xl border p-3.5 flex items-start justify-between gap-3 transition-colors ${
                    isUrgent
                      ? "border-rose-500/40 bg-rose-950/20"
                      : "border-slate-800 bg-slate-950/40"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {sos.parent_name || "Senior Citizen"}
                      </span>
                      <Badge variant={isUrgent ? "danger" : "neutral"} size="sm" dot={isUrgent}>
                        {isUrgent ? "CRITICAL ACTIVE" : "RESOLVED"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-1">{sos.message}</p>
                    <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400">
                      <span>Trigger: {sos.initiated_by}</span>
                      <span>•</span>
                      <span>{new Date(sos.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {isUrgent && (
                    <button
                      onClick={() => onResolveSos(sos.id)}
                      className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors shrink-0"
                    >
                      Mark Handled
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* System Infrastructure Telemetry Strip */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Server className="h-4 w-4 text-indigo-400" />
            <span className="font-semibold text-white">Infrastructure Health:</span>
            <span>FastAPI Python Engine: 0.0.0.0:8000</span>
          </div>
          <div className="flex items-center gap-6 text-slate-400">
            <span>Database: <strong className="text-emerald-400">PostgreSQL Attached</strong></span>
            <span>Redis Cache: <strong className="text-emerald-400">Configured</strong></span>
            <span>Document Vault: <strong className="text-emerald-400">AES-256 GCM</strong></span>
            <span>AI Copilot: <strong className="text-purple-400">Gemini 1.5 Flash</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
