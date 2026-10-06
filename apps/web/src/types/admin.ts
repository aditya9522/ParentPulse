// apps/web/src/types/admin.ts
export interface AdminPlatformStats {
  total_users: number;
  total_families: number;
  total_parents: number;
  total_doctors: number;
  verified_doctors: number;
  pending_doctor_verifications: number;
  active_sos_alerts: number;
  system_status: "operational" | "degraded" | "maintenance";
  compliance_mode: string;
  api_latency_ms: number;
}

export interface AdminUserRecord {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role: string;
  created_at: string;
  is_active: boolean;
  family_count?: number;
  enrolled_parents?: number;
}

export interface AdminDoctorRecord {
  id: string;
  name: string;
  specialty: string;
  hospital_or_clinic: string;
  phone_number: string;
  email?: string;
  address?: string;
  is_verified: boolean;
  created_at?: string;
  license_number?: string;
}

export interface AdminSosEvent {
  id: string;
  parent_id: string;
  parent_name?: string;
  family_id: string;
  initiated_by: string;
  status: "active" | "resolved" | "escalated";
  latitude?: number;
  longitude?: number;
  message?: string;
  created_at: string;
  resolved_at?: string;
}

export interface AdminAuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: string;
  timestamp: string;
  ip_address?: string;
}
