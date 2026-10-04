// apps/mobile/src/components/GlassView.tsx
import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "../context/AppContext";
import { Glass, BorderRadius, createThemedStyles } from "../theme";

interface GlassViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: "light" | "dark" | "default";
  variant?: "card" | "cardElevated" | "pill" | "nav" | "subtle" | "dark" | "heroTeal" | "modal";
}

export const GlassView: React.FC<GlassViewProps> = ({
  children,
  style,
  intensity = 65,
  tint,
  variant = "card",
}) => {
  const { themeMode } = useApp();
  const glassToken = Glass[variant] || Glass.card;
  const isDarkMode = themeMode === "dark" || variant === "dark";
  const isAmberMode = themeMode === "amber";
  const isHeroTeal = variant === "heroTeal";

  const effectiveTint = tint ?? (isDarkMode ? "dark" : "light");

  const webGlassStyle: any =
    Platform.OS === "web"
      ? {
        backdropFilter: `blur(${Math.round(intensity * 0.25)}px)`,
        WebkitBackdropFilter: `blur(${Math.round(intensity * 0.25)}px)`,
      }
      : {};

  let gradientColors: readonly [string, string];
  if (isHeroTeal) {
    gradientColors = isAmberMode
      ? (["rgba(217, 119, 6, 0.90)", "rgba(180, 83, 9, 0.94)"] as const)
      : isDarkMode
        ? (["rgba(20, 184, 166, 0.88)", "rgba(13, 148, 136, 0.94)"] as const)
        : (["rgba(13, 148, 136, 0.88)", "rgba(15, 118, 110, 0.94)"] as const);
  } else if (isDarkMode) {
    gradientColors = ["rgba(30, 41, 59, 0.70)", "rgba(15, 23, 42, 0.85)"] as const;
  } else if (isAmberMode) {
    gradientColors = ["rgba(255, 251, 245, 0.65)", "rgba(254, 243, 199, 0.35)"] as const;
  } else {
    gradientColors = ["rgba(255, 255, 255, 0.50)", "rgba(255, 255, 255, 0.22)"] as const;
  }

  return (
    <View style={[styles.outerContainer, glassToken, webGlassStyle, style]}>
      {Platform.OS !== "web" && (
        <BlurView
          intensity={Platform.OS === "android" ? Math.min(intensity, 40) : intensity}
          tint={effectiveTint}
          blurMethod={Platform.OS === "android" ? "none" : undefined}
          style={[StyleSheet.absoluteFill, styles.blurView]}
        />
      )}
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        pointerEvents="none"
      />
      <View style={styles.contentContainer}>{children}</View>
    </View>
  );
};

const styles = createThemedStyles({
  outerContainer: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    position: "relative",
  },
  blurView: {
    borderRadius: BorderRadius.xl,
  },
  contentContainer: {
    position: "relative",
    zIndex: 1,
  },
});
