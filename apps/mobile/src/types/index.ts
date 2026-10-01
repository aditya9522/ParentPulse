// apps/mobile/src/types/index.ts

export type UserRole = "parent" | "family_member" | "caregiver" | "doctor" | "admin";

export type DocumentType =
  | "prescription"
  | "lab_report"
  | "radiology"
  | "discharge_summary"
  | "vaccination"
  | "insurance"
  | "hospital_bill"
  | "other";

export type TimelineEventType =
  | "doctor_visit"
  | "diagnosis"
  | "medicine_started"
  | "medicine_changed"
  | "medicine_stopped"
  | "lab_test"
  | "surgery"
  | "hospitalization"
  | "vaccination"
  | "follow_up";

export type DoseStatus = "scheduled" | "taken" | "missed" | "skipped";

export type VitalType =
  | "blood_pressure"
  | "blood_sugar"
  | "heart_rate"
  | "weight"
  | "temperature"
  | "oxygen_saturation";

export type PlaceCategory = "doctor" | "clinic" | "hospital" | "pharmacy" | "laboratory" | "emergency";

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone_number: string;
  is_primary: boolean;
}

export interface PrimaryDoctor {
  name: string;
  specialty: string;
  hospital_or_clinic: string;
  phone_number: string;
  address?: string;
}

export interface ParentProfile {
  id: string;
  family_id: string;
  full_name: string;
  date_of_birth: string;
  gender: "male" | "female" | "other";
  blood_group: string;
  preferred_language: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone_number: string;
  allergies: string[];
  chronic_conditions: string[];
  disabilities?: string[];
  surgeries: { name: string; date?: string; notes?: string }[];
  emergency_contacts: EmergencyContact[];
  primary_doctors: PrimaryDoctor[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MedicalDocument {
  id: string;
  parent_id: string;
  title: string;
  document_type: DocumentType;
  file_url: string;
  document_date: string;
  status: "pending" | "processing" | "extracted" | "failed";
  doctor_name?: string;
  hospital_name?: string;
  summary?: string;
  extracted_tags: string[];
  extracted_fields?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface TimelineEvent {
  id: string;
  parent_id: string;
  title: string;
  description: string;
  event_type: TimelineEventType;
  event_date: string;
  doctor_name?: string;
  facility_name?: string;
  document_id?: string;
}

export interface MedicineSchedule {
  id: string;
  parent_id: string;
  name: string;
  dosage: string;
  form: string;
  frequency_times_per_day: number;
  schedule_times: string[];
  instructions: "before_food" | "after_food" | "with_food" | "empty_stomach" | "as_needed";
  prescribing_doctor?: string;
  reason?: string;
  start_date: string;
  current_inventory: number;
  refill_alert_threshold: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MedicineDoseLog {
  id: string;
  medicine_id: string;
  parent_id?: string;
  scheduled_time: string;
  status: DoseStatus;
  recorded_at?: string;
}

export interface Appointment {
  id: string;
  parent_id: string;
  doctor_name: string;
  specialty: string;
  hospital_clinic_name: string;
  appointment_date: string;
  status: "upcoming" | "completed" | "cancelled" | "rescheduled";
  reason?: string;
  notes?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  google_place_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HealthMeasurement {
  id: string;
  parent_id: string;
  vital_type: VitalType;
  value_numeric: number;
  value_secondary?: number;
  unit: string;
  recorded_at: string;
  notes?: string;
}

export interface HealthcarePlace {
  place_id: string;
  name: string;
  category: PlaceCategory;
  address: string;
  phone_number?: string;
  rating?: number;
  user_ratings_total?: number;
  is_open_now?: boolean;
  latitude: number;
  longitude: number;
  distance_meters?: number;
  duration_minutes?: number;
}

export interface LocationVisit {
  id: string;
  parent_id: string;
  place_name: string;
  category: PlaceCategory;
  address: string;
  latitude: number;
  longitude: number;
  visited_at: string;
  notes?: string;
}

export type TaskPriority = "urgent" | "high" | "medium" | "low";
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface CareTask {
  id: string;
  parent_id: string;
  family_id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string;
  assigned_to_name?: string;
  assigned_to_user_id?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface HealthcareExpense {
  id: string;
  parent_id: string;
  family_id: string;
  title: string;
  category: "doctor" | "medicine" | "lab" | "hospital" | "insurance" | "home_care" | "other";
  amount: number;
  currency: string;
  expense_date: string;
  provider_name?: string;
  receipt_document_id?: string;
  notes?: string;
  is_reimbursed: boolean;
  created_at: string;
}

export interface InsurancePolicy {
  id: string;
  parent_id: string;
  family_id: string;
  provider: string;
  policy_number: string;
  plan_name: string;
  coverage_amount: number;
  currency: string;
  expiry_date: string;
  tpa_cashless_helpline?: string;
  notes?: string;
  created_at: string;
}

export interface FamilyMemberItem {
  id: string;
  family_id: string;
  user_id: string;
  name: string;
  relationship: string;
  role: UserRole;
  email: string;
  phone?: string;
  avatar_initials: string;
  is_owner: boolean;
  can_manage_medicines: boolean;
  can_manage_appointments: boolean;
  can_upload_documents: boolean;
  can_share_doctor_brief: boolean;
  can_view_location_history: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone_number?: string;
  preferred_language: string;
  avatar_url?: string;
}

export interface MonthlyHealthSummary {
  parent_id: string;
  month_year: string;
  consultations_count: number;
  medication_adherence_percent: number;
  vital_status: string;
  avg_bp: string;
  avg_glucose: string;
  new_documents_count: number;
  tasks_completed_count: number;
  summary_text: string;
  key_highlights: string[];
}
