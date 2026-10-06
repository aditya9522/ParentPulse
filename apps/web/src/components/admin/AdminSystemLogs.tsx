// apps/web/src/components/admin/AdminSystemLogs.tsx
import React, { useState } from "react";
import { FileText, Search, ShieldCheck, Terminal, Clock, RefreshCw } from "lucide-react";
import { AdminAuditLog } from "../../types/admin";
import { Badge } from "../common/Badge";

interface AdminSystemLogsProps {
  logs: AdminAuditLog[];
  onRefresh: () => void;
  isLoading?: boolean;
}

export const AdminSystemLogs: React.FC<AdminSystemLogsProps> = ({
  logs,
  onRefresh,
  isLoading,
}) => {
  const [search, setSearch] = useState("");

  const filtered = logs.filter((log) => {
    return (
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.resource_type.toLowerCase().includes(search.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
            Security & Compliance Audit Trail
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable system audit logs recorded in accordance with ABDM & HIPAA compliance guidelines.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Logs
          </button>
          <Badge variant="purple">
            {logs.length} Recorded Events
          </Badge>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by action, resource or note..."
          className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {/* Audit Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/60 uppercase tracking-wider text-[10px] text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-5 py-3.5">Timestamp</th>
              <th className="px-5 py-3.5">Action</th>
              <th className="px-5 py-3.5">Target Resource</th>
              <th className="px-5 py-3.5">Details & Audit Payload</th>
              <th className="px-5 py-3.5 text-right">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                  No audit log entries found.
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono font-bold text-indigo-400 text-xs">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant="neutral" size="sm">
                      {log.resource_type}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-slate-300 max-w-md">
                    {log.details || "No additional metadata recorded"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Audited
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
