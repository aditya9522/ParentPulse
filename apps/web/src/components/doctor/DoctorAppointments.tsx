// apps/web/src/components/doctor/DoctorAppointments.tsx
import React, { useState } from "react";
import { Calendar, Clock, User, CheckCircle2, XCircle, RefreshCw, Video } from "lucide-react";
import { DoctorAppointmentItem } from "../../types/clinical";
import { Badge } from "../common/Badge";

interface DoctorAppointmentsProps {
  appointments: DoctorAppointmentItem[];
  onUpdateStatus: (id: string, status: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const DoctorAppointments: React.FC<DoctorAppointmentsProps> = ({
  appointments,
  onUpdateStatus,
  onRefresh,
  isLoading,
}) => {
  const [filter, setFilter] = useState<string>("all");

  const filtered = appointments.filter((a) => {
    if (filter !== "all" && a.status !== filter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
            Patient Consultations & Telehealth Schedule
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Scheduled in-person and remote video clinical sessions with senior patients.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Badge variant="purple">
            {appointments.length} Consultations Scheduled
          </Badge>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {["all", "upcoming", "confirmed", "completed"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`rounded-xl px-4 py-1.5 text-xs font-semibold capitalize transition-all ${
              filter === tab
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center backdrop-blur-xl">
          <Calendar className="h-10 w-10 text-emerald-400 mx-auto mb-3 opacity-80" />
          <h3 className="text-sm font-bold text-white">No Consultations Found</h3>
          <p className="text-xs text-slate-400 mt-1">
            No appointments match the selected filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((apt) => {
            const isUpcoming = apt.status === "upcoming" || apt.status === "confirmed";

            return (
              <div
                key={apt.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{apt.patient_name}</h3>
                      <Badge
                        variant={apt.status === "completed" ? "success" : "warning"}
                        size="sm"
                      >
                        {apt.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 font-medium">{apt.reason}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-mono text-emerald-400">
                        <Clock className="h-3 w-3" />
                        {new Date(apt.appointment_date).toLocaleString()}
                      </span>
                      <span>•</span>
                      <span>{apt.hospital_clinic_name || "Clinic"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isUpcoming && (
                    <button
                      onClick={() => onUpdateStatus(apt.id, "completed")}
                      className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-all flex items-center gap-1"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Mark Completed
                    </button>
                  )}
                  {apt.status !== "cancelled" && (
                    <button
                      onClick={() => onUpdateStatus(apt.id, "cancelled")}
                      className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
