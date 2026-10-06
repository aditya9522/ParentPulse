// apps/web/src/services/adminService.ts
import {
  AdminPlatformStats,
  AdminUserRecord,
  AdminDoctorRecord,
  AdminSosEvent,
  AdminAuditLog,
} from "../types/admin";
import { apiFetch } from "./apiClient";

export const adminService = {
  async getStats(): Promise<AdminPlatformStats> {
    return await apiFetch<AdminPlatformStats>("/admin/stats");
  },

  async getUsers(): Promise<AdminUserRecord[]> {
    return await apiFetch<AdminUserRecord[]>("/admin/users");
  },

  async getDoctors(): Promise<AdminDoctorRecord[]> {
    return await apiFetch<AdminDoctorRecord[]>("/admin/doctors");
  },

  async verifyDoctor(doctorId: string, verify: boolean): Promise<any> {
    return await apiFetch<any>(`/admin/doctors/${doctorId}/verify?verify=${verify}`, {
      method: "PATCH",
    });
  },

  async getSosEvents(): Promise<AdminSosEvent[]> {
    return await apiFetch<AdminSosEvent[]>("/admin/sos");
  },

  async getAuditLogs(): Promise<AdminAuditLog[]> {
    return await apiFetch<AdminAuditLog[]>("/admin/audit-logs");
  },
};
