// apps/mobile/src/theme/index.ts
import { StyleSheet } from "react-native";

export type AppThemeMode = "light" | "dark" | "amber";

export const LIGHT_COLORS = {
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
  emergencyFaint: "#FFF5F5",
  warning: "#F59E0B", // Amber 500
  warningDark: "#D97706",
  warningLight: "#FEF3C7",
  success: "#10B981", // Emerald 500
  successDark: "#059669",
  successLight: "#D1FAE5",

  // Neutral Slate & Surfaces
  background: "#F8FAFC", // Slate 50
  surface: "#FFFFFF",
  surfaceCard: "rgba(255, 255, 255, 0.70)",
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

export const DARK_COLORS = {
  // Brand Neon Teal for Dark Mode
  primary: "#14B8A6", // Teal 500
  primaryDark: "#0D9488",
  primaryDeep: "#0F766E",
  primaryLight: "rgba(20, 184, 166, 0.25)",
  primaryFaint: "rgba(20, 184, 166, 0.12)",

  // Secondary Sky
  secondary: "#38BDF8", // Sky 400
  secondaryDark: "#0284C7",
  secondaryLight: "rgba(56, 189, 248, 0.22)",

  // Vibrant Accents
  accent: "#A78BFA", // Violet 400
  accentLight: "rgba(167, 139, 250, 0.22)",
  indigo: "#818CF8",
  indigoLight: "rgba(129, 140, 248, 0.22)",

  // Medical Action Statuses
  emergency: "#F87171",
  emergencyDark: "#EF4444",
  emergencyLight: "rgba(239, 68, 68, 0.20)",
  emergencyFaint: "rgba(239, 68, 68, 0.08)",
  warning: "#FBBF24",
  warningDark: "#F59E0B",
  warningLight: "rgba(245, 158, 11, 0.20)",
  success: "#34D399",
  successDark: "#10B981",
  successLight: "rgba(16, 185, 129, 0.20)",

  // Neutral Deep Obsidian & Midnight Surfaces
  background: "#090D16", // Midnight dark canvas
  surface: "#0F172A",
  surfaceCard: "rgba(30, 41, 59, 0.70)",
  surfaceAlt: "#1E293B",
  surfaceHighlight: "#1E293B",
  border: "rgba(255, 255, 255, 0.14)",
  borderLight: "rgba(255, 255, 255, 0.08)",
  borderStrong: "rgba(255, 255, 255, 0.24)",

  // High-Contrast Accessible Text for Dark Mode
  textPrimary: "#F8FAFC", // Slate 50
  textSecondary: "#CBD5E1", // Slate 300
  textMuted: "#94A3B8", // Slate 400
  textSubtle: "#64748B", // Slate 500
  textInverse: "#090D16",

  // Senior Mode High Contrast Overrides (Dark)
  seniorText: "#FFFFFF",
  seniorBackground: "#000000",
  seniorSurface: "#1E293B",
  seniorBorder: "#CBD5E1",
};

export const AMBER_COLORS = {
  // Brand Ayurvedic Warm Amber & Honey
  primary: "#D97706", // Amber 600
  primaryDark: "#B45309", // Amber 700
  primaryDeep: "#92400E", // Amber 800
  primaryLight: "#FEF3C7", // Amber 100
  primaryFaint: "#FFFBEB", // Amber 50

  // Secondary Terracotta / Coral
  secondary: "#EA580C", // Orange 600
  secondaryDark: "#C2410C",
  secondaryLight: "#FFEDD5",

  // Vibrant Accents
  accent: "#7C3AED",
  accentLight: "#EDE9FE",
  indigo: "#4F46E5",
  indigoLight: "#EEF2FF",

  // Medical Action Statuses
  emergency: "#EF4444",
  emergencyDark: "#DC2626",
  emergencyLight: "#FEE2E2",
  emergencyFaint: "#FFF5F5",
  warning: "#D97706",
  warningDark: "#B45309",
  warningLight: "#FEF3C7",
  success: "#059669",
  successDark: "#047857",
  successLight: "#D1FAE5",

  // Neutral Warm Cream & Stone Surfaces
  background: "#FDFBF7", // Warm cream ivory
  surface: "#FFFFFF",
  surfaceCard: "rgba(255, 251, 245, 0.75)",
  surfaceAlt: "#FEF3C7",
  surfaceHighlight: "#FFFBEB",
  border: "#FDE68A", // Amber 200
  borderLight: "#FEF9C3",
  borderStrong: "#F59E0B",

  // High-Contrast Accessible Text for Warm Mode
  textPrimary: "#292524", // Stone 800
  textSecondary: "#57534E", // Stone 600
  textMuted: "#78716C", // Stone 500
  textSubtle: "#A8A29E", // Stone 400
  textInverse: "#FFFFFF",

  // Senior Mode High Contrast Overrides (Amber)
  seniorText: "#1C1917",
  seniorBackground: "#FFFBEB",
  seniorSurface: "#FEF3C7",
  seniorBorder: "#B45309",
};

export const Colors: typeof LIGHT_COLORS = new Proxy({} as typeof LIGHT_COLORS, {
  get(_target, prop: string) {
    const palette = THEME_PALETTES?.[currentThemeMode] || THEME_PALETTES?.light || { colors: LIGHT_COLORS };
    return (palette.colors as any)[prop] ?? (LIGHT_COLORS as any)[prop];
  },
  ownKeys() {
    return Object.keys(LIGHT_COLORS);
  },
  getOwnPropertyDescriptor(_target, prop) {
    const palette = THEME_PALETTES?.[currentThemeMode] || THEME_PALETTES?.light || { colors: LIGHT_COLORS };
    return {
      value: (palette.colors as any)?.[prop],
      enumerable: true,
      configurable: true,
      writable: false,
    };
  },
  has(_target, prop) {
    return prop in LIGHT_COLORS;
  },
});

export const LIGHT_GRADIENTS = {
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

export const DARK_GRADIENTS = {
  primary: ["#14B8A6", "#0D9488"] as const,
  primaryHero: ["#0D9488", "#042F2E"] as const,
  teal: ["#14B8A6", "#0D9488"] as const,
  sos: ["#F87171", "#DC2626"] as const,
  crimson: ["#EF4444", "#991B1B"] as const,
  doctor: ["#818CF8", "#4F46E5"] as const,
  ai: ["#A78BFA", "#6D28D9"] as const,
  vital: ["#38BDF8", "#0284C7"] as const,
  cardSoft: ["#1E293B", "#0F172A"] as const,
  cardTeal: ["#042F2E", "#115E59"] as const,
};

export const AMBER_GRADIENTS = {
  primary: ["#F59E0B", "#D97706"] as const,
  primaryHero: ["#D97706", "#92400E"] as const,
  teal: ["#F59E0B", "#D97706"] as const,
  sos: ["#EF4444", "#DC2626"] as const,
  crimson: ["#EA580C", "#C2410C"] as const,
  doctor: ["#6366F1", "#4F46E5"] as const,
  ai: ["#8B5CF6", "#6D28D9"] as const,
  vital: ["#EA580C", "#C2410C"] as const,
  cardSoft: ["#FFFBEB", "#FEF3C7"] as const,
  cardTeal: ["#FEF3C7", "#FDE68A"] as const,
};

export const Gradients = {
  get primary() {
    return (THEME_PALETTES?.[currentThemeMode] || THEME_PALETTES?.light || { gradients: LIGHT_GRADIENTS }).gradients.primary;
  },
  get primaryHero() {
    return (THEME_PALETTES?.[currentThemeMode] || THEME_PALETTES?.light || { gradients: LIGHT_GRADIENTS }).gradients.primaryHero;
  },
  get teal() {
    return (THEME_PALETTES?.[currentThemeMode] || THEME_PALETTES?.light || { gradients: LIGHT_GRADIENTS }).gradients.teal;
  },
  get sos() {
    return (THEME_PALETTES?.[currentThemeMode] || THEME_PALETTES?.light || { gradients: LIGHT_GRADIENTS }).gradients.sos;
  },
  get crimson() {
    return (THEME_PALETTES?.[currentThemeMode] || THEME_PALETTES?.light || { gradients: LIGHT_GRADIENTS }).gradients.crimson;
  },
  get doctor() {
    return (THEME_PALETTES?.[currentThemeMode] || THEME_PALETTES?.light || { gradients: LIGHT_GRADIENTS }).gradients.doctor;
  },
  get ai() {
    return (THEME_PALETTES?.[currentThemeMode] || THEME_PALETTES?.light || { gradients: LIGHT_GRADIENTS }).gradients.ai;
  },
  get vital() {
    return (THEME_PALETTES?.[currentThemeMode] || THEME_PALETTES?.light || { gradients: LIGHT_GRADIENTS }).gradients.vital;
  },
  get cardSoft() {
    return (THEME_PALETTES?.[currentThemeMode] || THEME_PALETTES?.light || { gradients: LIGHT_GRADIENTS }).gradients.cardSoft;
  },
  get cardTeal() {
    return (THEME_PALETTES?.[currentThemeMode] || THEME_PALETTES?.light || { gradients: LIGHT_GRADIENTS }).gradients.cardTeal;
  },
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
    elevation: 0,
  },
  card: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 0,
  },
  cardElevated: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 0,
  },
  glowTeal: {
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 0,
  },
  glowRed: {
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 0,
  },
  floatingNav: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 0,
  },
};

