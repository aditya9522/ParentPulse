// apps/web/src/components/admin/AdminDoctorVerification.tsx
import React, { useState } from "react";
import {
  Stethoscope,
  CheckCircle2,
  XCircle,
  Search,
  Building,
  Phone,
  Mail,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { AdminDoctorRecord } from "../../types/admin";
import { Badge } from "../common/Badge";

interface AdminDoctorVerificationProps {
  doctors: AdminDoctorRecord[];
  onVerifyDoctor: (id: string, verify: boolean) => void;
}

export const AdminDoctorVerification: React.FC<AdminDoctorVerificationProps> = ({
  doctors,
  onVerifyDoctor,
}) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "verified">("all");

  const filtered = doctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(search.toLowerCase()) ||
      doc.hospital_or_clinic.toLowerCase().includes(search.toLowerCase()) ||
      (doc.license_number && doc.license_number.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (filter === "pending") return !doc.is_verified;
    if (filter === "verified") return doc.is_verified;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
            Doctor Credentialing & Verification Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enforce medical trust standards before practitioners can access patient records or issue prescriptions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="warning">
            {doctors.filter((d) => !d.is_verified).length} Pending Review
          </Badge>
          <Badge variant="success">
            {doctors.filter((d) => d.is_verified).length} Verified Practitioners
          </Badge>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 backdrop-blur-xl">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, specialty, license number..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(["all", "pending", "verified"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold capitalize transition-all ${
                filter === tab
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Doctors Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((doc) => {
          return (
            <div
              key={doc.id}
              className={`rounded-2xl border p-5 backdrop-blur-xl transition-all ${
                doc.is_verified
                  ? "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                  : "border-amber-500/30 bg-amber-950/10 hover:border-amber-500/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl font-bold text-base ${
                      doc.is_verified
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    <Stethoscope className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{doc.name}</h3>
                    <p className="text-xs text-slate-300 font-medium">{doc.specialty}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Building className="h-3 w-3 text-slate-400" />
                      {doc.hospital_or_clinic}
                    </p>
                  </div>
                </div>

                <Badge variant={doc.is_verified ? "success" : "warning"} size="sm" dot>
                  {doc.is_verified ? "Verified" : "Pending Review"}
                </Badge>
              </div>

              {/* License and Contact Details */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Medical Reg. License
                  </span>
                  <span className="font-mono text-slate-200 text-xs">
                    {doc.license_number || "STATE_MCI_VERIFIED"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Contact Phone
                  </span>
                  <span className="text-slate-200 text-xs flex items-center gap-1">
                    <Phone className="h-3 w-3 text-slate-400" />
                    {doc.phone_number}
                  </span>
                </div>
              </div>

              {doc.email && (
                <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                  <Mail className="h-3 w-3 text-slate-400" />
                  <span>{doc.email}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {doc.is_verified ? "Access granted to Clinical Vault" : "Pending Administrative signoff"}
                </span>

                <div className="flex items-center gap-2">
                  {doc.is_verified ? (
                    <button
                      onClick={() => onVerifyDoctor(doc.id, false)}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-all"
                    >
                      Revoke Verification
                    </button>
                  ) : (
                    <button
                      onClick={() => onVerifyDoctor(doc.id, true)}
                      className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Approve & Verify
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
