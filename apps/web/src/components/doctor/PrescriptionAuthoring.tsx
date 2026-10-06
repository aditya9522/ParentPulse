// apps/web/src/components/doctor/PrescriptionAuthoring.tsx
import React, { useState } from "react";
import {
  Pill,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  Send,
  Printer,
  Sparkles,
  AlertCircle,
  FileText,
  User,
} from "lucide-react";
import { ClinicalPatient, PrescriptionDraftItem } from "../../types/clinical";
import { doctorService } from "../../services/doctorService";
import { Badge } from "../common/Badge";

interface PrescriptionAuthoringProps {
  patients: ClinicalPatient[];
  initialPatientId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const COMMON_DRUGS = [
  { name: "Telmisartan", dosage: "40 mg", form: "Tablet", freq: "OD", meal: "after_food" },
  { name: "Metformin (Glycomet SR)", dosage: "500 mg", form: "Tablet", freq: "BD", meal: "with_food" },
  { name: "Atorvastatin (Atorva)", dosage: "10 mg", form: "Tablet", freq: "OD", meal: "after_food" },
  { name: "Amlodipine (Amlong)", dosage: "5 mg", form: "Tablet", freq: "OD", meal: "after_food" },
  { name: "Pantoprazole (Pan 40)", dosage: "40 mg", form: "Tablet", freq: "OD", meal: "before_food" },
  { name: "Shelcal 500 (Calcium + D3)", dosage: "500 mg", form: "Tablet", freq: "OD", meal: "after_food" },
];

export const PrescriptionAuthoring: React.FC<PrescriptionAuthoringProps> = ({
  patients,
  initialPatientId,
  onSuccess,
  onCancel,
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    initialPatientId || (patients[0]?.id ?? "")
  );
  const [diagnosis, setDiagnosis] = useState("Hypertension & Glycemic Optimization");
  const [doctorName, setDoctorName] = useState("Dr. Rajesh Sharma");
  const [facilityName, setFacilityName] = useState("Max Super Speciality Hospital, Saket");
  const [clinicalNotes, setClinicalNotes] = useState(
    "Advised low sodium diet (<2g/day). 20 mins light walk daily. Blood pressure monitoring twice a week."
  );

  const [medications, setMedications] = useState<PrescriptionDraftItem[]>([
    {
      id: "draft-1",
      name: "Telmisartan",
      dosage: "40 mg",
      form: "Tablet",
      frequency: "OD",
      meal_timing: "after_food",
      duration_days: 30,
      instructions: "Take every morning post-breakfast",
      computed_schedule: ["08:00"],
    },
    {
      id: "draft-2",
      name: "Metformin (Glycomet SR)",
      dosage: "500 mg",
      form: "Tablet",
      frequency: "BD",
      meal_timing: "with_food",
      duration_days: 30,
      instructions: "Take with breakfast and dinner",
      computed_schedule: ["08:00", "20:00"],
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<{
    prescriptionId: string;
    message: string;
  } | null>(null);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const computeSchedule = (freq: PrescriptionDraftItem["frequency"]): string[] => {
    switch (freq) {
      case "OD":
        return ["08:00"];
      case "BD":
        return ["08:00", "20:00"];
      case "TDS":
        return ["08:00", "14:00", "20:00"];
      case "QDS":
        return ["08:00", "12:00", "16:00", "20:00"];
      case "PRN":
        return ["08:00"];
      default:
        return ["08:00"];
    }
  };

  const handleAddMedication = (preset?: typeof COMMON_DRUGS[0]) => {
    const newMed: PrescriptionDraftItem = {
      id: `draft-${Date.now()}`,
      name: preset?.name || "",
      dosage: preset?.dosage || "10 mg",
      form: preset?.form || "Tablet",
      frequency: (preset?.freq as any) || "OD",
      meal_timing: (preset?.meal as any) || "after_food",
      duration_days: 30,
      instructions: "As directed by physician",
      computed_schedule: computeSchedule((preset?.freq as any) || "OD"),
    };
    setMedications([...medications, newMed]);
  };

  const handleRemoveMedication = (id: string) => {
    setMedications(medications.filter((m) => m.id !== id));
  };

  const handleUpdateMed = (id: string, updates: Partial<PrescriptionDraftItem>) => {
    setMedications(
      medications.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m, ...updates };
        if (updates.frequency) {
          updated.computed_schedule = computeSchedule(updates.frequency);
        }
        return updated;
      })
    );
  };

  const handleSubmit = async () => {
    if (!selectedPatientId) {
      alert("Please select a senior patient.");
      return;
    }
    if (!diagnosis.trim()) {
      alert("Please enter a clinical diagnosis or reason.");
      return;
    }
    if (medications.length === 0) {
      alert("Please add at least one medication to prescribe.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await doctorService.createPrescription({
        patient_id: selectedPatientId,
        diagnosis,
        doctor_name: doctorName,
        facility_name: facilityName,
        notes: clinicalNotes,
        medications,
      });

      setSuccessResult({
        prescriptionId: res.prescription_id,
        message: res.message,
      });

      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      }
    } catch (err: any) {
      alert(`Error submitting prescription: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (successResult) {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/20 p-8 text-center backdrop-blur-xl animate-in zoom-in-95">
        <CheckCircle2 className="h-14 w-14 text-emerald-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white">Prescription Successfully Authorized!</h2>
        <p className="text-xs text-emerald-300 mt-2 max-w-md mx-auto">
          {successResult.message}
        </p>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Ref ID: {successResult.prescriptionId}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => window.print()}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 flex items-center gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Rx Slip
          </button>
          <button
            onClick={() => {
              setSuccessResult(null);
              if (onCancel) onCancel();
            }}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
          >
            Back to Clinical Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
            Digital Prescription Authoring & Auto-Schedule Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Author medicines with automatic dose slot calculation and direct sync into the senior's Care Hub.
          </p>
        </div>
        <Badge variant="purple">
          <Sparkles className="h-3 w-3 mr-1" />
          Auto Schedule Time Generation Active
        </Badge>
      </div>

      {/* Patient Selection & Clinical Information */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Select Senior Patient *
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.age ? `Age ${p.age}` : "Senior"}, {p.blood_group})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Clinical Diagnosis / Indication *
            </label>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Essential Hypertension & Diabetic Glycemic Control"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Prescribing Physician
            </label>
            <input
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Hospital / Clinic Facility
            </label>
            <input
              type="text"
              value={facilityName}
              onChange={(e) => setFacilityName(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Quick Add Preset Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
        <span className="text-xs font-bold text-slate-400 block mb-2">
          Quick Preset Medications (Click to Add):
        </span>
        <div className="flex flex-wrap gap-2">
          {COMMON_DRUGS.map((d, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAddMedication(d)}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-emerald-600 hover:border-emerald-500 hover:text-white transition-all flex items-center gap-1.5"
            >
              <Plus className="h-3 w-3" />
              {d.name} ({d.dosage})
            </button>
          ))}
        </div>
      </div>

      {/* Medications Draft Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Pill className="h-4 w-4 text-emerald-400" />
              Prescribed Medications List ({medications.length})
            </h3>
            <p className="text-xs text-slate-400">
              Each medication automatically calculates mobile intake reminders based on frequency.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleAddMedication()}
            className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Custom Drug
          </button>
        </div>

        <div className="space-y-3">
          {medications.map((item, index) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-4">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Drug Name & Brand *
                  </label>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleUpdateMed(item.id, { name: e.target.value })}
                    placeholder="e.g. Telmisartan"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    value={item.dosage}
                    onChange={(e) => handleUpdateMed(item.id, { dosage: e.target.value })}
                    placeholder="e.g. 40 mg"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Frequency
                  </label>
                  <select
                    value={item.frequency}
                    onChange={(e) =>
                      handleUpdateMed(item.id, { frequency: e.target.value as any })
                    }
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="OD">OD (Once Daily)</option>
                    <option value="BD">BD (Twice Daily)</option>
                    <option value="TDS">TDS (Thrice Daily)</option>
                    <option value="QDS">QDS (4x Daily)</option>
                    <option value="PRN">PRN (As Needed)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Meal Timing
                  </label>
                  <select
                    value={item.meal_timing}
                    onChange={(e) =>
                      handleUpdateMed(item.id, { meal_timing: e.target.value as any })
                    }
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="after_food">After Food</option>
                    <option value="before_food">Before Food</option>
                    <option value="with_food">With Food</option>
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Days
                  </label>
                  <input
                    type="number"
                    value={item.duration_days}
                    onChange={(e) =>
                      handleUpdateMed(item.id, {
                        duration_days: parseInt(e.target.value) || 30,
                      })
                    }
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveMedication(item.id)}
                    className="rounded-lg p-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Computed Schedule Slots Bar */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-emerald-400" />
                  Auto-Generated Dose Schedule Slots:
                </span>
                <div className="flex items-center gap-1.5">
                  {item.computed_schedule.map((slot, sIdx) => (
                    <span
                      key={sIdx}
                      className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300"
                    >
                      {slot}
                    </span>
                  ))}
                </div>
                <span className="text-[11px] text-slate-400 ml-auto font-mono">
                  Total doses provisioned: {item.duration_days * item.computed_schedule.length} units
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clinical Notes & Authorize Footer */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">
            Clinical Instructions & Lifestyle Advice for Family Care Circle
          </label>
          <textarea
            rows={3}
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            placeholder="Dietary instructions, exercise recommendations, follow-up schedule..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <span className="text-xs text-slate-400">
            Authorization digitally signs and pushes live schedules into the patient's Care Circle.
          </span>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full sm:w-auto rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Authorizing & Syncing..." : "Authorize & Sync to Care Circle"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
