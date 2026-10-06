// apps/web/src/types/auth.ts
export type UserRole = "admin" | "doctor" | "family_manager";

export interface PortalUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  specialty?: string;
  hospital?: string;
  licenseNumber?: string;
  department?: string;
  badge?: string;
}
