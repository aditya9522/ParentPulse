// apps/web/src/components/doctor/DoctorRoster.tsx
import React, { useState } from "react";
import {
  Users,
  Search,
  Activity,
  Heart,
  Pill,
  ChevronRight,
  AlertCircle,
  FileSpreadsheet,
  Stethoscope,
  Phone,
  RefreshCw,
} from "lucide-react";
import { ClinicalPatient } from "../../types/clinical";
import { Badge } from "../common/Badge";

interface DoctorRosterProps {
  patients: ClinicalPatient[];
  onSelectPatient: (patientId: string) => void;
  onOpenPrescribe: (patientId: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const DoctorRoster: React.FC<DoctorRosterProps> = ({
  patients,
  onSelectPatient,
  onOpenPrescribe,
  onRefresh,
  isLoading,
}) => {
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");

  const filtered = patients.filter((p) => {
    const matchesSearch =
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.blood_group.toLowerCase().includes(search.toLowerCase()) ||
      (p.address && p.address.toLowerCase().includes(search.toLowerCase())) ||
      (p.chronic_conditions &&
        p.chronic_conditions.some((c) => c.toLowerCase().includes(search.toLowerCase())));

    if (!matchesSearch) return false;
    if (genderFilter !== "all" && p.gender !== genderFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
            Senior Patient Clinical Roster
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Care circles under your medical oversight. Monitored in real time via family pulse telemetry.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Sync Roster
          </button>
          <Badge variant="success" dot>
            {patients.length} Active Senior Patients
          </Badge>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 backdrop-blur-xl">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name, blood group, condition..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {(["all", "male", "female", "other"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGenderFilter(g)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold capitalize transition-all ${
                genderFilter === g
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((patient) => {
          const hasAlert = Boolean(patient.critical_alert);

          return (
            <div
              key={patient.id}
              className={`group relative rounded-2xl border p-5 backdrop-blur-xl transition-all hover:shadow-xl ${
                hasAlert
                  ? "border-amber-500/40 bg-slate-900/90 hover:border-amber-500/60"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
              }`}
            >
              {/* Header Info */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-base shadow-md shadow-emerald-600/20">
                    {patient.full_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {patient.full_name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {patient.age ? `Age ${patient.age}` : "Senior"} •{" "}
                      <span className="capitalize">{patient.gender}</span> •{" "}
                      <span className="font-mono text-emerald-400 font-semibold">
                        {patient.blood_group}
                      </span>
                    </p>
                  </div>
                </div>

                <Badge variant={patient.gender === "female" ? "purple" : "info"} size="sm">
                  {patient.gender}
                </Badge>
              </div>

              {/* Critical Alert Warning Strip */}
              {hasAlert && (
                <div className="mt-3 rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 flex items-center gap-2 text-xs text-amber-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                  <span className="line-clamp-1">{patient.critical_alert}</span>
                </div>
              )}

              {/* Latest Vital Signal */}
              <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-emerald-400" />
                    Latest Signal:
                  </span>
                  {patient.last_vital ? (
                    <span className="font-mono font-bold text-white">
                      {patient.last_vital.type === "blood_pressure"
                        ? `${patient.last_vital.value}/${patient.last_vital.value_secondary} ${patient.last_vital.unit}`
                        : `${patient.last_vital.value} ${patient.last_vital.unit}`}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">No recent vitals</span>
                  )}
                </div>
              </div>

              {/* Chronic Conditions Tag Cloud */}
              {patient.chronic_conditions && patient.chronic_conditions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {patient.chronic_conditions.slice(0, 2).map((c, idx) => (
                    <span
                      key={idx}
                      className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300"
                    >
                      {c}
                    </span>
                  ))}
                  {patient.chronic_conditions.length > 2 && (
                    <span className="rounded-md bg-slate-800/50 px-1.5 py-0.5 text-[10px] text-slate-400">
                      +{patient.chronic_conditions.length - 2}
                    </span>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                <button
                  onClick={() => onSelectPatient(patient.id)}
                  className="flex-1 rounded-xl bg-slate-800 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center gap-1"
                >
                  <Activity className="h-3.5 w-3.5" />
                  Clinical Chart
                </button>
                <button
                  onClick={() => onOpenPrescribe(patient.id)}
                  className="flex-1 rounded-xl bg-emerald-600/90 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-sm transition-all flex items-center justify-center gap-1"
                >
                  <Pill className="h-3.5 w-3.5" />
                  Prescribe Rx
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
