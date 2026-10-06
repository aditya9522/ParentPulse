// apps/web/src/types/clinical.ts
export interface ClinicalPatient {
  id: string;
  family_id: string;
  full_name: string;
  gender: "male" | "female" | "other";
  age?: number;
  date_of_birth?: string;
  blood_group: string;
  phone_number: string;
  address: string;
  chronic_conditions: string[];
  allergies: string[];
  surgeries: { procedure_name: string; year?: number | string; hospital?: string }[];
  primary_doctors: { name: string; specialty: string; hospital_or_clinic?: string }[];
  emergency_contacts: { name: string; relation: string; phone_number: string }[];
  last_vital?: {
    type: string;
    value: number;
    value_secondary?: number;
    unit: string;
    recorded_at: string;
  };
  critical_alert?: string;
}

export interface VitalMeasurement {
  id: string;
  vital_type: "blood_pressure" | "heart_rate" | "blood_sugar" | "oxygen_saturation" | "temperature" | "weight";
  value_numeric: number;
  value_secondary?: number;
  unit: string;
  recorded_at: string;
  notes?: string;
}

export interface ClinicalMedicine {
  id: string;
  name: string;
  dosage: string;
  form: string;
  frequency_times_per_day: number;
  schedule_times: string[];
  instructions: string;
  start_date?: string;
  current_inventory?: number;
  refill_alert_threshold?: number;
  prescribing_doctor?: string;
  reason?: string;
}

export interface ClinicalTimelineItem {
  id: string;
  title: string;
  event_type: "doctor_visit" | "lab_test" | "medicine_started" | "surgery" | "diagnosis";
  description: string;
  event_date: string;
  doctor_name?: string;
  facility_name?: string;
}

export interface PrescriptionDraftItem {
  id: string;
  name: string;
  dosage: string;
  form: string;
  frequency: "OD" | "BD" | "TDS" | "QDS" | "PRN";
  meal_timing: "before_food" | "after_food" | "with_food";
  duration_days: number;
  instructions: string;
  computed_schedule: string[];
}

export interface DoctorAppointmentItem {
  id: string;
  parent_id?: string;
  patient_id?: string;
  patient_name: string;
  appointment_date: string;
  time_slot?: string;
  type?: "in_person" | "telehealth";
  status: "upcoming" | "scheduled" | "confirmed" | "completed" | "cancelled";
  reason: string;
  notes?: string;
  hospital_clinic_name?: string;
  telehealth_room_id?: string;
}
