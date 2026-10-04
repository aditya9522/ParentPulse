import React, { createContext, useCallback, useContext, useState, useEffect, useMemo, useRef } from "react";
import * as Location from "expo-location";
import * as Crypto from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import {
  ParentProfile,
  MedicalDocument,
  MedicineSchedule,
  Appointment,
  TimelineEvent,
  HealthMeasurement,
  LocationVisit,
  CareTask,
  HealthcareExpense,
  InsurancePolicy,
  MedicineDoseLog,
  FamilyMemberItem,
  UserProfile,
  PrimaryDoctor,
} from "../types";
import { apiClient } from "../api/client";
import { syncCareReminders } from "../services/reminders";
import {
  discardQueuedMutation,
  drainMutationQueue,
  enqueueMutation,
  initializeMutationQueue,
  MutationDescriptor,
  QueuedMutation,
  retryQueuedMutation,
  subscribeToMutationQueue,
} from "../services/mutationQueue";
import { getNotifications } from "../services/notificationRuntime";
import { AppThemeMode, applyTheme, currentThemeMode } from "../theme";

export type SupportedLanguage =
  | "en"
  | "hi"
  | "mr"
  | "gu"
  | "ta"
  | "te"
  | "bn"
  | "kn"
  | "ml"
  | "pa";

export type ActiveScreen =
  | "tabs"
  | "family"
  | "profile"
  | "expenses"
  | "settings"
  | "report"
  | "onboarding";

export interface ParentData {
  profile: ParentProfile;
  medicines: MedicineSchedule[];
  appointments: Appointment[];
  documents: MedicalDocument[];
  timeline: TimelineEvent[];
  measurements: HealthMeasurement[];
  visits: LocationVisit[];
  tasks: CareTask[];
  expenses: HealthcareExpense[];
  insurance: InsurancePolicy[];
  doseLogs: MedicineDoseLog[];
}

const EMPTY_PARENT_PROFILE: ParentProfile = {
  id: "",
  family_id: "",
  full_name: "",
  date_of_birth: "",
  gender: "other",
  blood_group: "",
  preferred_language: "en",
  address: "",
  phone_number: "",
  allergies: [],
  chronic_conditions: [],
  disabilities: [],
  surgeries: [],
  emergency_contacts: [],
  primary_doctors: [],
};

const emptyParentData = (profile: ParentProfile = EMPTY_PARENT_PROFILE): ParentData => ({
  profile,
  medicines: [],
  appointments: [],
  documents: [],
  timeline: [],
  measurements: [],
  visits: [],
  tasks: [],
  expenses: [],
  insurance: [],
  doseLogs: [],
});

const normalizeParentProfile = (p: any): ParentProfile => ({
  ...EMPTY_PARENT_PROFILE,
  ...p,
  allergies: Array.isArray(p?.allergies) ? p.allergies : [],
  chronic_conditions: Array.isArray(p?.chronic_conditions) ? p.chronic_conditions : [],
  disabilities: Array.isArray(p?.disabilities) ? p.disabilities : [],
  surgeries: Array.isArray(p?.surgeries) ? p.surgeries : [],
  emergency_contacts: Array.isArray(p?.emergency_contacts) ? p.emergency_contacts : [],
  primary_doctors: Array.isArray(p?.primary_doctors) ? p.primary_doctors : [],
});

const EMPTY_CURRENT_USER: UserProfile = {
  id: "",
  email: "",
  full_name: "",
  role: "family_member",
  preferred_language: "en",
};

interface AppContextType {
  runtimeReady: boolean;
  isAuthenticated: boolean;
  dataLoading: boolean;
  dataError: string | null;
  dataWarning: string | null;
  refreshData: (options?: { silent?: boolean; preserveScreen?: boolean }) => Promise<void>;
  syncQueue: QueuedMutation[];
  syncBusy: boolean;
  syncCenterVisible: boolean;
  setSyncCenterVisible: (visible: boolean) => void;
  retrySyncMutation: (id: string, overwrite?: boolean) => Promise<void>;
  discardSyncMutation: (id: string) => Promise<void>;
  syncNow: () => Promise<void>;
  activeParent: ParentProfile;
  parentList: ParentProfile[];
  setActiveParentId: (id: string) => void;
  updateActiveParentProfile: (updated: Partial<ParentProfile>) => void;

  seniorMode: boolean;
  toggleSeniorMode: () => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  themeMode: AppThemeMode;
  setThemeMode: (mode: AppThemeMode) => void;
  isDark: boolean;

  // Active Screen Routing ("tabs", "family", "profile", "expenses", "settings", "report", "onboarding")
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;

  // Onboarding & Family Initialization
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (v: boolean) => void;
  registerNewParentAndFamily: (familyName: string, parentData: any) => Promise<ParentProfile>;

  // Medicines & Doses
  medicines: MedicineSchedule[];
  dosesTakenToday: Record<string, boolean>;
  markDoseTaken: (medicineId: string) => void;
  addMedicine: (med: MedicineSchedule) => void;
  deleteMedicine: (medId: string) => void;

  // Appointments, Documents, Timeline, Vitals, Visits
  appointments: Appointment[];
  addAppointment: (app: Appointment) => void;
  deleteAppointment: (appId: string) => void;
  documents: MedicalDocument[];
  addDocument: (doc: MedicalDocument) => void;
  deleteDocument: (docId: string) => void;
  timeline: TimelineEvent[];
  measurements: HealthMeasurement[];
  visits: LocationVisit[];

  // Care Tasks
  tasks: CareTask[];
  addTask: (task: CareTask) => void;
  toggleTaskCompleted: (taskId: string) => void;
  deleteTask: (taskId: string) => void;

