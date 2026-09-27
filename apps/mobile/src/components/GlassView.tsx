// apps/mobile/src/components/GlassView.tsx
import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { Glass, BorderRadius } from "../theme";
import { useGlassBlurTarget } from "./GlassBlurProvider";

interface GlassViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: "light" | "dark" | "default";
  variant?: "card" | "cardElevated" | "pill" | "nav" | "subtle" | "dark";
}

export const GlassView: React.FC<GlassViewProps> = ({
  children,
  style,
  intensity = 70,
  tint = "light",
  variant = "card",
}) => {
  const glassStyle = Glass[variant] || Glass.card;
  const blurTarget = useGlassBlurTarget();

  const webGlassStyle: any =
    Platform.OS === "web"
      ? {
          backdropFilter: `blur(${Math.round(intensity * 0.25)}px)`,
          WebkitBackdropFilter: `blur(${Math.round(intensity * 0.25)}px)`,
        }
      : {};

  return (
    <View style={[styles.outerContainer, glassStyle, webGlassStyle, style]}>
      {Platform.OS !== "web" && (
        <BlurView
          intensity={intensity}
          tint={tint}
          blurTarget={blurTarget ?? undefined}
          blurMethod={Platform.OS === "android" ? "dimezisBlurViewSdk31Plus" : "none"}
          style={[StyleSheet.absoluteFill, styles.blurView]}
        />
      )}
      <View style={styles.contentContainer}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
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

