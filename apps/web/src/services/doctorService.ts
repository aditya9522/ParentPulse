// apps/web/src/services/doctorService.ts
import {
  ClinicalPatient,
  VitalMeasurement,
  ClinicalMedicine,
  ClinicalTimelineItem,
  PrescriptionDraftItem,
  DoctorAppointmentItem,
} from "../types/clinical";
import { apiFetch } from "./apiClient";

export const doctorService = {
  async getPatients(): Promise<ClinicalPatient[]> {
    return await apiFetch<ClinicalPatient[]>("/doctors/portal/patients");
  },

  async getPatientChart(patientId: string): Promise<{
    patient: ClinicalPatient;
    active_medicines: ClinicalMedicine[];
    recent_vitals: VitalMeasurement[];
    timeline_events: ClinicalTimelineItem[];
  }> {
    return await apiFetch<{
      patient: ClinicalPatient;
      active_medicines: ClinicalMedicine[];
      recent_vitals: VitalMeasurement[];
      timeline_events: ClinicalTimelineItem[];
    }>(`/doctors/portal/patients/${patientId}`);
  },

  async createPrescription(payload: {
    patient_id: string;
    diagnosis: string;
    doctor_name: string;
    facility_name: string;
    notes?: string;
    medications: PrescriptionDraftItem[];
  }): Promise<{ prescription_id: string; message: string; medications_created: number }> {
    return await apiFetch<any>("/doctors/portal/prescriptions", {
      method: "POST",
      body: JSON.stringify({
        parent_id: payload.patient_id,
        diagnosis: payload.diagnosis,
        doctor_name: payload.doctor_name,
        facility_name: payload.facility_name,
        notes: payload.notes,
        medications: payload.medications.map((m) => ({
          name: m.name,
          dosage: m.dosage,
          form: m.form,
          frequency: m.frequency,
          meal_timing: m.meal_timing,
          duration_days: m.duration_days,
          instructions: m.instructions,
        })),
      }),
    });
  },

  async addClinicalMilestone(payload: {
    parent_id: string;
    title: string;
    event_type: string;
    description: string;
    doctor_name: string;
    facility_name: string;
  }): Promise<any> {
    return await apiFetch<any>("/doctors/portal/milestones", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getAppointments(): Promise<DoctorAppointmentItem[]> {
    return await apiFetch<DoctorAppointmentItem[]>("/doctors/portal/appointments");
  },

  async updateAppointmentStatus(
    appointmentId: string,
    status: string
  ): Promise<any> {
    return await apiFetch<any>(
      `/doctors/portal/appointments/${appointmentId}/status?status=${status}`,
      { method: "PATCH" }
    );
  },
};