export const LIGHT_GLASS = {
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.65)",
    borderColor: "rgba(255, 255, 255, 0.82)",
    borderWidth: 1.2,
    borderRadius: BorderRadius.xl,
    overflow: "hidden" as const,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 0,
  },
  cardElevated: {
    backgroundColor: "rgba(255, 255, 255, 0.74)",
    borderColor: "rgba(255, 255, 255, 0.92)",
    borderWidth: 1.5,
    borderRadius: BorderRadius.xl,
    overflow: "hidden" as const,
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 0,
  },
  modal: {
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    borderColor: "rgba(255, 255, 255, 0.88)",
    borderWidth: 1.5,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden" as const,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 0,
  },
  heroTeal: {
    backgroundColor: "rgba(13, 148, 136, 0.88)",
    borderColor: "rgba(255, 255, 255, 0.35)",
    borderWidth: 1.2,
    borderRadius: BorderRadius.xl,
    overflow: "hidden" as const,
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 0,
  },
  pill: {
    backgroundColor: "rgba(255, 255, 255, 0.70)",
    borderColor: "rgba(255, 255, 255, 0.85)",
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    overflow: "hidden" as const,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 0,
  },
  nav: {
    backgroundColor: "rgba(255, 255, 255, 0.68)",
    borderColor: "rgba(255, 255, 255, 0.85)",
    borderWidth: 1.5,
    borderRadius: 26,
    overflow: "hidden" as const,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 0,
  },
  subtle: {
    backgroundColor: "rgba(241, 245, 249, 0.65)",
    borderColor: "rgba(255, 255, 255, 0.8)",
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    overflow: "hidden" as const,
    elevation: 0,
  },
  dark: {
    backgroundColor: "rgba(15, 23, 42, 0.80)",
    borderColor: "rgba(255, 255, 255, 0.16)",
    borderWidth: 1.2,
    borderRadius: BorderRadius.xl,
    overflow: "hidden" as const,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 0,
  },
};

