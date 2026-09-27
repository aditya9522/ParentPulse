/**
 * ParentPulse Shared Domain Contracts and TypeScript Types
 */

export enum UserRole {
  PARENT = "parent",
  FAMILY_MEMBER = "family_member",
  CAREGIVER = "caregiver",
  DOCTOR = "doctor",
  ADMIN = "admin",
}

export enum DocumentType {
  PRESCRIPTION = "prescription",
  LAB_REPORT = "lab_report",
  RADIOLOGY = "radiology", // X-Ray, MRI, CT Scan, Ultrasound
  DISCHARGE_SUMMARY = "discharge_summary",
  VACCINATION = "vaccination",
  INSURANCE = "insurance",
  HOSPITAL_BILL = "hospital_bill",
  OTHER = "other",
}

export enum DocumentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  EXTRACTED = "extracted",
  FAILED = "failed",
}

export enum TimelineEventType {
  DOCTOR_VISIT = "doctor_visit",
  DIAGNOSIS = "diagnosis",
  MEDICINE_STARTED = "medicine_started",
  MEDICINE_CHANGED = "medicine_changed",
  MEDICINE_STOPPED = "medicine_stopped",
  LAB_TEST = "lab_test",
  SURGERY = "surgery",
  HOSPITALIZATION = "hospitalization",
  VACCINATION = "vaccination",
  FOLLOW_UP = "follow_up",
}

export enum DoseStatus {
  SCHEDULED = "scheduled",
  TAKEN = "taken",
  MISSED = "missed",
  SKIPPED = "skipped",
}

export enum AppointmentStatus {
  UPCOMING = "upcoming",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  RESCHEDULED = "rescheduled",
}

export enum VitalType {
  BLOOD_PRESSURE = "blood_pressure",
  BLOOD_SUGAR = "blood_sugar",
  HEART_RATE = "heart_rate",
  WEIGHT = "weight",
  TEMPERATURE = "temperature",
  OXYGEN_SATURATION = "oxygen_saturation",
}

export enum PlaceCategory {
  DOCTOR = "doctor",
  CLINIC = "clinic",
  HOSPITAL = "hospital",
  PHARMACY = "pharmacy",
  LABORATORY = "laboratory",
  EMERGENCY = "emergency",
}