  // Expenses & Insurance
  expenses: HealthcareExpense[];
  addExpense: (expense: HealthcareExpense) => void;
  insurance: InsurancePolicy[];
  addInsurance: (policy: InsurancePolicy) => void;

  // Family Coordination & Caregivers
  familyMembers: FamilyMemberItem[];

  // User Profile & Authentication
  currentUser: UserProfile;

  // Real-time Device Location & Geolocation
  userLocation: { latitude: number; longitude: number } | null;
  refreshLocation: () => Promise<void>;

  deleteMeasurement: (id: string) => void;
  deleteExpense: (id: string) => void;
  deleteInsurance: (id: string) => void;
  addDoctor: (doc: PrimaryDoctor) => void;
  updateDoctor: (index: number, updated: PrimaryDoctor) => void;
  deleteDoctor: (index: number) => void;
  addTimelineEvent: (event: TimelineEvent) => void;
  updateTimelineEvent: (event: TimelineEvent) => void;
  deleteTimelineEvent: (id: string) => void;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateUserAvatar: (uri: string, filename?: string, mimeType?: string) => Promise<void>;

  logNewMeasurement: (vitalType: any, val: number, valSec?: number, notes?: string) => void;
  recordNewVisit: (placeName: string, category: any, address: string) => void;
  deleteVisit: (id: string) => void;

  // Modals
  sosModalVisible: boolean;
  setSosModalVisible: (v: boolean) => void;
  doctorShareModalVisible: boolean;
  setDoctorShareModalVisible: (v: boolean) => void;
  aiAssistantModalVisible: boolean;
  setAiAssistantModalVisible: (v: boolean) => void;
  logVitalModalVisible: boolean;
  setLogVitalModalVisible: (v: boolean) => void;
  scannerModalVisible: boolean;
  setScannerModalVisible: (v: boolean) => void;
  scannerMode: "document" | "qr";
  setScannerMode: (m: "document" | "qr") => void;
  authModalVisible: boolean;
  setAuthModalVisible: (v: boolean) => void;
  reportModalVisible: boolean;
  setReportModalVisible: (v: boolean) => void;
}