export const DARK_GLASS = {
  card: {
    backgroundColor: "rgba(30, 41, 59, 0.65)",
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1.2,
    borderRadius: BorderRadius.xl,
    overflow: "hidden" as const,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 0,
  },
  cardElevated: {
    backgroundColor: "rgba(30, 41, 59, 0.78)",
    borderColor: "rgba(255, 255, 255, 0.22)",
    borderWidth: 1.5,
    borderRadius: BorderRadius.xl,
    overflow: "hidden" as const,
    shadowColor: "#14B8A6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 0,
  },
  modal: {
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    borderColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 1.5,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden" as const,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 0,
  },
  heroTeal: {
    backgroundColor: "rgba(15, 118, 110, 0.88)",
    borderColor: "rgba(20, 184, 166, 0.45)",
    borderWidth: 1.2,
    borderRadius: BorderRadius.xl,
    overflow: "hidden" as const,
    shadowColor: "#14B8A6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 0,
  },
  pill: {
    backgroundColor: "rgba(30, 41, 59, 0.75)",
    borderColor: "rgba(255, 255, 255, 0.16)",
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    overflow: "hidden" as const,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 0,
  },
  nav: {
    backgroundColor: "rgba(15, 23, 42, 0.82)",
    borderColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 1.5,
    borderRadius: 26,
    overflow: "hidden" as const,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 18,
    elevation: 0,
  },
  subtle: {
    backgroundColor: "rgba(30, 41, 59, 0.50)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    overflow: "hidden" as const,
    elevation: 0,
  },
  dark: {
    backgroundColor: "rgba(15, 23, 42, 0.90)",
    borderColor: "rgba(255, 255, 255, 0.20)",
    borderWidth: 1.2,
    borderRadius: BorderRadius.xl,
    overflow: "hidden" as const,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 0,
  },
};

