// apps/web/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { PortalUser, UserRole } from "../types/auth";

interface AuthContextType {
  currentUser: PortalUser;
  currentRole: UserRole;
  switchRole: (role: UserRole) => void;
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_ROLE_KEY = "parentpulse_portal_role";

const ADMIN_PROFILE: PortalUser = {
  id: "admin-platform-core",
  name: "Aditya Verma",
  email: "aditya.admin@parentpulse.care",
  role: "admin",
  department: "Platform Operations & ABDM Compliance",
  badge: "Super Administrator",
};

const DOCTOR_PROFILE: PortalUser = {
  id: "doc-sharma-saket",
  name: "Dr. Rajesh Sharma",
  email: "dr.rajesh.sharma@maxhealthcare.com",
  role: "doctor",
  specialty: "Senior Geriatric Medicine & Cardiology",
  hospital: "Max Super Speciality Hospital, Saket",
  licenseNumber: "DMC/R/2014/89412",
  badge: "Verified Specialist",
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ROLE_KEY);
      return saved === "admin" || saved === "doctor" ? (saved as UserRole) : "doctor";
    } catch {
      return "doctor";
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("parentpulse_auth_token") || null;
  });

  const currentUser = currentRole === "admin" ? ADMIN_PROFILE : DOCTOR_PROFILE;

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
    try {
      localStorage.setItem(STORAGE_ROLE_KEY, role);
    } catch {}
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("parentpulse_auth_token");
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        switchRole,
        token,
        setToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
