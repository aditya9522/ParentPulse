// apps/mobile/src/api/client.ts
import { Platform } from "react-native";
import Constants from "expo-constants";
import { sessionStore, StoredSession } from "../services/session";
import { QueuedMutation } from "../services/mutationQueue";
import {
  ParentProfile,
  MedicalDocument,
  MedicineSchedule,
  Appointment,
  TimelineEvent,
  HealthMeasurement,
  HealthcarePlace,
  LocationVisit,
  UserProfile,
} from "../types";

const getDevApiHost = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(":")[0];
  }
  return Platform.OS === "android" ? "10.0.2.2" : "localhost";
};

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, "");
const API_URL = configuredApiUrl || (__DEV__
  ? Platform.select({
    web: "http://localhost:8000/api/v1",
    default: `http://${getDevApiHost()}:8000/api/v1`,
  })!
  : (() => {
      throw new Error("EXPO_PUBLIC_API_URL is required in production builds.");
    })());

class ApiClient {
  private baseUrl: string;
  private session: StoredSession | null = null;
  private refreshPromise: Promise<boolean> | null = null;
  private authListeners = new Set<(authenticated: boolean) => void>();

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  async restoreSession(): Promise<boolean> {
    this.session = await sessionStore.load();
    if (!this.session) return false;
    if (this.session.expiresAt <= Date.now() + 30_000) {
      return this.refreshSession();
    }
    return true;
  }

  async setSession(response: AuthResponse): Promise<void> {
    this.session = {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt: Date.now() + response.expires_in * 1000,
      userId: response.user_id,
    };
    await sessionStore.save(this.session);
    this.authListeners.forEach((listener) => listener(true));
  }

  async signOut(): Promise<void> {
    this.session = null;
    await sessionStore.clear();
    this.authListeners.forEach((listener) => listener(false));
  }

  isAuthenticated(): boolean {
    return this.session !== null;
  }

  onAuthStateChange(listener: (authenticated: boolean) => void): () => void {
    this.authListeners.add(listener);
    return () => this.authListeners.delete(listener);
  }

  async executeQueuedMutation(operation: QueuedMutation): Promise<void> {
    await this.request(operation.endpoint, {
      method: operation.method,
      body: operation.body === undefined ? undefined : JSON.stringify(operation.body),
      headers: { "Idempotency-Key": operation.id },
    });
  }