const mergeById = <T extends { id?: string; status?: string }>(cached: T[] = [], incoming: T[] = []): T[] => {
  const map = new Map<string, T>();
  (cached || []).forEach((item) => {
    if (item && item.id) map.set(item.id, item);
  });
  (incoming || []).forEach((item) => {
    if (item && item.id) {
      const prev = map.get(item.id);
      // Prevent regression of locally or previously extracted documents to processing or pending
      if (prev && (prev as any).status === "extracted" && ((item as any).status === "pending" || (item as any).status === "processing")) {
        map.set(item.id, {
          ...item,
          status: "extracted",
          summary: (prev as any).summary || (item as any).summary,
          extracted_fields: (prev as any).extracted_fields || (item as any).extracted_fields,
          extracted_tags: (prev as any).extracted_tags || (item as any).extracted_tags,
          raw_ocr_text: (prev as any).raw_ocr_text || (item as any).raw_ocr_text,
        });
      } else {
        map.set(item.id, item);
      }
    }
  });
  return Array.from(map.values());
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const APP_STATE_KEY = "parentpulse.app-state.v2";
const DATA_STORE_KEY = "parentpulse.datastore.v2";

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [runtimeReady, setRuntimeReady] = useState(false);
  const [authVersion, setAuthVersion] = useState(0);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeParentId, setActiveParentId] = useState<string>("");
  const [seniorMode, setSeniorMode] = useState<boolean>(false);
  const [language, setLanguage] = useState<SupportedLanguage>("en");
  const [themeMode, setThemeModeState] = useState<AppThemeMode>(currentThemeMode);

  const setThemeMode = useCallback((mode: AppThemeMode) => {
    setThemeModeState(mode);
    applyTheme(mode);
    void AsyncStorage.setItem("@parentpulse_theme_mode", mode);
  }, []);
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>("tabs");
  const [hasCompletedOnboarding, setHasCompletedOnboardingState] = useState<boolean>(false);
  const [onboardingCompletionUserId, setOnboardingCompletionUserId] = useState<string | null>(null);
  const onboardingCompletionUserIdRef = useRef<string | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [dataWarning, setDataWarning] = useState<string | null>(null);
  const [allQueuedMutations, setAllQueuedMutations] = useState<QueuedMutation[]>([]);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncCenterVisible, setSyncCenterVisible] = useState(false);
  const refreshDataRef = useRef<(options?: { silent?: boolean; preserveScreen?: boolean }) => Promise<void>>(async () => undefined);
  const activeScreenRef = useRef<ActiveScreen>(activeScreen);
  const reconciliationPendingRef = useRef(false);
  const refreshGenerationRef = useRef(0);

  useEffect(() => {
    activeScreenRef.current = activeScreen;
  }, [activeScreen]);

  // Per-parent data cache
  const [dataStore, setDataStore] = useState<Record<string, ParentData>>({});
  const dataStoreRef = useRef(dataStore);

  useEffect(() => {
    dataStoreRef.current = dataStore;
  }, [dataStore]);

  const [familyMembers, setFamilyMembers] = useState<FamilyMemberItem[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile>(EMPTY_CURRENT_USER);

  const [dosesTakenToday, setDosesTakenToday] = useState<Record<string, boolean>>({});
  const [hydratedParentIds, setHydratedParentIds] = useState<Set<string>>(new Set());

  // Real GPS Device Location
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Modals state
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [doctorShareModalVisible, setDoctorShareModalVisible] = useState(false);
  const [aiAssistantModalVisible, setAiAssistantModalVisible] = useState(false);
  const [logVitalModalVisible, setLogVitalModalVisible] = useState(false);
  const [scannerModalVisible, setScannerModalVisible] = useState(false);
  const [scannerMode, setScannerMode] = useState<"document" | "qr">("document");
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  useEffect(() => {
    let active = true;
    let subscription: { remove: () => void } | undefined;

    void getNotifications().then((Notifications) => {
      if (!active || !Notifications) return;
      const handleResponse = (response: import("expo-notifications").NotificationResponse) => {
        const data = response.notification.request.content.data;
        if (data?.type !== "sos" || typeof data.sosEventId !== "string") return;
        const acknowledgement = response.actionIdentifier === "responding" ? "responding" : "acknowledged";
        void apiClient.acknowledgeSosEvent(data.sosEventId, acknowledgement);
        if (acknowledgement === "responding") setSosModalVisible(true);
      };
      const initial = Notifications.getLastNotificationResponse();
      if (initial) handleResponse(initial);
      subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    }).catch(() => undefined);

    return () => {
      active = false;
      subscription?.remove();
    };
  }, []);

  const currentData = dataStore[activeParentId] || emptyParentData();
  const isAuthenticated = apiClient.isAuthenticated();
  const authenticatedUserId = apiClient.getAuthenticatedUserId();
  const syncQueue = useMemo(() => authenticatedUserId
    ? allQueuedMutations.filter((item) => item.ownerUserId === authenticatedUserId)
    : [], [allQueuedMutations, authenticatedUserId]);

  useEffect(() => {
    const unsubscribe = subscribeToMutationQueue(setAllQueuedMutations);
    void initializeMutationQueue().catch((error) => {
      setDataWarning(error instanceof Error ? error.message : "Secure offline changes are unavailable.");
    });
    return unsubscribe;
  }, []);

  const flushPendingMutations = async () => {
    const ownerUserId = apiClient.getAuthenticatedUserId();
    if (!ownerUserId) return;
    setSyncBusy(true);
    try {
      const result = await drainMutationQueue(ownerUserId, (operation) => apiClient.executeQueuedMutation(operation));
      // Reconcile optimistic updates with server truth silently in background
      if (result.succeeded > 0 || result.blocked > 0) await refreshDataRef.current({ silent: true });
    } finally {
      setSyncBusy(false);
    }
  };

  const syncMutation = async (
    endpoint: string,
    method: "POST" | "PATCH" | "DELETE",
    body?: unknown,
    descriptor?: MutationDescriptor,
  ) => {
    const ownerUserId = apiClient.getAuthenticatedUserId();
    if (!ownerUserId) return;
    try {
      await enqueueMutation({
        endpoint,
        method,
        body,
        ownerUserId,
        label: descriptor?.label || "Care record change",
        resourceType: descriptor?.resourceType || "record",
        resourceId: descriptor?.resourceId,
        parentId: descriptor?.parentId || activeParentId,
        expectedVersion: descriptor?.expectedVersion,
      });
      await flushPendingMutations();
    } catch (error) {
      setDataWarning(error instanceof Error ? error.message : "A change is waiting to synchronize.");
    }
  };

  const retrySyncMutation = async (id: string, overwrite = false) => {
    await retryQueuedMutation(id, overwrite);
    await flushPendingMutations();
  };

  const discardSyncMutation = async (id: string) => {
    await discardQueuedMutation(id);
    reconciliationPendingRef.current = true;
    await refreshDataRef.current();
  };

  useEffect(() => NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      void (async () => {
        await flushPendingMutations();
        if (reconciliationPendingRef.current) await refreshDataRef.current();
      })();
    }
  }), [authVersion]);

  useEffect(() => {
    const retryable = syncQueue.filter((item) => item.state === "pending");
    if (retryable.length === 0 || syncBusy) return;
    const nextAttempt = Math.min(...retryable.map((item) => item.nextAttemptAt ? Date.parse(item.nextAttemptAt) : Date.now()));
    const timer = setTimeout(() => void flushPendingMutations(), Math.max(250, nextAttempt - Date.now()));
    return () => clearTimeout(timer);
  }, [syncQueue, syncBusy]);

  useEffect(() => {
    if (!runtimeReady || !activeParentId || !hydratedParentIds.has(activeParentId)) return;
    void syncCareReminders(currentData.medicines, currentData.appointments);
  }, [runtimeReady, activeParentId, currentData.medicines, currentData.appointments, hydratedParentIds]);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = apiClient.onAuthStateChange((authenticated) => {
      const userId = authenticated ? apiClient.getAuthenticatedUserId() : null;
      refreshGenerationRef.current += 1;
      setDataLoading(authenticated);
      setDataError(null);
      setDataWarning(null);
      setDataStore({});
      setDosesTakenToday({});
      setHydratedParentIds(new Set());
      setFamilyMembers([]);
      setCurrentUser(EMPTY_CURRENT_USER);
      setActiveParentId("");
      setActiveScreen("tabs");
      setHasCompletedOnboardingState(Boolean(userId && onboardingCompletionUserIdRef.current === userId));
      setAuthVersion((value) => value + 1);
    });
    void (async () => {
      const [storedState, storedDataStore, storedTheme] = await Promise.all([
        AsyncStorage.getItem(APP_STATE_KEY),
        AsyncStorage.getItem(DATA_STORE_KEY),
        AsyncStorage.getItem("@parentpulse_theme_mode"),
        apiClient.restoreSession(),
      ]);
      if (!mounted) return;
      if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "amber") {
        setThemeModeState(storedTheme);
        applyTheme(storedTheme);
      }
      if (storedDataStore) {
        try {
          const parsedDataStore = JSON.parse(storedDataStore);
          if (parsedDataStore && typeof parsedDataStore === "object" && Object.keys(parsedDataStore).length > 0) {
            setDataStore(parsedDataStore);
            setHydratedParentIds(new Set(Object.keys(parsedDataStore)));
            const firstId = Object.keys(parsedDataStore)[0];
            if (firstId) setActiveParentId((curr) => curr || firstId);
          }
        } catch {
          // ignore cache read error
        }
      }
      setDataLoading(apiClient.isAuthenticated());
      if (storedState) {
        try {
          const parsed = JSON.parse(storedState);
          if (parsed.activeParentId) setActiveParentId(parsed.activeParentId);
          if (parsed.language) setLanguage(parsed.language);
          if (typeof parsed.seniorMode === "boolean") setSeniorMode(parsed.seniorMode);
          if (parsed.themeMode === "light" || parsed.themeMode === "dark" || parsed.themeMode === "amber") {
            setThemeModeState(parsed.themeMode);
            applyTheme(parsed.themeMode);
          }
          if (typeof parsed.onboardingCompletionUserId === "string") {
            onboardingCompletionUserIdRef.current = parsed.onboardingCompletionUserId;
            setOnboardingCompletionUserId(parsed.onboardingCompletionUserId);
            setHasCompletedOnboardingState(
              parsed.onboardingCompletionUserId === apiClient.getAuthenticatedUserId(),
            );
          }
        } catch {
          await AsyncStorage.removeItem(APP_STATE_KEY);
        }
      }
      setRuntimeReady(true);
    })();
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!runtimeReady) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      void AsyncStorage.setItem(APP_STATE_KEY, JSON.stringify({
        activeParentId,
        language,
        seniorMode,
        themeMode,
        onboardingCompletionUserId,
      }));
      void AsyncStorage.setItem("@parentpulse_theme_mode", themeMode);
      if (Object.keys(dataStore).length > 0) {
        void AsyncStorage.setItem(DATA_STORE_KEY, JSON.stringify(dataStore));
      }
    }, 250);
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [runtimeReady, activeParentId, language, seniorMode, themeMode, onboardingCompletionUserId, dataStore]);

  const setHasCompletedOnboarding = useCallback((completed: boolean) => {
    const ownerUserId = completed ? apiClient.getAuthenticatedUserId() : null;
    onboardingCompletionUserIdRef.current = ownerUserId;
    setOnboardingCompletionUserId(ownerUserId);
    setHasCompletedOnboardingState(completed && Boolean(ownerUserId));
  }, []);

  const refreshLocation = async () => {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) return;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const cachedLocation = await Location.getLastKnownPositionAsync({
        maxAge: 5 * 60 * 1000,
        requiredAccuracy: 1000,
      });
      if (cachedLocation) {
        setUserLocation({
          latitude: cachedLocation.coords.latitude,
          longitude: cachedLocation.coords.longitude,
        });
      }

      try {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      } catch {
        // Keep the cached or parent-profile location when a live GPS fix is unavailable.
      }
    } catch {
      // Location is optional; map screens already fall back to the parent profile coordinates.
    }
  };

  const refreshData = useCallback(async (options?: { silent?: boolean; preserveScreen?: boolean }) => {
    const generation = ++refreshGenerationRef.current;
    const ownerUserId = apiClient.getAuthenticatedUserId();
    const isCurrentRefresh = () => (
      generation === refreshGenerationRef.current
      && ownerUserId !== null
      && ownerUserId === apiClient.getAuthenticatedUserId()
      && apiClient.isAuthenticated()
    );

    if (!apiClient.isAuthenticated()) {
      setDataLoading(false);
      setDataStore({});
      setDosesTakenToday({});
      setHydratedParentIds(new Set());
      setFamilyMembers([]);
      setCurrentUser(EMPTY_CURRENT_USER);
      setHasCompletedOnboardingState(false);
      setDataError(null);
      setDataWarning(null);
      reconciliationPendingRef.current = false;
      return;
    }
    if (!options?.silent) {
      setDataLoading(true);
    }
    setDataWarning(null);
    try {
      const [profile, families] = await Promise.all([apiClient.getCurrentUser(), apiClient.listFamilies()]);
      if (!isCurrentRefresh()) return;
      if (families.length === 0) {
        setCurrentUser({ ...profile, role: "family_member" });
        setFamilyMembers([]);
        setDataStore({});
        setDosesTakenToday({});
        setHydratedParentIds(new Set());
        setActiveParentId("");
        setHasCompletedOnboardingState(
          onboardingCompletionUserIdRef.current === apiClient.getAuthenticatedUserId(),
        );
        setActiveScreen("onboarding");
        setDataError(null);
        reconciliationPendingRef.current = false;
        return;
      }

      const parents = (await Promise.all(families.map((family) => apiClient.listFamilyParents(family.id)))).flat();
      if (!isCurrentRefresh()) return;
      const normalizedParents = parents.map(normalizeParentProfile);
      const members: FamilyMemberItem[] = families.flatMap((family) => (family.members || []).map((member: any) => ({
        id: member.id,
        family_id: member.family_id,
        user_id: member.user_id,
        name: member.user?.full_name || member.user?.email || "Family member",
        relationship: member.relationship_name,
        role: member.role,
        email: member.user?.email || "",
        phone: member.user?.phone_number,
        avatar_initials: (member.user?.full_name || member.user?.email || "FM").split(/\s+/).map((part: string) => part[0]).join("").slice(0, 2).toUpperCase(),
        is_owner: family.created_by === member.user_id,
        can_manage_medicines: member.can_manage_medicines,
        can_manage_appointments: member.can_manage_appointments,
        can_upload_documents: member.can_upload_documents,
        can_share_doctor_brief: member.can_share_doctor_brief,
        can_view_location_history: member.can_view_location_history,
      })));
      setCurrentUser({ ...profile, role: members.find((member) => member.user_id === profile.id)?.role || "family_member" });
      setFamilyMembers(members);
      setActiveParentId((current) => current || normalizedParents[0]?.id || "");
      if (!options?.preserveScreen && activeScreenRef.current !== "onboarding") {
        onboardingCompletionUserIdRef.current = ownerUserId;
        setOnboardingCompletionUserId(ownerUserId);
        setHasCompletedOnboardingState(true);
        setActiveScreen((current) => current === "onboarding" ? "tabs" : current);
      }
      setDataError(null);
      if (!options?.silent) {
        setDataLoading(false);
      }
      reconciliationPendingRef.current = false;

      const unavailableDomains = new Set<string>();
      // Load one parent's domains at a time and only three domains concurrently.
      // This prevents large care circles from exhausting mobile/network resources.
      const entries: (readonly [string, ParentData])[] = [];
      for (const parent of parents) {
        if (!isCurrentRefresh()) return;
        const domainNames = ["medicines", "appointments", "documents", "timeline", "measurements", "visits", "tasks", "expenses", "insurance", "dose history"] as const;
        const domainLoaders = [
          () => apiClient.listMedicines(parent.id),
          () => apiClient.listAppointments(parent.id),
          () => apiClient.listDocuments(parent.id),
          () => apiClient.listTimeline(parent.id),
          () => apiClient.listMeasurements(parent.id),
          () => apiClient.listLocationVisits(parent.id),
          () => apiClient.listTasks(parent.id),
          () => apiClient.listExpenses(parent.id),
          () => apiClient.listInsurance(parent.id),
          () => apiClient.listDoseHistory(parent.id),
        ];
        const results: PromiseSettledResult<any[]>[] = [];
        for (let start = 0; start < domainLoaders.length; start += 3) {
          if (!isCurrentRefresh()) return;
          results.push(...await Promise.allSettled(
            domainLoaders.slice(start, start + 3).map((load) => load()),
          ));
        }
        const domainData = results.map((result, index) => {
          if (result.status === "fulfilled") return result.value;
          unavailableDomains.add(domainNames[index]);
          return [];
        });
        const [medicines, appointments, documents, timeline, measurements, visits, tasks, expenses, insurance, doseLogs] = domainData;
        const currentCached = dataStoreRef.current[parent.id];
        const mergedData: ParentData = {
          profile: normalizeParentProfile(parent),
          medicines: mergeById(currentCached?.medicines, medicines),
          appointments: mergeById(currentCached?.appointments, appointments),
          documents: mergeById(currentCached?.documents, documents),
          timeline: mergeById(currentCached?.timeline, timeline),
          measurements: mergeById(currentCached?.measurements, measurements),
          visits: mergeById(currentCached?.visits, visits),
          tasks: mergeById(currentCached?.tasks, tasks),
          expenses: mergeById(currentCached?.expenses, expenses),
          insurance: mergeById(currentCached?.insurance, insurance),
          doseLogs: mergeById(currentCached?.doseLogs, doseLogs),
        };
        const entry = [parent.id, mergedData] as const;
        entries.push(entry);
        if (isCurrentRefresh()) {
          setDataStore((current) => ({ ...current, [parent.id]: mergedData }));
          setHydratedParentIds((current) => new Set(current).add(parent.id));
        }
      }
      if (!isCurrentRefresh()) return;
      const nextStore = Object.fromEntries(entries) as Record<string, ParentData>;
      setDataStore((prev) => ({ ...prev, ...nextStore }));
      setHydratedParentIds(new Set(entries.map(([parentId]) => parentId)));
      const today = new Date().toDateString();
      setDosesTakenToday(Object.fromEntries(entries.flatMap(([, data]) => data.doseLogs
        .filter((log) => log.status === "taken" && new Date(log.recorded_at || log.scheduled_time).toDateString() === today)
        .map((log) => [log.medicine_id, true]))));
      setActiveParentId((current) => nextStore[current] ? current : parents[0]?.id || "");
      if (unavailableDomains.size > 0) {
        setDataWarning(`${unavailableDomains.size} care ${unavailableDomains.size === 1 ? "service is" : "services are"} temporarily unavailable. Your available live records are still shown.`);
      }
    } catch (error) {
      if (isCurrentRefresh()) {
        setDataError(error instanceof Error ? error.message : "Could not verify your account and care circle.");
      }
    } finally {
      if (generation === refreshGenerationRef.current && !options?.silent) setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDataRef.current = refreshData;
  }, [refreshData]);

  useEffect(() => {
    if (!runtimeReady) return;
    const dataTimer = setTimeout(() => void refreshData(), 0);
    return () => clearTimeout(dataTimer);
  }, [runtimeReady, authVersion, refreshData]);

  const toggleSeniorMode = () => setSeniorMode((prev) => !prev);

  const updateParentData = useCallback((parentId: string, update: (current: ParentData) => ParentData) => {
    if (!parentId) return;
    setDataStore((previous) => {
      const current = previous[parentId];
      return current ? { ...previous, [parentId]: update(current) } : previous;
    });
  }, []);

  const updateActiveParentProfile = (updated: Partial<ParentProfile>) => {
    const parentId = activeParentId;
    const parentData = dataStore[parentId];
    if (!parentData) return;
    updateParentData(parentId, (current) => ({
      ...current,
      profile: { ...current.profile, ...updated },
    }));

    void syncMutation(`/parents/${parentId}`, "PATCH", updated, {
      label: `Update ${parentData.profile.full_name || "parent"} profile`,
      resourceType: "parent profile",
      resourceId: parentId,
      expectedVersion: parentData.profile.updated_at,
      parentId,
    });
  };

  const markDoseTaken = (medicineId: string) => {
    if (dosesTakenToday[medicineId]) return;
    const medicine = currentData.medicines.find((item) => item.id === medicineId);
    setDosesTakenToday((prev) => ({
      ...prev,
      [medicineId]: true,
    }));
    void syncMutation(`/medicines/${medicineId}/doses`, "POST", { status: "taken" }, {
      label: `Record ${medicine?.name || "medicine"} dose`,
      resourceType: "dose",
      resourceId: medicineId,
      parentId: activeParentId,
    });
  };

  const addDocument = (doc: MedicalDocument) => {
    const parentId = doc.parent_id;
    updateParentData(parentId, (current) => {
      const existing = current.documents;
      const documents = existing.some((item) => item.id === doc.id)
        ? existing.map((item) => {
          if (item.id !== doc.id) return item;
          if (item.status === "extracted" && (doc.status === "pending" || doc.status === "processing")) {
            return {
              ...doc,
              status: "extracted" as const,
              summary: item.summary || doc.summary,
              extracted_fields: item.extracted_fields || doc.extracted_fields,
              extracted_tags: item.extracted_tags || doc.extracted_tags,
              raw_ocr_text: item.raw_ocr_text || doc.raw_ocr_text,
            };
          }
          return doc;
        })
        : [doc, ...existing];
      return { ...current, documents };
    });
  };

  const deleteDocument = (docId: string) => {
    const parentId = activeParentId;
    updateParentData(parentId, (current) => ({ ...current, documents: current.documents.filter((d) => d.id !== docId) }));
    const document = currentData.documents.find((item) => item.id === docId);
    void syncMutation(`/documents/${docId}`, "DELETE", undefined, {
      label: `Archive ${document?.title || "medical document"}`,
      resourceType: "document",
      resourceId: docId,
      expectedVersion: document?.updated_at,
      parentId,
    });
  };

  const addAppointment = (app: Appointment) => {
    const parentId = app.parent_id;
    updateParentData(parentId, (current) => ({ ...current, appointments: [app, ...current.appointments] }));
    void syncMutation("/appointments", "POST", { ...app, family_id: dataStore[parentId]?.profile.family_id }, {
      label: `Schedule appointment with ${app.doctor_name}`,
      resourceType: "appointment",
      resourceId: app.id,
      parentId,
    });
  };

  const deleteAppointment = (appId: string) => {
    const parentId = activeParentId;
    updateParentData(parentId, (current) => ({ ...current, appointments: current.appointments.filter((a) => a.id !== appId) }));
    const appointment = currentData.appointments.find((item) => item.id === appId);
    void syncMutation(`/appointments/${appId}`, "PATCH", { status: "cancelled" }, {
      label: `Cancel ${appointment?.doctor_name || "doctor"} appointment`,
      resourceType: "appointment",
      resourceId: appId,
      expectedVersion: appointment?.updated_at,
      parentId,
    });
  };

  const addMedicine = (med: MedicineSchedule) => {
    const parentId = med.parent_id;
    updateParentData(parentId, (current) => ({ ...current, medicines: [med, ...current.medicines] }));
    void syncMutation("/medicines", "POST", { ...med, family_id: dataStore[parentId]?.profile.family_id }, {
      label: `Add ${med.name}`,
      resourceType: "medicine",
      resourceId: med.id,
      parentId,
    });
  };

  const deleteMedicine = (medId: string) => {
    const parentId = activeParentId;
    updateParentData(parentId, (current) => ({ ...current, medicines: current.medicines.filter((m) => m.id !== medId) }));
    const medicine = currentData.medicines.find((item) => item.id === medId);
    void syncMutation(`/medicines/${medId}`, "PATCH", { is_active: false }, {
      label: `Stop ${medicine?.name || "medicine"}`,
      resourceType: "medicine",
      resourceId: medId,
      expectedVersion: medicine?.updated_at,
      parentId,
    });
  };

  // Care Tasks Management
  const addTask = (task: CareTask) => {
    const parentId = task.parent_id;
    updateParentData(parentId, (current) => ({ ...current, tasks: [task, ...current.tasks] }));

    void syncMutation("/tasks", "POST", task, {
      label: `Create task: ${task.title}`,
      resourceType: "task",
      resourceId: task.id,
      parentId,
    });
  };

  const toggleTaskCompleted = (taskId: string) => {
    const parentId = activeParentId;
    const task = currentData.tasks.find((item) => item.id === taskId);
    if (!task) return;
    const nextStatus = task.status === "completed" ? "pending" : "completed";
    updateParentData(parentId, (current) => {
      const currentTasks = current.tasks;
      const updatedTasks = currentTasks.map((item) => item.id === taskId
        ? { ...item, status: nextStatus as CareTask["status"] }
        : item);
      return { ...current, tasks: updatedTasks };
    });
    void syncMutation(`/tasks/${taskId}`, "PATCH", { status: nextStatus }, {
      label: `${nextStatus === "completed" ? "Complete" : "Reopen"} task: ${task.title}`,
      resourceType: "task",
      resourceId: taskId,
      expectedVersion: task.updated_at,
      parentId,
    });
  };

  const deleteTask = (taskId: string) => {
    const parentId = activeParentId;
    updateParentData(parentId, (current) => ({ ...current, tasks: current.tasks.filter((t) => t.id !== taskId) }));

    const task = currentData.tasks.find((item) => item.id === taskId);
    void syncMutation(`/tasks/${taskId}`, "DELETE", undefined, {
      label: `Delete task: ${task?.title || "care task"}`,
      resourceType: "task",
      resourceId: taskId,
      expectedVersion: task?.updated_at,
      parentId,
    });
  };

  // Expenses & Insurance Management
  const addExpense = (expense: HealthcareExpense) => {
    const parentId = expense.parent_id;
    updateParentData(parentId, (current) => ({ ...current, expenses: [expense, ...current.expenses] }));

    void syncMutation("/expenses", "POST", expense, {
      label: `Add expense: ${expense.title}`,
      resourceType: "expense",
      resourceId: expense.id,
      parentId,
    });
  };

  const addInsurance = (policy: InsurancePolicy) => {
    const parentId = policy.parent_id;
    updateParentData(parentId, (current) => ({ ...current, insurance: [policy, ...current.insurance] }));

    void syncMutation("/expenses/insurance", "POST", policy, {
      label: `Add ${policy.provider} policy`,
      resourceType: "insurance",
      resourceId: policy.id,
      parentId,
    });
  };

  // Family Members & Caregiver Management
  const logNewMeasurement = (vitalType: any, val: number, valSec?: number, notes?: string) => {
    const parentId = activeParentId;
    const now = new Date();
    const isoNow = now.toISOString();
    const todayLocalDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const unit = vitalType === "blood_pressure" ? "mmHg" : vitalType === "blood_sugar" ? "mg/dL" : "bpm";

    let resourceId = Crypto.randomUUID();

    updateParentData(parentId, (current) => {
      // Find if a vital measurement for this metric was already logged today
      const existingIndex = current.measurements.findIndex((m) => {
        if (m.vital_type !== vitalType) return false;
        if (!m.recorded_at) return false;
        const mDate = new Date(m.recorded_at);
        const mLocalDate = !Number.isNaN(mDate.getTime())
          ? `${mDate.getFullYear()}-${String(mDate.getMonth() + 1).padStart(2, "0")}-${String(mDate.getDate()).padStart(2, "0")}`
          : m.recorded_at.slice(0, 10);
        return mLocalDate === todayLocalDate || m.recorded_at.slice(0, 10) === isoNow.slice(0, 10);
      });

      if (existingIndex >= 0) {
        const existing = current.measurements[existingIndex];
        resourceId = existing.id;
        const updated: HealthMeasurement = {
          ...existing,
          value_numeric: val,
          value_secondary: valSec,
          unit,
          recorded_at: isoNow,
          notes: notes ?? existing.notes,
        };
        const updatedList = [...current.measurements];
        updatedList[existingIndex] = updated;
        return { ...current, measurements: updatedList };
      } else {
        const newMeasurement: HealthMeasurement = {
          id: resourceId,
          parent_id: parentId,
          vital_type: vitalType,
          value_numeric: val,
          value_secondary: valSec,
          unit,
          recorded_at: isoNow,
          notes,
        };
        return { ...current, measurements: [newMeasurement, ...current.measurements] };
      }
    });

    void syncMutation("/measurements", "POST", {
      parent_id: parentId,
      vital_type: vitalType,
      value_numeric: val,
      value_secondary: valSec,
      unit,
      recorded_at: isoNow,
      notes,
    }, {
      label: `Record ${vitalType.replace(/_/g, " ")}`,
      resourceType: "measurement",
      resourceId,
      parentId,
    });
  };

  const recordNewVisit = (placeName: string, category: any, address: string) => {
    const parentId = activeParentId;
    const coordinates = userLocation || (
      currentData.profile.latitude != null && currentData.profile.longitude != null
        ? { latitude: currentData.profile.latitude, longitude: currentData.profile.longitude }
        : null
    );
    if (!coordinates) return;
    const newVisit: LocationVisit = {
      id: Crypto.randomUUID(),
      parent_id: parentId,
      place_name: placeName,
      category,
      address,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      visited_at: "Today, confirmed",
      notes: "Checked in via ParentPulse",
    };
    updateParentData(parentId, (current) => ({ ...current, visits: [newVisit, ...current.visits] }));

    void syncMutation(`/parents/${parentId}/locations/visits`, "POST", {
      parent_id: parentId,
      place_name: placeName,
      category,
      address,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      notes: "Checked in via ParentPulse",
    }, {
      label: `Check in at ${placeName}`,
      resourceType: "visit",
      resourceId: newVisit.id,
      parentId,
    });
  };

  const deleteVisit = (id: string) => {
    const parentId = activeParentId;
    updateParentData(parentId, (current) => ({
      ...current,
      visits: current.visits.filter((v) => v.id !== id),
    }));

    void syncMutation(`/parents/${parentId}/locations/visits/${id}`, "DELETE", undefined, {
      label: "Delete healthcare visit",
      resourceType: "visit",
      resourceId: id,
      parentId,
    });
  };

  const registerNewParentAndFamily = async (
    familyName: string,
    parentData: any
  ): Promise<ParentProfile> => {
    if (!apiClient.isAuthenticated()) throw new Error("Sign in before creating a care circle.");
    const family = await apiClient.createFamily(familyName);
    if (!family?.id) throw new Error("The server did not create the family.");
    const newProfile = await apiClient.createParentProfile({ ...parentData, family_id: family.id });
    const normalized = normalizeParentProfile(newProfile);
    const newEntry = emptyParentData(normalized);

    setDataStore((prev) => ({
      ...prev,
      [normalized.id]: newEntry,
    }));

    setActiveParentId(normalized.id);
    await refreshData({ silent: true, preserveScreen: true });

    return normalized;
  };

  const deleteMeasurement = (id: string) => {
    const parentId = activeParentId;
    updateParentData(parentId, (current) => ({
      ...current,
      measurements: current.measurements.filter((m) => m.id !== id),
    }));
    void syncMutation(`/measurements/${id}`, "DELETE", undefined, {
      label: "Delete health measurement",
      resourceType: "measurement",
      resourceId: id,
      parentId,
    });
  };

  const deleteExpense = (id: string) => {
    const parentId = activeParentId;
    updateParentData(parentId, (current) => ({
      ...current,
      expenses: current.expenses.filter((e) => e.id !== id),
    }));
    void syncMutation(`/expenses/${id}`, "DELETE", undefined, {
      label: "Delete expense",
      resourceType: "expense",
      resourceId: id,
      parentId,
    });
  };

  const deleteInsurance = (id: string) => {
    const parentId = activeParentId;
    updateParentData(parentId, (current) => ({
      ...current,
      insurance: current.insurance.filter((p) => p.id !== id),
    }));
    void syncMutation(`/expenses/insurance/${id}`, "DELETE", undefined, {
      label: "Delete insurance policy",
      resourceType: "insurance",
      resourceId: id,
      parentId,
    });
  };

  const addDoctor = (doc: PrimaryDoctor) => {
    const parentId = activeParentId;
    const parentData = dataStore[parentId];
    if (!parentData) return;
    const doctors = [...(parentData.profile.primary_doctors || []), doc];
    updateActiveParentProfile({ primary_doctors: doctors });
  };

  const updateDoctor = (index: number, updated: PrimaryDoctor) => {
    const parentId = activeParentId;
    const parentData = dataStore[parentId];
    if (!parentData) return;
    const doctors = [...(parentData.profile.primary_doctors || [])];
    if (index >= 0 && index < doctors.length) {
      doctors[index] = updated;
      updateActiveParentProfile({ primary_doctors: doctors });
    }
  };

  const deleteDoctor = (index: number) => {
    const parentId = activeParentId;
    const parentData = dataStore[parentId];
    if (!parentData) return;
    const doctors = [...(parentData.profile.primary_doctors || [])];
    if (index >= 0 && index < doctors.length) {
      doctors.splice(index, 1);
      updateActiveParentProfile({ primary_doctors: doctors });
    }
  };

  const addTimelineEvent = (event: TimelineEvent) => {
    const parentId = event.parent_id;
    updateParentData(parentId, (current) => ({
      ...current,
      timeline: [event, ...current.timeline],
    }));
    void syncMutation("/timeline", "POST", event, {
      label: `Add timeline milestone: ${event.title}`,
      resourceType: "timeline",
      resourceId: event.id,
      parentId,
    });
  };

  const updateTimelineEvent = (event: TimelineEvent) => {
    const parentId = event.parent_id;
    updateParentData(parentId, (current) => ({
      ...current,
      timeline: current.timeline.map((t) => (t.id === event.id ? event : t)),
    }));
    void syncMutation(`/timeline/${event.id}`, "PATCH", event, {
      label: `Update timeline milestone: ${event.title}`,
      resourceType: "timeline",
      resourceId: event.id,
      parentId,
    });
  };

  const deleteTimelineEvent = (id: string) => {
    const parentId = activeParentId;
    updateParentData(parentId, (current) => ({
      ...current,
      timeline: current.timeline.filter((t) => t.id !== id),
    }));
    void syncMutation(`/timeline/${id}`, "DELETE", undefined, {
      label: "Delete timeline milestone",
      resourceType: "timeline",
      resourceId: id,
      parentId,
    });
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    const updated = await apiClient.updateUserProfile(data);
    setCurrentUser((prev) => ({ ...prev, ...updated }));
  };

  const updateUserAvatar = async (uri: string, filename?: string, mimeType?: string) => {
    const updated = await apiClient.uploadAvatar(uri, filename, mimeType);
    setCurrentUser((prev) => ({ ...prev, ...updated }));
  };

  return (
    <AppContext.Provider
      value={{
        runtimeReady,
        isAuthenticated,
        dataLoading,
        dataError,
        dataWarning,
        refreshData,
        syncQueue,
        syncBusy,
        syncCenterVisible,
        setSyncCenterVisible,
        retrySyncMutation,
        discardSyncMutation,
        syncNow: flushPendingMutations,
        activeParent: currentData.profile,
        parentList: Object.values(dataStore).map((d) => d.profile),
        setActiveParentId,
        updateActiveParentProfile,
        seniorMode,
        toggleSeniorMode,
        language,
        setLanguage,
        themeMode,
        setThemeMode,
        isDark: themeMode === "dark",
        activeScreen,
        setActiveScreen,
        hasCompletedOnboarding,
        setHasCompletedOnboarding,
        registerNewParentAndFamily,
        userLocation,
        refreshLocation,
        medicines: currentData.medicines,
        dosesTakenToday,
        markDoseTaken,
        addMedicine,
        deleteMedicine,
        appointments: currentData.appointments,
        addAppointment,
        deleteAppointment,
        documents: currentData.documents,
        addDocument,
        deleteDocument,
        timeline: currentData.timeline,
        addTimelineEvent,
        updateTimelineEvent,
        deleteTimelineEvent,
        measurements: currentData.measurements,
        logNewMeasurement,
        deleteMeasurement,
        visits: currentData.visits,
        recordNewVisit,
        deleteVisit,
        tasks: currentData.tasks,
        addTask,
        toggleTaskCompleted,
        deleteTask,
        expenses: currentData.expenses,
        addExpense,
        deleteExpense,
        insurance: currentData.insurance,
        addInsurance,
        deleteInsurance,
        addDoctor,
        updateDoctor,
        deleteDoctor,
        familyMembers,
        currentUser,
        updateUserProfile,
        updateUserAvatar,
        sosModalVisible,
        setSosModalVisible,
        doctorShareModalVisible,
        setDoctorShareModalVisible,
        aiAssistantModalVisible,
        setAiAssistantModalVisible,
        logVitalModalVisible,
        setLogVitalModalVisible,
        scannerModalVisible,
        setScannerModalVisible,
        scannerMode,
        setScannerMode,
        authModalVisible,
        setAuthModalVisible,
        reportModalVisible,
        setReportModalVisible,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