export const AMBER_GLASS = {
  card: {
    backgroundColor: "rgba(255, 251, 245, 0.72)",
    borderColor: "rgba(254, 243, 199, 0.88)",
    borderWidth: 1.2,
    borderRadius: BorderRadius.xl,
    overflow: "hidden" as const,
    shadowColor: "#78350F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 0,
  },
  cardElevated: {
    backgroundColor: "rgba(255, 251, 245, 0.82)",
    borderColor: "rgba(253, 230, 138, 0.92)",
    borderWidth: 1.5,
    borderRadius: BorderRadius.xl,
    overflow: "hidden" as const,
    shadowColor: "#D97706",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 0,
  },
  modal: {
    backgroundColor: "rgba(255, 251, 245, 0.88)",
    borderColor: "rgba(253, 230, 138, 0.92)",
    borderWidth: 1.5,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden" as const,
    shadowColor: "#78350F",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 0,
  },
  heroTeal: {
    backgroundColor: "rgba(217, 119, 6, 0.88)",
    borderColor: "rgba(254, 243, 199, 0.45)",
    borderWidth: 1.2,
    borderRadius: BorderRadius.xl,
    overflow: "hidden" as const,
    shadowColor: "#D97706",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 0,
  },
  pill: {
    backgroundColor: "rgba(254, 243, 199, 0.75)",
    borderColor: "rgba(253, 230, 138, 0.88)",
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    overflow: "hidden" as const,
    shadowColor: "#78350F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 0,
  },
  nav: {
    backgroundColor: "rgba(255, 251, 245, 0.75)",
    borderColor: "rgba(253, 230, 138, 0.9)",
    borderWidth: 1.5,
    borderRadius: 26,
    overflow: "hidden" as const,
    shadowColor: "#78350F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 0,
  },
  subtle: {
    backgroundColor: "rgba(254, 243, 199, 0.65)",
    borderColor: "rgba(253, 230, 138, 0.8)",
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    overflow: "hidden" as const,
    elevation: 0,
  },
  dark: {
    backgroundColor: "rgba(41, 37, 36, 0.85)",
    borderColor: "rgba(253, 230, 138, 0.20)",
    borderWidth: 1.2,
    borderRadius: BorderRadius.xl,
    overflow: "hidden" as const,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 0,
  },
};

export const Glass = {
  get card() {
    return { ...(THEME_PALETTES?.[currentThemeMode] || THEME_PALETTES?.light || { glass: LIGHT_GLASS }).glass.card };
  },
  get cardElevated() {
    return { ...(THEME_PALETTES?.[currentThemeMode] || THEME_PALETTES?.light || { glass: LIGHT_GLASS }).glass.cardElevated };
  },
  get modal() {
    return { ...(THEME_PALETTES?.[currentThemeMode] || THEME_PALETTES?.light || { glass: LIGHT_GLASS }).glass.modal };
  },
  get heroTeal() {
    return { ...(THEME_PALETTES?.[currentThemeMode] || THEME_PALETTES?.light || { glass: LIGHT_GLASS }).glass.heroTeal };
  },
  get pill() {
    return { ...(THEME_PALETTES?.[currentThemeMode] || THEME_PALETTES?.light || { glass: LIGHT_GLASS }).glass.pill };
  },
  get nav() {
    return { ...(THEME_PALETTES?.[currentThemeMode] || THEME_PALETTES?.light || { glass: LIGHT_GLASS }).glass.nav };
  },
  get subtle() {
    return { ...(THEME_PALETTES?.[currentThemeMode] || THEME_PALETTES?.light || { glass: LIGHT_GLASS }).glass.subtle };
  },
  get dark() {
    return { ...(THEME_PALETTES?.[currentThemeMode] || THEME_PALETTES?.light || { glass: LIGHT_GLASS }).glass.dark };
  },
};

export const THEME_PALETTES = {
  light: {
    colors: LIGHT_COLORS,
    glass: LIGHT_GLASS,
    gradients: LIGHT_GRADIENTS,
    isDark: false,
    label: "Serene Emerald",
    hindiLabel: "शांत हरा",
  },
  dark: {
    colors: DARK_COLORS,
    glass: DARK_GLASS,
    gradients: DARK_GRADIENTS,
    isDark: true,
    label: "Midnight Obsidian",
    hindiLabel: "मध्यरात्रि काला",
  },
  amber: {
    colors: AMBER_COLORS,
    glass: AMBER_GLASS,
    gradients: AMBER_GRADIENTS,
    isDark: false,
    label: "Ayurvedic Amber",
    hindiLabel: "आयुर्वेदिक अम्बर",
  },
};

export let currentThemeMode: AppThemeMode = "light";

export function applyTheme(mode: AppThemeMode) {
  currentThemeMode = mode;
}

