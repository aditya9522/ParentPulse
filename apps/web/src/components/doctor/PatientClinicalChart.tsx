// apps/web/src/components/doctor/PatientClinicalChart.tsx
import React, { useEffect, useState } from "react";
import {
  Activity,
  Heart,
  Pill,
  Clock,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  Stethoscope,
  Plus,
  RefreshCw,
  FileText,
  User,
  Shield,
} from "lucide-react";
import {
  ClinicalPatient,
  VitalMeasurement,
  ClinicalMedicine,
  ClinicalTimelineItem,
} from "../../types/clinical";
import { doctorService } from "../../services/doctorService";
import { Badge } from "../common/Badge";

interface PatientClinicalChartProps {
  patientId: string;
  onOpenPrescribe: (patientId: string) => void;
  onOpenAddMilestone: (patientId: string) => void;
  onBackToRoster: () => void;
}

export const PatientClinicalChart: React.FC<PatientClinicalChartProps> = ({
  patientId,
  onOpenPrescribe,
  onOpenAddMilestone,
  onBackToRoster,
}) => {
  const [data, setData] = useState<{
    patient: ClinicalPatient;
    active_medicines: ClinicalMedicine[];
    recent_vitals: VitalMeasurement[];
    timeline_events: ClinicalTimelineItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChart = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await doctorService.getPatientChart(patientId);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load patient clinical chart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChart();
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin opacity-80" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-8 text-center">
        <AlertTriangle className="h-10 w-10 text-rose-400 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-white">Error Loading Chart</h3>
        <p className="text-xs text-rose-300 mt-1">{error}</p>
        <button
          onClick={fetchChart}
          className="mt-4 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const { patient, active_medicines, recent_vitals, timeline_events } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={onBackToRoster}
            className="text-xs font-semibold text-slate-400 hover:text-emerald-400 flex items-center gap-1 mb-2 transition-colors"
          >
            ← Back to Patient Roster
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
              {patient.full_name}
            </h1>
            <Badge variant="success" size="sm">
              {patient.age ? `Age ${patient.age}` : "Senior"}
            </Badge>
            <Badge variant="neutral" size="sm" className="font-mono">
              Blood: {patient.blood_group}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenAddMilestone(patient.id)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Clinical Milestone
          </button>
          <button
            onClick={() => onOpenPrescribe(patient.id)}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
          >
            <Pill className="h-4 w-4" />
            Author Digital Prescription
          </button>
        </div>
      </div>

      {/* Demographics & Emergency Summary Strip */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Residence & Contact
          </span>
          <p className="text-xs text-white mt-1 flex items-start gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
            {patient.address || "Address not specified"}
          </p>
          <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            {patient.phone_number || "No contact phone"}
          </p>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Chronic Conditions
          </span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {patient.chronic_conditions && patient.chronic_conditions.length > 0 ? (
              patient.chronic_conditions.map((c, idx) => (
                <span
                  key={idx}
                  className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-200 border border-slate-700"
                >
                  {c}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">None registered</span>
            )}
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Allergies & Surgeries
          </span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {patient.allergies && patient.allergies.length > 0 ? (
              patient.allergies.map((a, idx) => (
                <span
                  key={idx}
                  className="rounded-md bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-xs font-semibold text-rose-300"
                >
                  ⚠ {a}
                </span>
              ))
            ) : (
              <span className="text-xs text-emerald-400 font-medium">No known drug allergies</span>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Active Medicines & Vital History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Active Medicines & Schedule Slots */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Pill className="h-4 w-4 text-emerald-400" />
                Active Medication Regimen
              </h2>
              <p className="text-xs text-slate-400">
                Synchronized with the senior's daily mobile app dose tracker.
              </p>
            </div>
            <Badge variant="purple" size="sm">
              {active_medicines.length} Prescribed
            </Badge>
          </div>

          {active_medicines.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No active medications recorded for this patient.
            </div>
          ) : (
            <div className="space-y-3">
              {active_medicines.map((med) => (
                <div
                  key={med.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-white">{med.name}</h4>
                      <p className="text-xs text-emerald-400 font-mono mt-0.5">
                        {med.dosage} • {med.form} • {med.instructions.replace("_", " ")}
                      </p>
                      {med.reason && (
                        <p className="text-[11px] text-slate-400 mt-1">Indication: {med.reason}</p>
                      )}
                    </div>
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                      Stock: {med.current_inventory ?? 0} doses
                    </span>
                  </div>

                  {/* Scheduled Slots Pill Row */}
                  {med.schedule_times && med.schedule_times.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-2 pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        Dose Times:
                      </span>
                      {med.schedule_times.map((time, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300"
                        >
                          {time}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Recent Vitals Table & Stream */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-sky-400" />
                Vitals & Clinical Measurements
              </h2>
              <p className="text-xs text-slate-400">
                Recorded via connected devices and caregiver manual logs.
              </p>
            </div>
            <Badge variant="info" size="sm">
              {recent_vitals.length} Readings
            </Badge>
          </div>

          {recent_vitals.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No recent vital measurements recorded.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {recent_vitals.map((v) => (
                <div
                  key={v.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 font-bold">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white capitalize block">
                        {v.vital_type.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(v.recorded_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-white font-mono block">
                      {v.value_secondary
                        ? `${v.value_numeric}/${v.value_secondary}`
                        : v.value_numeric}{" "}
                      <span className="text-xs font-normal text-slate-400">{v.unit}</span>
                    </span>
                    {v.notes && <span className="text-[10px] text-slate-400">{v.notes}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Clinical Timeline Events */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-400" />
              Clinical Timeline & Milestones
            </h2>
            <p className="text-xs text-slate-400">
              Chronological log of consultations, hospital procedures, and diagnostic results.
            </p>
          </div>
          <button
            onClick={() => onOpenAddMilestone(patient.id)}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            + Add Milestone
          </button>
        </div>

        {timeline_events.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No clinical timeline events recorded.
          </div>
        ) : (
          <div className="space-y-3">
            {timeline_events.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{t.title}</span>
                      <Badge variant="purple" size="sm">
                        {t.event_type.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 whitespace-pre-line leading-relaxed">
                      {t.description}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-400">
                      <span>{new Date(t.event_date).toLocaleDateString()}</span>
                      {t.doctor_name && <span>• Dr. {t.doctor_name}</span>}
                      {t.facility_name && <span>• {t.facility_name}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
