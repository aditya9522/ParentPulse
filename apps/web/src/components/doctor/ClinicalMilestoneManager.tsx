// apps/web/src/components/doctor/ClinicalMilestoneManager.tsx
import React, { useState } from "react";
import { ClipboardList, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { ClinicalPatient } from "../../types/clinical";
import { doctorService } from "../../services/doctorService";
import { Badge } from "../common/Badge";

interface ClinicalMilestoneManagerProps {
  patients: ClinicalPatient[];
  initialPatientId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ClinicalMilestoneManager: React.FC<ClinicalMilestoneManagerProps> = ({
  patients,
  initialPatientId,
  onSuccess,
  onCancel,
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    initialPatientId || (patients[0]?.id ?? "")
  );
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("doctor_visit");
  const [description, setDescription] = useState("");
  const [doctorName, setDoctorName] = useState("Dr. Rajesh Sharma");
  const [facilityName, setFacilityName] = useState("Max Super Speciality Hospital, Saket");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !title.trim() || !description.trim()) {
      alert("Please fill in patient, title, and description.");
      return;
    }

    try {
      setSubmitting(true);
      await doctorService.addClinicalMilestone({
        parent_id: selectedPatientId,
        title: title.trim(),
        event_type: eventType,
        description: description.trim(),
        doctor_name: doctorName.trim(),
        facility_name: facilityName.trim(),
      });

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err: any) {
      alert(`Failed to save milestone: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-8 text-center backdrop-blur-xl">
        <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-2" />
        <h3 className="text-base font-bold text-white">Clinical Milestone Recorded</h3>
        <p className="text-xs text-slate-300 mt-1">
          Milestone has been logged into the patient's chronological timeline.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
          Record Clinical Milestone
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Document formal clinical evaluations, lab interpretations, and surgical notes into the patient's care timeline.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Select Patient *
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.blood_group})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Milestone Category *
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="doctor_visit">Doctor Consultation</option>
              <option value="lab_test">Lab / Diagnostic Evaluation</option>
              <option value="medicine_started">Medication Modification</option>
              <option value="surgery">Surgery / Procedure</option>
              <option value="diagnosis">Clinical Diagnosis / Finding</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">
            Milestone Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Cardiometabolic Risk Evaluation & Lipid Review"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">
            Clinical Summary & Observations *
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Document clinical diagnosis findings, lab values interpreted, or surgical progress..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Physician Name
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
              Hospital / Clinic
            </label>
            <input
              type="text"
              value={facilityName}
              onChange={(e) => setFacilityName(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-purple-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-purple-500 shadow-lg shadow-purple-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Saving Milestone..." : "Record Milestone in Timeline"}
          </button>
        </div>
      </form>
    </div>
  );
};