const STYLE_COLOR_TOKENS: Record<string, (keyof typeof LIGHT_COLORS)[]> = {
  color: [
    "textPrimary", "textSecondary", "textMuted", "textSubtle",
    "primary", "primaryDark", "primaryDeep", "secondary", "secondaryDark",
    "accent", "indigo", "emergency", "emergencyDark", "warning", "warningDark",
    "success", "successDark",
  ],
  backgroundColor: [
    "background", "surface", "surfaceCard", "surfaceAlt", "surfaceHighlight",
    "primaryLight", "primaryFaint", "secondaryLight", "accentLight", "indigoLight",
    "emergencyLight", "emergencyFaint", "warningLight", "successLight",
  ],
  borderColor: ["border", "borderLight", "borderStrong"],
  borderTopColor: ["border", "borderLight", "borderStrong"],
  borderBottomColor: ["border", "borderLight", "borderStrong"],
  borderLeftColor: ["border", "borderLight", "borderStrong"],
  borderRightColor: ["border", "borderLight", "borderStrong"],
  textDecorationColor: ["textPrimary", "textSecondary", "textMuted", "textSubtle"],
  tintColor: ["primary", "primaryDark", "textMuted"],
};

function getRgbChannels(value: string): [number, number, number] | null {
  const hex = value.match(/^#([\da-f]{3}|[\da-f]{6})$/i)?.[1];
  if (hex) {
    const expanded = hex.length === 3 ? [...hex].map((channel) => channel + channel).join("") : hex;
    return [0, 2, 4].map((offset) => parseInt(expanded.slice(offset, offset + 2), 16)) as [number, number, number];
  }

  const rgb = value.match(/^rgba?\(\s*(\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})(?:,\s*[\d.]+)?\s*\)$/i);
  return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : null;
}

function resolveStyleColor(property: string, value: unknown): unknown {
  if (typeof value !== "string") return value;

  const palette = getThemePalette().colors;
  const token = STYLE_COLOR_TOKENS[property]?.find((key) => LIGHT_COLORS[key] === value);
  if (token) return palette[token];

  if (property === "color") {
    const darkTextAliases: Record<string, keyof typeof LIGHT_COLORS> = {
      "#1e1b4b": "textPrimary",
      "#1e40af": "secondary",
      "#175cd3": "secondary",
      "#92400e": "warningDark",
      "#b45309": "warningDark",
      "#991b1b": "emergencyDark",
      "#b42318": "emergencyDark",
      "#166534": "successDark",
      "#15803d": "successDark",
    };
    if (currentThemeMode === "dark" && darkTextAliases[value.toLowerCase()]) {
      return palette[darkTextAliases[value.toLowerCase()]];
    }
    if (value.toLowerCase() === "black" || value.toLowerCase() === "#000000" || value.toLowerCase() === "#000") {
      return palette.textPrimary;
    }
  }

  if (property === "backgroundColor" && /^rgba\(\s*255,\s*255,\s*255,\s*[\d.]+\s*\)$/i.test(value)) {
    return palette.surfaceCard;
  }
  if (property.startsWith("border") && /^rgba\(\s*255,\s*255,\s*255,\s*[\d.]+\s*\)$/i.test(value)) {
    return palette.border;
  }

  if (currentThemeMode === "dark") {
    const channels = getRgbChannels(value);
    if (channels) {
      const max = Math.max(...channels);
      const min = Math.min(...channels);
      const saturation = max === 0 ? 0 : (max - min) / max;
      const luminance = (channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722) / 255;
      if (property === "color" && luminance < 0.48) return palette.textPrimary;
      if (property === "backgroundColor" && luminance > 0.88 && saturation < 0.16) {
        return palette.surfaceAlt;
      }
      if (property.startsWith("border") && luminance > 0.88 && saturation < 0.16) {
        return palette.border;
      }
    }
  }

  return value;
}

export function createThemedStyles<T extends StyleSheet.NamedStyles<T>>(styles: T): T {
  const registeredStyles = StyleSheet.create(styles);
  return new Proxy(registeredStyles, {
    get(target, property, receiver) {
      const style = Reflect.get(target, property, receiver);
      if (!style || typeof style !== "object" || Array.isArray(style)) return style;

      const themedStyle = { ...style } as Record<string, unknown>;
      for (const [key, value] of Object.entries(themedStyle)) {
        themedStyle[key] = resolveStyleColor(key, value);
      }
      return themedStyle;
    },
  });
}

export function getThemePalette(mode: AppThemeMode = currentThemeMode) {
  return THEME_PALETTES[mode] || THEME_PALETTES.light;
}

/**
 * Returns a live snapshot of the current theme colors.
 * Call at the TOP of a function component (like a hook) so colors update on re-render.
 * Usage:  const C = useThemeColors();
 */
export function useThemeColors(): typeof LIGHT_COLORS {
  const palette = THEME_PALETTES[currentThemeMode] || THEME_PALETTES.light;
  return palette.colors as typeof LIGHT_COLORS;
}
