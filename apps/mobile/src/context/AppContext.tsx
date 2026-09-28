import React, { createContext, useCallback, useContext, useState, useEffect, useRef } from "react";
import * as Location from "expo-location";
import * as Crypto from "expo-crypto";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import {
  ParentProfile,
  MedicalDocument,
  MedicineSchedule,
  Appointment,
  TimelineEvent,
  HealthMeasurement,
  HealthcarePlace,
  LocationVisit,
  CareTask,
  HealthcareExpense,
  InsurancePolicy,
  FamilyMemberItem,
  UserProfile,
} from "../types";
import { apiClient } from "../api/client";
import { syncCareReminders } from "../services/reminders";
import { drainMutationQueue, enqueueMutation } from "../services/mutationQueue";

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
  refreshData: () => Promise<void>;
  activeParent: ParentProfile;
  parentList: ParentProfile[];
  setActiveParentId: (id: string) => void;
  updateActiveParentProfile: (updated: Partial<ParentProfile>) => void;

  seniorMode: boolean;
  toggleSeniorMode: () => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;

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

  logNewMeasurement: (vitalType: any, val: number, valSec?: number, notes?: string) => void;
  recordNewVisit: (placeName: string, category: any, address: string) => void;

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

const AppContext = createContext<AppContextType | undefined>(undefined);

