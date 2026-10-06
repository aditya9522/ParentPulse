// apps/web/src/App.tsx
import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/common/Navbar";
import { Sidebar, AdminTab, DoctorTab } from "./components/common/Sidebar";
import { AdminOverview } from "./components/admin/AdminOverview";
import { AdminUserDirectory } from "./components/admin/AdminUserDirectory";
import { AdminDoctorVerification } from "./components/admin/AdminDoctorVerification";
import { AdminEmergencySosAudit } from "./components/admin/AdminEmergencySosAudit";
import { AdminSystemLogs } from "./components/admin/AdminSystemLogs";
import { DoctorRoster } from "./components/doctor/DoctorRoster";
import { PatientClinicalChart } from "./components/doctor/PatientClinicalChart";
import { PrescriptionAuthoring } from "./components/doctor/PrescriptionAuthoring";
import { DoctorAppointments } from "./components/doctor/DoctorAppointments";
import { ClinicalMilestoneManager } from "./components/doctor/ClinicalMilestoneManager";
import { adminService } from "./services/adminService";
import { doctorService } from "./services/doctorService";
import {
  AdminPlatformStats,
  AdminUserRecord,
  AdminDoctorRecord,
  AdminSosEvent,
  AdminAuditLog,
} from "./types/admin";
import { ClinicalPatient, DoctorAppointmentItem } from "./types/clinical";
import { RefreshCw, AlertCircle } from "lucide-react";

