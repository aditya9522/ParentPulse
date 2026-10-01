// apps/mobile/src/api/client.ts
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";
import { FileSystemUploadType } from "expo-file-system/legacy";
import { sessionStore, StoredSession } from "../services/session";
import { clearGoogleSession } from "../services/googleAuth";
import { QueuedMutation } from "../services/mutationQueue";
import {
  ParentProfile,
  MedicalDocument,
  MedicineSchedule,
  MedicineDoseLog,
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

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly endpoint: string,
    public readonly code?: string,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

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
    const wasAuthenticated = this.session !== null;
    this.session = {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt: Date.now() + response.expires_in * 1000,
      userId: response.user_id,
    };
    await sessionStore.save(this.session);
    // Token refreshes update the stored credentials without rebootstrapping the
    // whole application. Listeners only need the signed-out -> signed-in edge.
    if (!wasAuthenticated) this.authListeners.forEach((listener) => listener(true));
  }

  async signOut(): Promise<void> {
    const wasAuthenticated = this.session !== null;
    this.session = null;
    await sessionStore.clear();
    await clearGoogleSession();
    if (wasAuthenticated) this.authListeners.forEach((listener) => listener(false));
  }

  isAuthenticated(): boolean {
    return this.session !== null;
  }

  getAuthenticatedUserId(): string | null {
    return this.session?.userId || null;
  }

  onAuthStateChange(listener: (authenticated: boolean) => void): () => void {
    this.authListeners.add(listener);
    return () => this.authListeners.delete(listener);
  }

  async executeQueuedMutation(operation: QueuedMutation): Promise<unknown> {
    return this.request(operation.endpoint, {
      method: operation.method,
      body: operation.body === undefined ? undefined : JSON.stringify(operation.body),
      headers: {
        "Idempotency-Key": operation.id,
        ...(operation.expectedVersion ? { "X-Record-Version": operation.expectedVersion } : {}),
        ...(operation.conflictResolution === "overwrite" ? { "X-Conflict-Resolution": "overwrite" } : {}),
      },
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
    const isMultipart = Boolean(
      options.body &&
      (
        (typeof FormData !== "undefined" && options.body instanceof FormData) ||
        (typeof options.body === "object" && options.body !== null && ("_parts" in (options.body as any) || (options.body as any).constructor?.name === "FormData"))
      )
    );
    const headers: Record<string, string> = {
      ...((options.headers || {}) as Record<string, string>),
    };
    if (!isMultipart) {
      if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";
    } else {
      delete headers["Content-Type"];
    }
    if (authenticated) {
      if (!this.session?.accessToken) throw new Error("Authentication required");
      headers.Authorization = `Bearer ${this.session.accessToken}`;
    }

    const isUpload = isMultipart || endpoint.includes("/upload") || endpoint.includes("/avatar");
    const timeoutMs = isUpload ? 90_000 : 45_000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await fetch(url, { ...options, headers, signal: controller.signal });
    } catch (err) {
      if (__DEV__) {
        console.warn(`Fetch error for ${endpoint}:`, err);
      }
      const timedOut = controller.signal.aborted;
      throw new ApiError(
        timedOut
          ? "The secure service took too long to respond. Please try again."
          : (err instanceof Error && !err.message.includes("Network request failed")
              ? err.message
              : "Could not reach the secure service. Check your connection and try again."),
        null,
        endpoint,
        timedOut ? "REQUEST_TIMEOUT" : "NETWORK_UNAVAILABLE",
      );
    } finally {
      clearTimeout(timeout);
    }
    if (response.status === 401 && authenticated && retryAuth && await this.refreshSession()) {
      return this.request<T>(endpoint, options, true, false);
    }
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const detail = payload?.error?.message || payload?.detail || payload?.message || response.statusText;
      const error = new ApiError(
        detail || `Request failed (${response.status})`,
        response.status,
        endpoint,
        payload?.error?.code,
        payload?.error?.request_id || response.headers.get("x-request-id") || undefined,
      );
      if (__DEV__) {
        console.warn(`Backend rejected ${endpoint}:`, error.message);
      }
      throw error;
    }

    if (response.status === 204) return undefined as T;

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

  async updateFamilyMember(familyId: string, memberId: string, data: Record<string, unknown>) {
    return this.request(`/families/${familyId}/members/${memberId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async removeFamilyMember(familyId: string, memberId: string): Promise<void> {
    await this.request<void>(`/families/${familyId}/members/${memberId}`, { method: "DELETE" });
  }

  async getCurrentUser(): Promise<UserProfile> {
    return this.request<UserProfile>(`/users/me`);
  }

  async listConsents(): Promise<ConsentPreference[]> {
    return this.request<ConsentPreference[]>("/users/me/consents");
  }

  async updateConsent(
    consentType: ConsentType,
    granted: boolean,
    policyVersion = consentType === "voice_input" ? "2026-09-voice-v1" : "2026-09",
  ): Promise<ConsentPreference> {
    return this.request<ConsentPreference>(`/users/me/consents/${consentType}`, {
      method: "PUT",
      body: JSON.stringify({
        granted,
        policy_version: policyVersion,
      }),
    });
  }

  async updateVoiceConsent(granted: boolean): Promise<ConsentPreference> {
    try {
      return await this.updateConsent("voice_input", granted, "2026-09-voice-v1");
    } catch (error) {
      // Rolling deployments may briefly run the pre-voice enum. Preserve an
      // explicit voice policy version without treating generic AI consent as mic consent.
      if (!(error instanceof ApiError) || error.status !== 422) throw error;
      return this.updateConsent("ai_assistant", granted, "2026-09-voice-v1");
    }
  }

  async exportAccountData(): Promise<AccountExport> {
    return this.request<AccountExport>("/users/me/export");
  }

  async getDeletionImpact(): Promise<DeletionImpact> {
    return this.request<DeletionImpact>("/users/me/deletion-impact");
  }

  async getAuthMethods(): Promise<AuthMethod[]> {
    const result = await this.request<{ methods: AuthMethod[] }>("/users/me/auth-methods");
    return result.methods;
  }

  async deleteAccount(input: DeleteAccountInput): Promise<DeleteAccountResult> {
    return this.request<DeleteAccountResult>("/users/me", {
      method: "DELETE",
      body: JSON.stringify(input),
    });
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
    if (this.session?.expiresAt && this.session.expiresAt <= Date.now() + 30_000) {
      await this.refreshSession();
    }
    if (!this.session?.accessToken) throw new Error("Authentication required");

    const safeFilename = input.filename || `medical-document-${Date.now()}.jpg`;
    const safeMimeType = input.mimeType || (safeFilename.endsWith(".pdf") ? "application/pdf" : "image/jpeg");
    const url = `${this.baseUrl}/documents/upload`;

    if (Platform.OS !== "web") {
      try {
        const uploadResult = await FileSystem.uploadAsync(url, input.uri, {
          httpMethod: "POST",
          uploadType: FileSystemUploadType.MULTIPART,
          fieldName: "file",
          mimeType: safeMimeType,
          headers: {
            Authorization: `Bearer ${this.session.accessToken}`,
          },
          parameters: {
            parent_id: input.parentId,
            family_id: input.familyId,
            title: input.title,
            document_type: input.documentType,
            document_date: input.documentDate,
            ...(input.doctorName ? { doctor_name: input.doctorName } : {}),
            ...(input.hospitalName ? { hospital_name: input.hospitalName } : {}),
          },
        });

        if (uploadResult.status >= 200 && uploadResult.status < 300) {
          const json = JSON.parse(uploadResult.body);
          return json.data;
        }

        let errorDetail = `Upload failed (${uploadResult.status})`;
        try {
          const errorJson = JSON.parse(uploadResult.body);
          errorDetail = errorJson?.error?.message || errorJson?.detail || errorJson?.message || errorDetail;
        } catch {}
        throw new ApiError(errorDetail, uploadResult.status, "/documents/upload");
      } catch (err) {
        if (err instanceof ApiError) throw err;
        console.warn("Native document upload error:", err);
        throw new ApiError(
          err instanceof Error ? err.message : "Could not reach the secure service. Check your connection and try again.",
          null,
          "/documents/upload",
        );
      }
    }

    // Web fallback
    const form = new FormData();
    form.append("parent_id", input.parentId);
    form.append("family_id", input.familyId);
    form.append("title", input.title);
    form.append("document_type", input.documentType);
    form.append("document_date", input.documentDate);
    if (input.doctorName) form.append("doctor_name", input.doctorName);
    if (input.hospitalName) form.append("hospital_name", input.hospitalName);
    const blob = await (await fetch(input.uri)).blob();
    form.append("file", blob, safeFilename);
    return this.request<MedicalDocument>("/documents/upload", { method: "POST", body: form });
  }

  async uploadAvatar(uri: string, filename = "avatar.jpg", mimeType = "image/jpeg"): Promise<UserProfile> {
    if (this.session?.expiresAt && this.session.expiresAt <= Date.now() + 30_000) {
      await this.refreshSession();
    }
    if (!this.session?.accessToken) throw new Error("Authentication required");

    const url = `${this.baseUrl}/users/me/avatar`;
    if (Platform.OS !== "web") {
      try {
        const uploadResult = await FileSystem.uploadAsync(url, uri, {
          httpMethod: "POST",
          uploadType: FileSystemUploadType.MULTIPART,
          fieldName: "file",
          mimeType,
          headers: {
            Authorization: `Bearer ${this.session.accessToken}`,
          },
        });

        if (uploadResult.status >= 200 && uploadResult.status < 300) {
          const json = JSON.parse(uploadResult.body);
          return json.data;
        }

        let errorDetail = `Avatar upload failed (${uploadResult.status})`;
        try {
          const errorJson = JSON.parse(uploadResult.body);
          errorDetail = errorJson?.error?.message || errorJson?.detail || errorJson?.message || errorDetail;
        } catch {}
        throw new ApiError(errorDetail, uploadResult.status, "/users/me/avatar");
      } catch (err) {
        if (err instanceof ApiError) throw err;
        console.warn("Native avatar upload error:", err);
        throw new ApiError(
          err instanceof Error ? err.message : "Could not reach the secure service. Check your connection and try again.",
          null,
          "/users/me/avatar",
        );
      }
    }

    const form = new FormData();
    const blob = await (await fetch(uri)).blob();
    form.append("file", blob, filename);
    return this.request<UserProfile>("/users/me/avatar", { method: "POST", body: form });
  }

  async updateUserProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    return this.request<UserProfile>("/users/me", { method: "PATCH", body: JSON.stringify(data) });
  }

  async deleteMeasurement(measurementId: string): Promise<void> {
    return this.request<void>(`/measurements/${measurementId}`, { method: "DELETE" });
  }

  async listDoctors(): Promise<any[]> {
    return this.request<any[]>("/doctors");
  }

  async registerDoctor(data: any): Promise<any> {
    return this.request<any>("/doctors", { method: "POST", body: JSON.stringify(data) });
  }

  async updateDoctor(doctorId: string, data: any): Promise<any> {
    return this.request<any>(`/doctors/${doctorId}`, { method: "PATCH", body: JSON.stringify(data) });
  }

  async deleteDoctor(doctorId: string): Promise<void> {
    return this.request<void>(`/doctors/${doctorId}`, { method: "DELETE" });
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

  async listDoseHistory(parentId: string): Promise<MedicineDoseLog[]> {
    return this.request<MedicineDoseLog[]>(`/medicines/parent/${parentId}/dose-history`);
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

  async deleteExpense(expenseId: string): Promise<void> {
    return this.request<void>(`/expenses/${expenseId}`, { method: "DELETE" });
  }

  async deleteInsurance(policyId: string): Promise<void> {
    return this.request<void>(`/expenses/insurance/${policyId}`, { method: "DELETE" });
  }

  async deleteTimeline(eventId: string): Promise<void> {
    return this.request<void>(`/timeline/${eventId}`, { method: "DELETE" });
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

export type ConsentType = "location_history" | "sos_location_sharing" | "ai_assistant" | "voice_input";

export interface ConsentPreference {
  id: string;
  consent_type: ConsentType;
  granted: boolean;
  policy_version: string;
  source: string;
  occurred_at: string;
}

export interface AccountExport {
  format_version: string;
  generated_at: string;
  account: Record<string, unknown>;
  consents: Record<string, unknown>[];
  care_circles: Record<string, unknown>[];
  records: Record<string, Record<string, unknown>[]>;
  notes: string[];
}

export interface DeletionImpact {
  owned_care_circles: number;
  shared_care_circles: number;
  parent_profiles_removed: number;
  medical_documents_removed: number;
  confirmation_phrase: string;
}

export interface DeleteAccountResult {
  deleted: boolean;
  auth_cleanup_status: "completed" | "pending";
}

export type AuthMethod = "password" | "google";

export type DeleteAccountInput =
  | { credential_type: "password"; password: string; confirmation: string }
  | { credential_type: "google"; google_id_token: string; confirmation: string };

export const apiClient = new ApiClient();
