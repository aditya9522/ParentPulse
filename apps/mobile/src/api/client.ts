// apps/mobile/src/api/client.ts
import { Platform } from "react-native";
import Constants from "expo-constants";
import {
  ParentProfile,
  MedicalDocument,
  MedicineSchedule,
  Appointment,
  TimelineEvent,
  HealthMeasurement,
  HealthcarePlace,
  LocationVisit,
} from "../types";

// Base URL: Dynamically detect Metro host IP for physical devices, fallback to machine LAN IP 192.168.1.4
const getDevApiHost = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(":")[0];
  }
  return "192.168.1.4";
};

const DEV_API_URL = Platform.select({
  web: "http://localhost:8000/api/v1",
  default: `http://${getDevApiHost()}:8000/api/v1`,
});

class ApiClient {
  private baseUrl: string;
  private authToken: string = "dev-token-11111111-1111-1111-1111-111111111111";

  constructor(baseUrl: string = DEV_API_URL) {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.authToken}`,
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      const json = await response.json();
      return json.data;
    } catch (error) {
      console.warn(`API call failed for ${endpoint}, returning fallback:`, error);
      throw error;
    }
  }

  // Families & Onboarding
  async createFamily(name: string): Promise<any> {
    return this.request<any>(`/families`, {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  async listFamilies(): Promise<any[]> {
    return this.request<any[]>(`/families`);
  }

  // Parent Profile
  async createParentProfile(data: any): Promise<ParentProfile> {
    return this.request<ParentProfile>(`/parents`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listFamilyParents(familyId: string): Promise<ParentProfile[]> {
    return this.request<ParentProfile[]>(`/parents/family/${familyId}`);
  }

  async getParentProfile(parentId: string): Promise<ParentProfile> {
    return this.request<ParentProfile>(`/parents/${parentId}`);
  }

  // Documents
  async listDocuments(parentId: string, type?: string): Promise<MedicalDocument[]> {
    const query = type ? `?document_type=${type}` : "";
    return this.request<MedicalDocument[]>(`/documents/parent/${parentId}${query}`);
  }

  // Medicines
  async listMedicines(parentId: string): Promise<MedicineSchedule[]> {
    return this.request<MedicineSchedule[]>(`/medicines/parent/${parentId}`);
  }

  async recordDose(medicineId: string, status: "taken" | "missed" | "skipped", notes?: string) {
    return this.request(`/medicines/${medicineId}/doses`, {
      method: "POST",
      body: JSON.stringify({ status, notes }),
    });
  }

  // Appointments
  async listAppointments(parentId: string): Promise<Appointment[]> {
    return this.request<Appointment[]>(`/appointments/parent/${parentId}`);
  }

  // Timeline
  async listTimeline(parentId: string): Promise<TimelineEvent[]> {
    return this.request<TimelineEvent[]>(`/timeline/parent/${parentId}`);
  }

  // Measurements / Vitals
  async listMeasurements(parentId: string): Promise<HealthMeasurement[]> {
    return this.request<HealthMeasurement[]>(`/measurements/parent/${parentId}`);
  }

  async logMeasurement(data: {
    parent_id: string;
    vital_type: string;
    value_numeric: number;
    value_secondary?: number;
    unit: string;
    notes?: string;
  }): Promise<HealthMeasurement> {
    return this.request<HealthMeasurement>(`/measurements`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Google Maps Nearby Healthcare
  async getNearbyHealthcare(lat: number, lng: number, category: string): Promise<HealthcarePlace[]> {
    return this.request<HealthcarePlace[]>(
      `/maps/nearby?latitude=${lat}&longitude=${lng}&category=${category}`
    );
  }

  // Doctor Share
  async createDoctorShare(parentId: string, scope: string = "summary_only", hours: number = 72) {
    return this.request<{ token: string; expires_at: string }>(`/sharing/doctor-token`, {
      method: "POST",
      body: JSON.stringify({
        parent_id: parentId,
        share_scope: scope,
        expires_in_hours: hours,
      }),
    });
  }

  // AI Assistant Q&A
  async askAiAssistant(parentId: string, query: string) {
    return this.request<{ answer: string; citations: any[]; disclaimer: string }>(`/ai/chat`, {
      method: "POST",
      body: JSON.stringify({ parent_id: parentId, query }),
    });
  }

  // Location Visits
  async recordLocationVisit(parentId: string, data: Partial<LocationVisit>) {
    return this.request<LocationVisit>(`/parents/${parentId}/locations/visits`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Update Parent Profile
  async updateParentProfile(parentId: string, data: Partial<ParentProfile>): Promise<ParentProfile> {
    return this.request<ParentProfile>(`/parents/${parentId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Care Tasks
  async listTasks(parentId: string, status?: string) {
    const q = status ? `?status=${status}` : "";
    return this.request<any[]>(`/tasks/parent/${parentId}${q}`);
  }

  async createTask(data: any) {
    return this.request<any>(`/tasks`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTask(taskId: string, data: any) {
    return this.request<any>(`/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteTask(taskId: string) {
    return this.request<any>(`/tasks/${taskId}`, {
      method: "DELETE",
    });
  }

  // Healthcare Expenses & Insurance
  async listExpenses(parentId: string, category?: string) {
    const q = category ? `?category=${category}` : "";
    return this.request<any[]>(`/expenses/parent/${parentId}${q}`);
  }

  async createExpense(data: any) {
    return this.request<any>(`/expenses`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listInsurance(parentId: string) {
    return this.request<any[]>(`/expenses/insurance/${parentId}`);
  }

  async createInsurance(data: any) {
    return this.request<any>(`/expenses/insurance`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Authentication
  async loginWithEmail(email: string, password: string) {
    return this.request<{ access_token: string; user_id: string }>(`/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async loginWithGoogle(idToken: string) {
    return this.request<{ access_token: string; user_id: string }>(`/auth/google`, {
      method: "POST",
      body: JSON.stringify({ id_token: idToken }),
    });
  }
}

export const apiClient = new ApiClient();