export enum ShareScope {
  SUMMARY_ONLY = "summary_only",
  RECENT_DOCUMENTS = "recent_documents",
  FULL_HISTORY = "full_history",
  SPECIFIC_DOCUMENTS = "specific_documents",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

// API Envelopes
export interface ApiResponse<T> {
  data: T;
  meta: {
    request_id: string;
    timestamp?: string;
    pagination?: PaginationMeta;
  };
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: Record<string, unknown> | null;
  request_id: string;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// Domain Models
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string | null;
  avatar_url?: string | null;
  preferred_language: string; // "en" | "hi" | ...
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Family {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  members_count?: number;
  parents_count?: number;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: UserRole;
  relationship: string; // "daughter", "son", "caregiver", "spouse"
  can_manage_medicines: boolean;
  can_manage_appointments: boolean;
  can_upload_documents: boolean;
  can_share_doctor_brief: boolean;
  can_view_location_history: boolean;
  created_at: string;
  user?: User;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone_number: string;
  is_primary: boolean;
}

export interface PrimaryDoctor {
  id?: string;
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
  blood_group: string; // "O+", "A+", "B+", etc.
  preferred_language: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  phone_number: string;
  allergies: string[];
  chronic_conditions: string[];
  disabilities?: string[];
  surgeries: Array<{ name: string; date?: string; notes?: string }>;
  emergency_contacts: EmergencyContact[];
  primary_doctors: PrimaryDoctor[];
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExtractedField {
  name: string;
  value: string;
  confidence: number;
}

export interface MedicalDocument {
  id: string;
  parent_id: string;
  family_id: string;
  uploaded_by: string;
  title: string;
  document_type: DocumentType;
  file_url: string;
  file_size_bytes: number;
  mime_type: string;
  document_date: string;
  status: DocumentStatus;
  doctor_name?: string | null;
  hospital_name?: string | null;
  summary?: string | null;
  extracted_tags: string[];
  extracted_fields?: Record<string, unknown> | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  parent_id: string;
  family_id: string;
  title: string;
  description: string;
  event_type: TimelineEventType;
  event_date: string;
  doctor_name?: string | null;
  facility_name?: string | null;
  document_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface MedicineSchedule {
  id: string;
  parent_id: string;
  family_id: string;
  name: string;
  dosage: string; // e.g. "500mg"
  form: "tablet" | "capsule" | "syrup" | "injection" | "drops" | "ointment" | "other";
  frequency_times_per_day: number;
  schedule_times: string[]; // ["08:00", "20:00"]
  instructions: "before_food" | "after_food" | "with_food" | "empty_stomach" | "as_needed";
  prescribing_doctor?: string | null;
  reason?: string | null;
  start_date: string;
  end_date?: string | null;
  current_inventory: number;
  refill_alert_threshold: number;
  is_active: boolean;
  created_at: string;
}

export interface MedicineDoseLog {
  id: string;
  schedule_id: string;
  parent_id: string;
  scheduled_time: string;
  status: DoseStatus;
  recorded_by?: string | null;
  recorded_at?: string | null;
  notes?: string | null;
}

export interface Appointment {
  id: string;
  parent_id: string;
  family_id: string;
  doctor_name: string;
  specialty: string;
  hospital_clinic_name: string;
  appointment_date: string; // ISO DateTime
  status: AppointmentStatus;
  reason?: string | null;
  notes?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  google_place_id?: string | null;
  assigned_to_user_id?: string | null;
  related_document_ids?: string[];
  created_at: string;
  updated_at: string;
}

export interface HealthMeasurement {
  id: string;
  parent_id: string;
  vital_type: VitalType;
  value_numeric: number;
  value_secondary?: number | null; // e.g. diastolic for blood pressure
  unit: string; // "mmHg", "mg/dL", "bpm", "kg", "°F", "%"
  recorded_at: string;
  notes?: string | null;
  recorded_by: string;
}

export interface HealthcarePlace {
  place_id: string;
  name: string;
  category: PlaceCategory;
  address: string;
  phone_number?: string | null;
  rating?: number | null;
  user_ratings_total?: number | null;
  is_open_now?: boolean | null;
  latitude: number;
  longitude: number;
  distance_meters?: number | null;
  duration_minutes?: number | null;
}

export interface LocationVisit {
  id: string;
  parent_id: string;
  family_id: string;
  place_id?: string | null;
  place_name: string;
  category: PlaceCategory;
  address: string;
  latitude: number;
  longitude: number;
  visited_at: string;
  appointment_id?: string | null;
  notes?: string | null;
  confirmed_by: string;
}

export interface DoctorShareToken {
  id: string;
  parent_id: string;
  token: string;
  share_scope: ShareScope;
  expires_at: string;
  access_count: number;
  is_revoked: boolean;
  created_by: string;
  created_at: string;
}

export interface DoctorBrief {
  parent_name: string;
  age: number;
  blood_group: string;
  allergies: string[];
  chronic_conditions: string[];
  active_medicines: Array<{
    name: string;
    dosage: string;
    instructions: string;
  }>;
  recent_reports: Array<{
    title: string;
    date: string;
    summary: string;
  }>;
  recent_vitals: Array<{
    vital_type: string;
    value: string;
    date: string;
  }>;
  emergency_contacts: EmergencyContact[];
}

export interface CareTask {
  id: string;
  parent_id: string;
  family_id: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string | null;
  assigned_to_user_id?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AiChatQuery {
  parent_id: string;
  query: string;
  session_id?: string;
}

export interface SourceCitation {
  document_id: string;
  title: string;
  document_date: string;
  relevance_snippet: string;
}

export interface AiChatResponse {
  answer: string;
  citations: SourceCitation[];
  disclaimer: string;
}

export interface EmergencyCard {
  parent_id: string;
  full_name: string;
  blood_group: string;
  allergies: string[];
  critical_conditions: string[];
  current_medications: string[];
  emergency_contacts: EmergencyContact[];
  primary_doctor: PrimaryDoctor | null;
  qr_code_url: string;
}
