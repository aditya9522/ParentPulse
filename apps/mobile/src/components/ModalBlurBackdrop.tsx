import React from "react";
import { StyleSheet, View, Animated, Platform, StyleProp, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { useApp } from "../context/AppContext";

interface ModalBlurBackdropProps {
  opacity?: Animated.Value | Animated.AnimatedInterpolation<string | number> | number;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: "light" | "dark" | "default";
}

export const ModalBlurBackdrop: React.FC<ModalBlurBackdropProps> = ({
  opacity = 1,
  style,
  intensity,
  tint,
}) => {
  const { isDark, themeMode } = useApp();

  const isDarkMode = isDark || themeMode === "dark";
  const defaultIntensity = Platform.OS === "android" ? 35 : isDarkMode ? 60 : 75;
  const effectiveIntensity = intensity ?? defaultIntensity;
  const effectiveTint = tint ?? (isDarkMode ? "dark" : "dark");

  const overlayBg = isDarkMode
    ? "rgba(9, 13, 22, 0.62)"
    : "rgba(15, 23, 42, 0.45)";

  const webGlassStyle: any =
    Platform.OS === "web"
      ? {
          backdropFilter: `blur(${Math.round(effectiveIntensity * 0.35)}px)`,
          WebkitBackdropFilter: `blur(${Math.round(effectiveIntensity * 0.35)}px)`,
        }
      : {};

  if (typeof opacity === "number") {
    return (
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }, style]}>
        {Platform.OS !== "web" ? (
          <BlurView
            intensity={effectiveIntensity}
            tint={effectiveTint}
            blurMethod={Platform.OS === "android" ? "none" : undefined}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: overlayBg }, webGlassStyle]} />
      </View>
    );
  }

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }, style]}>
      {Platform.OS !== "web" ? (
        <BlurView
          intensity={effectiveIntensity}
          tint={effectiveTint}
          blurMethod={Platform.OS === "android" ? "none" : undefined}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: overlayBg }, webGlassStyle]} />
    </Animated.View>
  );
};
