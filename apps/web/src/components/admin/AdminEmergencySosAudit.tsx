// apps/web/src/components/admin/AdminEmergencySosAudit.tsx
import React, { useState } from "react";
import {
  ShieldAlert,
  MapPin,
  ExternalLink,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { AdminSosEvent } from "../../types/admin";
import { Badge } from "../common/Badge";

interface AdminEmergencySosAuditProps {
  events: AdminSosEvent[];
  onRefresh: () => void;
  isLoading?: boolean;
}

export const AdminEmergencySosAudit: React.FC<AdminEmergencySosAuditProps> = ({
  events,
  onRefresh,
  isLoading,
}) => {
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");

  const filtered = events.filter((e) => {
    if (filter === "active") return e.status === "active";
    if (filter === "resolved") return e.status === "resolved";
    return true;
  });

  const activeCount = events.filter((e) => e.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
            Emergency SOS & Dispatch Telemetry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time critical triggers, panic buttons, wearable fall notifications, and ambulance dispatch trails.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Telemetry
          </button>
          <Badge variant={activeCount > 0 ? "danger" : "success"} dot>
            {activeCount > 0 ? `${activeCount} Active Emergencies` : "All Circles Safe"}
          </Badge>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(["all", "active", "resolved"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`rounded-xl px-4 py-1.5 text-xs font-semibold capitalize transition-all ${
              filter === tab
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Events List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center backdrop-blur-xl">
          <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3 opacity-80" />
          <h3 className="text-sm font-bold text-white">No SOS Incidents</h3>
          <p className="text-xs text-slate-400 mt-1">
            No emergency alerts matching this criteria have been recorded.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((sos) => {
            const isUrgent = sos.status === "active";
            const mapUrl =
              sos.latitude && sos.longitude
                ? `https://www.google.com/maps?q=${sos.latitude},${sos.longitude}`
                : null;

            return (
              <div
                key={sos.id}
                className={`rounded-2xl border p-5 backdrop-blur-xl transition-all ${
                  isUrgent
                    ? "border-rose-500/50 bg-rose-950/20 shadow-lg shadow-rose-950/30"
                    : "border-slate-800 bg-slate-900/60"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                        isUrgent
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      <ShieldAlert className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          Incident #{sos.id.slice(0, 8)}
                        </span>
                        <Badge
                          variant={isUrgent ? "danger" : "neutral"}
                          size="sm"
                          dot={isUrgent}
                        >
                          {isUrgent ? "ACTIVE EMERGENCY" : "RESOLVED"}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {new Date(sos.created_at).toLocaleString()}
                        </span>
                        <span>•</span>
                        <span>Parent ID: {sos.parent_id.slice(0, 8)}...</span>
                      </p>
                    </div>
                  </div>

                  {mapUrl && (
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-sky-400 hover:bg-slate-700 hover:text-sky-300 transition-colors w-fit"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      View GPS Location
                      <ExternalLink className="h-3 w-3 ml-0.5 opacity-70" />
                    </a>
                  )}
                </div>

                {sos.message && (
                  <div className="mt-3 rounded-xl bg-slate-950/60 p-3 border border-slate-800 text-xs text-slate-200">
                    <span className="font-semibold text-rose-400 mr-1.5">Alert Dispatch Note:</span>
                    {sos.message}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