const PortalContent: React.FC = () => {
  const { currentRole } = useAuth();

  // Navigation Tabs
  const [adminTab, setAdminTab] = useState<AdminTab>("overview");
  const [doctorTab, setDoctorTab] = useState<DoctorTab>("patients");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

  // Real Admin Data States
  const [stats, setStats] = useState<AdminPlatformStats | null>(null);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [doctors, setDoctors] = useState<AdminDoctorRecord[]>([]);
  const [sosEvents, setSosEvents] = useState<AdminSosEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  // Real Doctor Data States
  const [patients, setPatients] = useState<ClinicalPatient[]>([]);
  const [appointments, setAppointments] = useState<DoctorAppointmentItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Load Real Data from Backend
  const loadRealData = async () => {
    try {
      setLoading(true);
      setApiError(null);

      // Fetch admin telemetry & database entities
      const [
        statsData,
        usersData,
        doctorsData,
        sosData,
        logsData,
        patientsData,
        aptsData,
      ] = await Promise.all([
        adminService.getStats().catch(() => null),
        adminService.getUsers().catch(() => []),
        adminService.getDoctors().catch(() => []),
        adminService.getSosEvents().catch(() => []),
        adminService.getAuditLogs().catch(() => []),
        doctorService.getPatients().catch(() => []),
        doctorService.getAppointments().catch(() => []),
      ]);

      if (statsData) setStats(statsData);
      setUsers(usersData);
      setDoctors(doctorsData);
      setSosEvents(sosData);
      setAuditLogs(logsData);
      setPatients(patientsData);
      setAppointments(aptsData);

      if (patientsData.length > 0 && !selectedPatientId) {
        setSelectedPatientId(patientsData[0].id);
      }
    } catch (err: any) {
      setApiError(err.message || "Failed to load real backend data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRealData();
  }, []);

  // Admin Actions
  const handleVerifyDoctor = async (doctorId: string, verify: boolean) => {
    try {
      await adminService.verifyDoctor(doctorId, verify);
      setDoctors((prev) =>
        prev.map((d) => (d.id === doctorId ? { ...d, is_verified: verify } : d))
      );
    } catch (err: any) {
      alert(`Error updating doctor verification: ${err.message}`);
    }
  };

  const handleResolveSos = async (sosId: string) => {
    setSosEvents((prev) =>
      prev.map((s) => (s.id === sosId ? { ...s, status: "resolved" as const } : s))
    );
  };

  // Doctor Actions
  const handleSelectPatientForChart = (patientId: string) => {
    setSelectedPatientId(patientId);
    setDoctorTab("chart");
  };

  const handleOpenPrescribeForPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setDoctorTab("prescriptions");
  };

  const handleOpenAddMilestoneForPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setDoctorTab("milestones");
  };

  const handleUpdateAppointmentStatus = async (id: string, status: string) => {
    try {
      await doctorService.updateAppointmentStatus(id, status);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: status as any } : a))
      );
    } catch (err: any) {
      alert(`Error updating appointment: ${err.message}`);
    }
  };

  const pendingDoctorsCount = doctors.filter((d) => !d.is_verified).length;
  const activeSosCount = sosEvents.filter((s) => s.status === "active").length;

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onRefresh={loadRealData}
        activeSosCount={activeSosCount}
        onSosClick={() => {
          if (currentRole === "admin") setAdminTab("sos");
        }}
      />

      <div className="flex flex-1">
        {/* Role-Specific Sidebar */}
        <Sidebar
          activeTab={currentRole === "admin" ? adminTab : doctorTab}
          onTabChange={(tab) => {
            if (currentRole === "admin") setAdminTab(tab);
            else setDoctorTab(tab);
          }}
          pendingDoctorCount={pendingDoctorsCount}
          activeSosCount={activeSosCount}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {apiError && (
            <div className="mb-6 rounded-2xl border border-rose-500/40 bg-rose-950/20 p-4 flex items-center justify-between gap-4 text-xs text-rose-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>Backend Notice: {apiError}. Ensure backend server is running on port 8000.</span>
              </div>
              <button
                onClick={loadRealData}
                className="rounded-lg bg-rose-800 px-3 py-1 font-semibold text-white hover:bg-rose-700"
              >
                Retry
              </button>
            </div>
          )}

          {loading && !stats && patients.length === 0 ? (
            <div className="flex h-96 flex-col items-center justify-center gap-3 text-xs text-slate-400">
              <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin opacity-80" />
              <span>Connecting to ParentPulse live database engine...</span>
            </div>
          ) : (
            <>
              {/* PLATFORM ADMIN VIEWS */}
              {currentRole === "admin" && (
                <>
                  {adminTab === "overview" && stats && (
                    <AdminOverview
                      stats={stats}
                      doctors={doctors}
                      sosEvents={sosEvents}
                      onNavigateTab={setAdminTab}
                      onVerifyDoctor={handleVerifyDoctor}
                      onResolveSos={handleResolveSos}
                    />
                  )}
                  {adminTab === "users" && <AdminUserDirectory users={users} />}
                  {adminTab === "doctors" && (
                    <AdminDoctorVerification
                      doctors={doctors}
                      onVerifyDoctor={handleVerifyDoctor}
                    />
                  )}
                  {adminTab === "sos" && (
                    <AdminEmergencySosAudit
                      events={sosEvents}
                      onRefresh={loadRealData}
                      isLoading={loading}
                    />
                  )}
                  {adminTab === "audit" && (
                    <AdminSystemLogs
                      logs={auditLogs}
                      onRefresh={loadRealData}
                      isLoading={loading}
                    />
                  )}
                </>
              )}

              {/* DOCTOR CLINICAL SUITE VIEWS */}
              {currentRole === "doctor" && (
                <>
                  {doctorTab === "patients" && (
                    <DoctorRoster
                      patients={patients}
                      onSelectPatient={handleSelectPatientForChart}
                      onOpenPrescribe={handleOpenPrescribeForPatient}
                      onRefresh={loadRealData}
                      isLoading={loading}
                    />
                  )}
                  {doctorTab === "chart" && selectedPatientId && (
                    <PatientClinicalChart
                      patientId={selectedPatientId}
                      onOpenPrescribe={handleOpenPrescribeForPatient}
                      onOpenAddMilestone={handleOpenAddMilestoneForPatient}
                      onBackToRoster={() => setDoctorTab("patients")}
                    />
                  )}
                  {doctorTab === "prescriptions" && (
                    <PrescriptionAuthoring
                      patients={patients}
                      initialPatientId={selectedPatientId}
                      onSuccess={() => {
                        loadRealData();
                        setDoctorTab("chart");
                      }}
                      onCancel={() => setDoctorTab("chart")}
                    />
                  )}
                  {doctorTab === "appointments" && (
                    <DoctorAppointments
                      appointments={appointments}
                      onUpdateStatus={handleUpdateAppointmentStatus}
                      onRefresh={loadRealData}
                      isLoading={loading}
                    />
                  )}
                  {doctorTab === "milestones" && (
                    <ClinicalMilestoneManager
                      patients={patients}
                      initialPatientId={selectedPatientId}
                      onSuccess={() => {
                        loadRealData();
                        setDoctorTab("chart");
                      }}
                      onCancel={() => setDoctorTab("chart")}
                    />
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <PortalContent />
    </AuthProvider>
  );
}

export default App;
