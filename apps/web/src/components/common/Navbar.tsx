// apps/web/src/components/common/Navbar.tsx
import React from "react";
import {
  HeartPulse,
  ShieldAlert,
  Stethoscope,
  Activity,
  Bell,
  RefreshCw,
  LogOut,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Badge } from "./Badge";

interface NavbarProps {
  onRefresh?: () => void;
  activeSosCount?: number;
  onSosClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onRefresh,
  activeSosCount = 0,
  onSosClick,
}) => {
  const { currentUser, currentRole, switchRole, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-500 shadow-md shadow-rose-500/20">
            <HeartPulse className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight text-white font-['Plus_Jakarta_Sans']">
                ParentPulse
              </span>
              <span className="rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400 border border-indigo-500/20">
                PRO PORTAL
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Elderly Remote-Care Clinical & Administrative Command
            </p>
          </div>
        </div>

        {/* Center: Dual Portal Switcher */}
        <div className="flex items-center rounded-full bg-slate-900/90 p-1 border border-slate-800 shadow-inner">
          <button
            onClick={() => switchRole("doctor")}
            className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              currentRole === "doctor"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Stethoscope className="h-3.5 w-3.5" />
            <span>Doctor Portal</span>
          </button>
          <button
            onClick={() => switchRole("admin")}
            className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              currentRole === "admin"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Platform Admin</span>
          </button>
        </div>

        {/* Right Actions & Profile */}
        <div className="flex items-center gap-3">
          {/* Active SOS Alert Pill */}
          {activeSosCount > 0 && (
            <button
              onClick={onSosClick}
              className="group flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/40 px-3 py-1 text-xs font-bold text-rose-400 animate-pulse hover:bg-rose-500/25 transition-all"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
              <span>{activeSosCount} Active SOS Alert</span>
            </button>
          )}

          {/* Sync Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh Data"
              className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}

          {/* User Profile Card */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 font-bold text-slate-200 text-sm">
              {currentUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="hidden md:block text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">{currentUser.name}</span>
                <Badge
                  variant={currentRole === "doctor" ? "success" : "purple"}
                  size="sm"
                >
                  {currentRole === "doctor" ? "Doctor" : "Admin"}
                </Badge>
              </div>
              <p className="text-[10px] text-slate-400 truncate max-w-[160px]">
                {currentUser.specialty || currentUser.department || currentUser.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
