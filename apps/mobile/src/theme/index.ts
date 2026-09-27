// apps/mobile/src/theme/index.ts

export const Colors = {
  // Brand Emerald & Teal
  primary: "#0D9488", // Teal 600 - Fresh, clinical, calming
  primaryDark: "#0F766E", // Teal 700
  primaryDeep: "#115E59", // Teal 800
  primaryLight: "#CCFBF1", // Teal 100
  primaryFaint: "#F0FDFA", // Teal 50

  // Secondary Sky / Electric Blue
  secondary: "#0284C7", // Sky 600
  secondaryDark: "#0369A1",
  secondaryLight: "#E0F2FE",

  // Vibrant Accents
  accent: "#8B5CF6", // Violet 500
  accentLight: "#EDE9FE",
  indigo: "#6366F1",
  indigoLight: "#EEF2FF",

  // Medical Action Statuses
  emergency: "#EF4444", // Red 500
  emergencyDark: "#DC2626", // Red 600
  emergencyLight: "#FEE2E2",
  warning: "#F59E0B", // Amber 500
  warningDark: "#D97706",
  warningLight: "#FEF3C7",
  success: "#10B981", // Emerald 500
  successDark: "#059669",
  successLight: "#D1FAE5",

  // Neutral Slate & Surfaces
  background: "#F8FAFC", // Slate 50
  surface: "#FFFFFF",
  surfaceCard: "#FFFFFF",
  surfaceAlt: "#F1F5F9", // Slate 100
  surfaceHighlight: "#F8FAFC",
  border: "#E2E8F0", // Slate 200
  borderLight: "#F1F5F9",
  borderStrong: "#CBD5E1", // Slate 300

  // High-Contrast Accessible Text
  textPrimary: "#0F172A", // Slate 900
  textSecondary: "#475569", // Slate 600
  textMuted: "#64748B", // Slate 500
  textSubtle: "#94A3B8", // Slate 400
  textInverse: "#FFFFFF",

  // Senior Mode High Contrast Overrides
  seniorText: "#000000",
  seniorBackground: "#FFFFFF",
  seniorSurface: "#F8FAFC",
  seniorBorder: "#94A3B8",
};

export const Gradients = {
  primary: ["#0D9488", "#0F766E"] as const,
  primaryHero: ["#0F766E", "#115E59"] as const,
  teal: ["#0D9488", "#0F766E"] as const,
  sos: ["#EF4444", "#DC2626"] as const,
  crimson: ["#EF4444", "#DC2626"] as const,
  doctor: ["#6366F1", "#4F46E5"] as const,
  ai: ["#8B5CF6", "#6D28D9"] as const,
  vital: ["#0284C7", "#0369A1"] as const,
  cardSoft: ["#FFFFFF", "#F8FAFC"] as const,
  cardTeal: ["#F0FDFA", "#CCFBF1"] as const,
};

export const Typography = {
  fontFamily: "System",
  sizes: {
    xxs: 11,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    display: 30,
  },
  seniorSizes: {
    xxs: 13,
    xs: 15,
    sm: 17,
    md: 20,
    lg: 23,
    xl: 26,
    xxl: 30,
    display: 36,
  },
  weights: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
    extraBold: "800" as const,
  },
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const Shadows = {
  subtle: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  card: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardElevated: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  glowTeal: {
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  glowRed: {
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  floatingNav: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
};

import { Platform } from "react-native";

export const Glass = {
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    borderColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1.2,
    borderRadius: BorderRadius.xl,
    overflow: "hidden" as const,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: Platform.OS === "android" ? 0 : 3,
  },
  cardElevated: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderColor: "rgba(255, 255, 255, 0.98)",
    borderWidth: 1.5,
    borderRadius: BorderRadius.xl,
    overflow: "hidden" as const,
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: Platform.OS === "android" ? 0 : 5,
  },
  heroTeal: {
    backgroundColor: "rgba(13, 148, 136, 0.92)",
    borderColor: "rgba(255, 255, 255, 0.35)",
    borderWidth: 1.2,
    borderRadius: BorderRadius.xl,
    overflow: "hidden" as const,
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: Platform.OS === "android" ? 0 : 6,
  },
  pill: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    overflow: "hidden" as const,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: Platform.OS === "android" ? 0 : 1,
  },
  nav: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1.2,
    borderRadius: 24,
    overflow: "hidden" as const,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: Platform.OS === "android" ? 0 : 8,
  },
  subtle: {
    backgroundColor: "rgba(241, 245, 249, 0.75)",
    borderColor: "rgba(255, 255, 255, 0.85)",
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    overflow: "hidden" as const,
  },
  dark: {
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    borderColor: "rgba(255, 255, 255, 0.16)",
    borderWidth: 1.2,
    borderRadius: BorderRadius.xl,
    overflow: "hidden" as const,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: Platform.OS === "android" ? 0 : 8,
  },
};