  private async refreshSession(): Promise<boolean> {
    if (!this.session?.refreshToken) return false;
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = (async () => {
      try {
        const response = await this.request<AuthResponse>("/auth/refresh", {
          method: "POST",
          body: JSON.stringify({ refresh_token: this.session!.refreshToken }),
        }, false, false);
        await this.setSession(response);
        return true;
      } catch {
        await this.signOut();
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();
    return this.refreshPromise;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    authenticated = true,
    retryAuth = true,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    if (authenticated && this.session?.expiresAt && this.session.expiresAt <= Date.now() + 30_000) {
      await this.refreshSession();
    }
    const isMultipart = typeof FormData !== "undefined" && options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(!isMultipart ? { "Content-Type": "application/json" } : {}),
      ...((options.headers || {}) as Record<string, string>),
    };
    if (authenticated) {
      if (!this.session?.accessToken) throw new Error("Authentication required");
      headers.Authorization = `Bearer ${this.session.accessToken}`;
    }

    const response = await fetch(url, { ...options, headers });
    if (response.status === 401 && authenticated && retryAuth && await this.refreshSession()) {
      return this.request<T>(endpoint, options, true, false);
    }
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const detail = payload?.detail || payload?.message || response.statusText;
      const error = new Error(detail || `Request failed (${response.status})`);
      if (__DEV__) {
        console.warn(`Backend rejected ${endpoint}:`, error.message);
      }
      throw error;
    }

    const json = await response.json();
    return json.data;
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

  async inviteFamilyMember(familyId: string, data: Record<string, unknown>) {
    return this.request(`/families/${familyId}/members`, { method: "POST", body: JSON.stringify(data) });
  }

  async getCurrentUser(): Promise<UserProfile> {
    return this.request<UserProfile>(`/users/me`);
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

  async uploadDocument(input: {
    parentId: string;
    familyId: string;
    title: string;
    documentType: MedicalDocument["document_type"];
    documentDate: string;
    uri: string;
    filename: string;
    mimeType: string;
    doctorName?: string;
    hospitalName?: string;
  }): Promise<MedicalDocument> {
    const form = new FormData();
    form.append("parent_id", input.parentId);
    form.append("family_id", input.familyId);
    form.append("title", input.title);
    form.append("document_type", input.documentType);
    form.append("document_date", input.documentDate);
    if (input.doctorName) form.append("doctor_name", input.doctorName);
    if (input.hospitalName) form.append("hospital_name", input.hospitalName);
    if (Platform.OS === "web") {
      const blob = await (await fetch(input.uri)).blob();
      (form as any).append("file", blob, input.filename);
    } else {
      (form as any).append("file", { uri: input.uri, name: input.filename, type: input.mimeType });
    }
    return this.request<MedicalDocument>("/documents/upload", { method: "POST", body: form });
  }

  async getDocument(documentId: string): Promise<MedicalDocument> {
    return this.request<MedicalDocument>(`/documents/${documentId}`);
  }

  async retryDocument(documentId: string): Promise<MedicalDocument> {
    return this.request<MedicalDocument>(`/documents/${documentId}/retry`, { method: "POST" });
  }

  async getDocumentDownloadUrl(documentId: string): Promise<{ download_url: string; expires_in_seconds: number }> {
    return this.request(`/documents/${documentId}/download-url`);
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
  async getNearbyHealthcare(lat: number, lng: number, category: string, radiusMeters = 10000): Promise<HealthcarePlace[]> {
    return this.request<HealthcarePlace[]>(
      `/maps/nearby?latitude=${lat}&longitude=${lng}&category=${category}&radius_meters=${radiusMeters}`
    );
  }

  // Doctor Share
  async createDoctorShare(parentId: string, scope: string = "summary_only", hours: number = 72) {
    return this.request<{ id: string; token: string; expires_at: string; access_count: number; is_revoked: boolean }>(`/sharing/doctor-token`, {
      method: "POST",
      body: JSON.stringify({
        parent_id: parentId,
        share_scope: scope,
        expires_in_hours: hours,
      }),
    });
  }

  async revokeDoctorShare(token: string): Promise<void> {
    await this.request(`/sharing/revoke/${encodeURIComponent(token)}`, { method: "POST" });
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

  async listLocationVisits(parentId: string): Promise<LocationVisit[]> {
    return this.request<LocationVisit[]>(`/parents/${parentId}/locations/visits`);
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
    return this.request<AuthResponse>(`/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }, false);
  }

  async signUpWithEmail(email: string, password: string, fullName: string) {
    return this.request<AuthResponse>(`/auth/signup`, {
      method: "POST",
      body: JSON.stringify({ email, password, full_name: fullName }),
    }, false);
  }

  async requestPasswordReset(email: string) {
    return this.request<{ status: string }>(`/auth/password-reset`, {
      method: "POST",
      body: JSON.stringify({ email }),
    }, false);
  }

  async registerPushDevice(expoPushToken: string, platform: "android" | "ios") {
    return this.request<{ id: string; registered: boolean }>("/push-devices", {
      method: "POST",
      body: JSON.stringify({ expo_push_token: expoPushToken, platform }),
    });
  }

  async createSosEvent(input: { parent_id: string; latitude?: number; longitude?: number; message?: string }) {
    return this.request<{ id: string; status: string; recipients_registered: number; pushes_accepted: number; acknowledgements: number }>("/sos", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async acknowledgeSosEvent(eventId: string, response: "acknowledged" | "responding" = "acknowledged") {
    return this.request<{ acknowledgements: number }>(`/sos/${eventId}/acknowledge`, { method: "POST", body: JSON.stringify({ response }) });
  }

  async resolveSosEvent(eventId: string) {
    return this.request<{ id: string; status: string; acknowledgements: number }>(`/sos/${eventId}/resolve`, { method: "POST" });
  }

  async loginWithGoogle(idToken: string) {
    return this.request<AuthResponse>(`/auth/google`, {
      method: "POST",
      body: JSON.stringify({ id_token: idToken }),
    }, false);
  }
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: string;
}

export const apiClient = new ApiClient();