const APP_STATE_KEY = "parentpulse.app-state.v2";

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [runtimeReady, setRuntimeReady] = useState(false);
  const [authVersion, setAuthVersion] = useState(0);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeParentId, setActiveParentId] = useState<string>("");
  const [seniorMode, setSeniorMode] = useState<boolean>(false);
  const [language, setLanguage] = useState<SupportedLanguage>("en");
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>("tabs");
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Per-parent data cache
  const [dataStore, setDataStore] = useState<Record<string, ParentData>>({});

  const [familyMembers, setFamilyMembers] = useState<FamilyMemberItem[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile>(EMPTY_CURRENT_USER);

  const [dosesTakenToday, setDosesTakenToday] = useState<Record<string, boolean>>({});

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
    const handleResponse = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;
      if (data?.type !== "sos" || typeof data.sosEventId !== "string") return;
      const acknowledgement = response.actionIdentifier === "responding" ? "responding" : "acknowledged";
      void apiClient.acknowledgeSosEvent(data.sosEventId, acknowledgement);
      if (acknowledgement === "responding") setSosModalVisible(true);
    };
    const initial = Notifications.getLastNotificationResponse();
    if (initial) handleResponse(initial);
    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => subscription.remove();
  }, []);

  const currentData = dataStore[activeParentId] || emptyParentData();
  const isAuthenticated = apiClient.isAuthenticated();

  const flushPendingMutations = async () => {
    if (!apiClient.isAuthenticated()) return;
    await drainMutationQueue((operation) => apiClient.executeQueuedMutation(operation));
  };

  const syncMutation = async (
    endpoint: string,
    method: "POST" | "PATCH" | "DELETE",
    body?: unknown,
  ) => {
    try {
      await enqueueMutation({ endpoint, method, body });
      await flushPendingMutations();
    } catch {
      // The durable queue is retried on the next connectivity or authentication change.
    }
  };

  useEffect(() => NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) void flushPendingMutations();
  }), [authVersion]);

  useEffect(() => {
    if (!runtimeReady) return;
    void syncCareReminders(currentData.medicines, currentData.appointments);
  }, [runtimeReady, activeParentId, currentData.medicines, currentData.appointments]);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = apiClient.onAuthStateChange(() => setAuthVersion((value) => value + 1));
    void (async () => {
      const [storedState] = await Promise.all([
        AsyncStorage.getItem(APP_STATE_KEY),
        apiClient.restoreSession(),
      ]);
      if (!mounted) return;
      if (storedState) {
        try {
          const parsed = JSON.parse(storedState);
          if (parsed.activeParentId) setActiveParentId(parsed.activeParentId);
          if (parsed.language) setLanguage(parsed.language);
          if (typeof parsed.seniorMode === "boolean") setSeniorMode(parsed.seniorMode);
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
      }));
    }, 250);
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [runtimeReady, activeParentId, language, seniorMode]);

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

  const refreshData = useCallback(async () => {
    if (!apiClient.isAuthenticated()) {
      setDataStore({});
      setFamilyMembers([]);
      setCurrentUser(EMPTY_CURRENT_USER);
      setHasCompletedOnboarding(false);
      setDataError(null);
      return;
    }
    setDataLoading(true);
    setDataError(null);
    try {
      const [profile, families] = await Promise.all([apiClient.getCurrentUser(), apiClient.listFamilies()]);
      const parents = (await Promise.all(families.map((family) => apiClient.listFamilyParents(family.id)))).flat();
      const entries = await Promise.all(parents.map(async (parent) => {
        const [medicines, appointments, documents, timeline, measurements, visits, tasks, expenses, insurance] = await Promise.all([
          apiClient.listMedicines(parent.id),
          apiClient.listAppointments(parent.id),
          apiClient.listDocuments(parent.id),
          apiClient.listTimeline(parent.id),
          apiClient.listMeasurements(parent.id),
          apiClient.listLocationVisits(parent.id),
          apiClient.listTasks(parent.id),
          apiClient.listExpenses(parent.id),
          apiClient.listInsurance(parent.id),
        ]);
        return [parent.id, { profile: parent, medicines, appointments, documents, timeline, measurements, visits, tasks, expenses, insurance }] as const;
      }));
      const nextStore = Object.fromEntries(entries) as Record<string, ParentData>;
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
        can_manage_medicines: member.can_manage_medicines,
        can_manage_appointments: member.can_manage_appointments,
        can_upload_documents: member.can_upload_documents,
        can_share_doctor_brief: member.can_share_doctor_brief,
        can_view_location_history: member.can_view_location_history,
      })));
      setCurrentUser({ ...profile, role: members.find((member) => member.user_id === profile.id)?.role || "family_member" });
      setFamilyMembers(members);
      setDataStore(nextStore);
      setActiveParentId((current) => nextStore[current] ? current : parents[0]?.id || "");
      setHasCompletedOnboarding(parents.length > 0);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Could not load your live care data.");
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!runtimeReady) return;
    const locationTimer = setTimeout(() => void refreshLocation(), 0);
    const dataTimer = setTimeout(() => void refreshData(), 0);
    return () => { clearTimeout(locationTimer); clearTimeout(dataTimer); };
  }, [runtimeReady, authVersion, refreshData]);

  const toggleSeniorMode = () => setSeniorMode((prev) => !prev);

  const updateActiveParentProfile = (updated: Partial<ParentProfile>) => {
    setDataStore((prev) => {
      const current = prev[activeParentId];
      if (!current) return prev;
      return {
        ...prev,
        [activeParentId]: {
          ...current,
          profile: {
            ...current.profile,
            ...updated,
          },
        },
      };
    });

    void syncMutation(`/parents/${activeParentId}`, "PATCH", updated);
  };

  const markDoseTaken = (medicineId: string) => {
    setDosesTakenToday((prev) => {
      const willBeTaken = !prev[medicineId];
      void syncMutation(`/medicines/${medicineId}/doses`, "POST", { status: willBeTaken ? "taken" : "missed" });
      return {
        ...prev,
        [medicineId]: willBeTaken,
      };
    });
  };

  const addDocument = (doc: MedicalDocument) => {
    setDataStore((prev) => {
      const existing = prev[activeParentId].documents;
      const documents = existing.some((item) => item.id === doc.id)
        ? existing.map((item) => item.id === doc.id ? doc : item)
        : [doc, ...existing];
      return { ...prev, [activeParentId]: { ...prev[activeParentId], documents } };
    });
  };

  const deleteDocument = (docId: string) => {
    setDataStore((prev) => ({
      ...prev,
      [activeParentId]: {
        ...prev[activeParentId],
        documents: prev[activeParentId].documents.filter((d) => d.id !== docId),
      },
    }));
    void syncMutation(`/documents/${docId}`, "DELETE");
  };

  const addAppointment = (app: Appointment) => {
    setDataStore((prev) => ({
      ...prev,
      [activeParentId]: {
        ...prev[activeParentId],
        appointments: [app, ...prev[activeParentId].appointments],
      },
    }));
    void syncMutation("/appointments", "POST", { ...app, family_id: currentData.profile.family_id });
  };

  const deleteAppointment = (appId: string) => {
    setDataStore((prev) => ({
      ...prev,
      [activeParentId]: {
        ...prev[activeParentId],
        appointments: prev[activeParentId].appointments.filter((a) => a.id !== appId),
      },
    }));
    void syncMutation(`/appointments/${appId}`, "PATCH", { status: "cancelled" });
  };

  const addMedicine = (med: MedicineSchedule) => {
    setDataStore((prev) => ({
      ...prev,
      [activeParentId]: {
        ...prev[activeParentId],
        medicines: [med, ...prev[activeParentId].medicines],
      },
    }));
    void syncMutation("/medicines", "POST", { ...med, family_id: currentData.profile.family_id });
  };

  const deleteMedicine = (medId: string) => {
    setDataStore((prev) => ({
      ...prev,
      [activeParentId]: {
        ...prev[activeParentId],
        medicines: prev[activeParentId].medicines.filter((m) => m.id !== medId),
      },
    }));
    void syncMutation(`/medicines/${medId}`, "PATCH", { is_active: false });
  };

  // Care Tasks Management
  const addTask = (task: CareTask) => {
    setDataStore((prev) => ({
      ...prev,
      [activeParentId]: {
        ...prev[activeParentId],
        tasks: [task, ...prev[activeParentId].tasks],
      },
    }));

    void syncMutation("/tasks", "POST", task);
  };

  const toggleTaskCompleted = (taskId: string) => {
    setDataStore((prev) => {
      const currentTasks = prev[activeParentId].tasks;
      const updatedTasks = currentTasks.map((t) => {
        if (t.id === taskId) {
          const nextStatus = t.status === "completed" ? "pending" : "completed";
          void syncMutation(`/tasks/${taskId}`, "PATCH", { status: nextStatus });
          return { ...t, status: nextStatus as any };
        }
        return t;
      });
      return {
        ...prev,
        [activeParentId]: {
          ...prev[activeParentId],
          tasks: updatedTasks,
        },
      };
    });
  };

  const deleteTask = (taskId: string) => {
    setDataStore((prev) => ({
      ...prev,
      [activeParentId]: {
        ...prev[activeParentId],
        tasks: prev[activeParentId].tasks.filter((t) => t.id !== taskId),
      },
    }));

    void syncMutation(`/tasks/${taskId}`, "DELETE");
  };

  // Expenses & Insurance Management
  const addExpense = (expense: HealthcareExpense) => {
    setDataStore((prev) => ({
      ...prev,
      [activeParentId]: {
        ...prev[activeParentId],
        expenses: [expense, ...prev[activeParentId].expenses],
      },
    }));

    void syncMutation("/expenses", "POST", expense);
  };

  const addInsurance = (policy: InsurancePolicy) => {
    setDataStore((prev) => ({
      ...prev,
      [activeParentId]: {
        ...prev[activeParentId],
        insurance: [policy, ...prev[activeParentId].insurance],
      },
    }));

    void syncMutation("/expenses/insurance", "POST", policy);
  };

  // Family Members & Caregiver Management
  const logNewMeasurement = (vitalType: any, val: number, valSec?: number, notes?: string) => {
    const newMeasurement: HealthMeasurement = {
      id: Crypto.randomUUID(),
      parent_id: activeParentId,
      vital_type: vitalType,
      value_numeric: val,
      value_secondary: valSec,
      unit: vitalType === "blood_pressure" ? "mmHg" : vitalType === "blood_sugar" ? "mg/dL" : "bpm",
      recorded_at: "Just now",
      notes,
    };
    setDataStore((prev) => ({
      ...prev,
      [activeParentId]: {
        ...prev[activeParentId],
        measurements: [newMeasurement, ...prev[activeParentId].measurements],
      },
    }));

    void syncMutation("/measurements", "POST", {
      parent_id: activeParentId,
      vital_type: vitalType,
      value_numeric: val,
      value_secondary: valSec,
      unit: newMeasurement.unit,
      notes,
    });
  };

  const recordNewVisit = (placeName: string, category: any, address: string) => {
    const coordinates = userLocation || (
      currentData.profile.latitude != null && currentData.profile.longitude != null
        ? { latitude: currentData.profile.latitude, longitude: currentData.profile.longitude }
        : null
    );
    if (!coordinates) return;
    const newVisit: LocationVisit = {
      id: Crypto.randomUUID(),
      parent_id: activeParentId,
      place_name: placeName,
      category,
      address,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      visited_at: "Today, confirmed",
      notes: "Checked in via ParentPulse",
    };
    setDataStore((prev) => ({
      ...prev,
      [activeParentId]: {
        ...prev[activeParentId],
        visits: [newVisit, ...prev[activeParentId].visits],
      },
    }));

    void syncMutation(`/parents/${activeParentId}/locations/visits`, "POST", {
      place_name: placeName,
      category,
      address,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      notes: "Checked in via ParentPulse",
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
    const newEntry = emptyParentData(newProfile);

    setDataStore((prev) => ({
      ...prev,
      [newProfile.id]: newEntry,
    }));

    setActiveParentId(newProfile.id);
    setHasCompletedOnboarding(true);
    setActiveScreen("tabs");
    await refreshData();

    return newProfile;
  };

  return (
    <AppContext.Provider
      value={{
        runtimeReady,
        isAuthenticated,
        dataLoading,
        dataError,
        refreshData,
        activeParent: currentData.profile,
        parentList: Object.values(dataStore).map((d) => d.profile),
        setActiveParentId,
        updateActiveParentProfile,
        seniorMode,
        toggleSeniorMode,
        language,
        setLanguage,
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
        measurements: currentData.measurements,
        visits: currentData.visits,
        tasks: currentData.tasks,
        addTask,
        toggleTaskCompleted,
        deleteTask,
        expenses: currentData.expenses,
        addExpense,
        insurance: currentData.insurance,
        addInsurance,
        familyMembers,
        currentUser,
        logNewMeasurement,
        recordNewVisit,
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
