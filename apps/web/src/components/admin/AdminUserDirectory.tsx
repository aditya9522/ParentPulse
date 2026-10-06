// apps/web/src/components/admin/AdminUserDirectory.tsx
import React, { useState } from "react";
import { Users, Search, UserCheck, Shield, Phone, Mail, Calendar } from "lucide-react";
import { AdminUserRecord } from "../../types/admin";
import { Badge } from "../common/Badge";

interface AdminUserDirectoryProps {
  users: AdminUserRecord[];
}

export const AdminUserDirectory: React.FC<AdminUserDirectoryProps> = ({ users }) => {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone_number && u.phone_number.includes(search));

    if (!matchesSearch) return false;
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
            Users & Care Circle Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Accounts managing senior parents, assigned caregivers, and family admins.
          </p>
        </div>
        <Badge variant="purple">
          {users.length} Total Registered Users
        </Badge>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 backdrop-blur-xl">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {["all", "family_admin", "caregiver"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                roleFilter === r
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {r.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/60 uppercase tracking-wider text-[10px] text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-5 py-3.5">User Details</th>
              <th className="px-5 py-3.5">Role</th>
              <th className="px-5 py-3.5">Assigned Circles</th>
              <th className="px-5 py-3.5">Parents Monitored</th>
              <th className="px-5 py-3.5">Registration Date</th>
              <th className="px-5 py-3.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 font-bold text-xs border border-indigo-500/20">
                      {user.full_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-white block">{user.full_name}</span>
                      <span className="text-slate-400 text-[11px] flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-400" />
                        {user.email}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <Badge variant={user.role === "family_admin" ? "purple" : "info"} size="sm">
                    {user.role.replace("_", " ")}
                  </Badge>
                </td>
                <td className="px-5 py-4 font-mono font-medium text-slate-200">
                  {user.family_count ?? 1} Care Circle
                </td>
                <td className="px-5 py-4 font-mono font-medium text-slate-200">
                  {user.enrolled_parents ?? 2} Parents
                </td>
                <td className="px-5 py-4 text-slate-400">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-5 py-4 text-right">
                  <Badge variant="success" size="sm" dot>
                    Active
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
