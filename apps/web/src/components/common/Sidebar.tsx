// apps/web/src/components/common/Sidebar.tsx
import React from "react";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  ShieldAlert,
  FileText,
  Stethoscope,
  Activity,
  Calendar,
  Pill,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export type AdminTab = "overview" | "users" | "doctors" | "sos" | "audit";
export type DoctorTab = "patients" | "chart" | "prescriptions" | "appointments" | "milestones";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  pendingDoctorCount?: number;
  activeSosCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  pendingDoctorCount = 0,
  activeSosCount = 0,
}) => {
  const { currentRole, currentUser } = useAuth();

  interface NavItem {
    id: string;
    label: string;
    icon: any;
    count?: number;
    danger?: boolean;
  }

  const adminNavItems: NavItem[] = [
    { id: "overview", label: "Command Center", icon: LayoutDashboard },
    { id: "users", label: "Users & Families", icon: Users },
    {
      id: "doctors",
      label: "Doctor Credentials",
      icon: UserCheck,
      count: pendingDoctorCount > 0 ? pendingDoctorCount : undefined,
    },
    {
      id: "sos",
      label: "Emergency SOS",
      icon: ShieldAlert,
      count: activeSosCount > 0 ? activeSosCount : undefined,
      danger: activeSosCount > 0,
    },
    { id: "audit", label: "Security & Audit Logs", icon: FileText },
  ];

  const doctorNavItems: NavItem[] = [
    { id: "patients", label: "Patient Roster", icon: Users },
    { id: "chart", label: "Clinical Chart", icon: Activity },
    { id: "prescriptions", label: "Digital Rx Authoring", icon: Pill },
    { id: "appointments", label: "Consultations", icon: Calendar },
    { id: "milestones", label: "Clinical Milestones", icon: ClipboardList },
  ];

  const items = currentRole === "admin" ? adminNavItems : doctorNavItems;

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800/80 bg-slate-950/60 p-4 flex flex-col justify-between hidden md:flex">
      <div>
        {/* Portal Scope Indicator */}
        <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <div className="flex items-center gap-2">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                currentRole === "doctor" ? "bg-emerald-400" : "bg-indigo-400"
              }`}
            />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {currentRole === "doctor" ? "Doctor Clinical Suite" : "Platform Administration"}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 line-clamp-1">
            {currentRole === "doctor"
              ? currentUser.hospital || "Max Super Speciality"
              : "ABDM / HIPAA Compliant"}
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? currentRole === "doctor"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold"
                      : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-bold"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                      isActive
                        ? currentRole === "doctor"
                          ? "text-emerald-400"
                          : "text-indigo-400"
                        : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.count !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      item.danger
                        ? "bg-rose-500 text-white animate-pulse"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Card */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-3.5 text-xs">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-1">
          <Sparkles className="h-3.5 w-3.5" />
          <span>ParentPulse Engine</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Real-time synchronized with elderly mobile app care circles.
        </p>
        <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800">
          <span>v1.0.3 PRO</span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Sync
          </span>
        </div>
      </div>
    </aside>
  );
};
