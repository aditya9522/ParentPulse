import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FeedbackEvent, FeedbackTone, subscribeToAppAlerts } from "../services/appAlert";
import { Colors, Shadows, Spacing, createThemedStyles } from "../theme";
import { useApp } from "../context/AppContext";
import { useGlassBlurTarget } from "./GlassBlurProvider";

const TONE: Record<FeedbackTone, { color: string; soft: string; icon: keyof typeof Ionicons.glyphMap }> = {
  success: { color: "#047857", soft: "#ECFDF5", icon: "checkmark-circle" },
  error: { color: "#B42318", soft: "#FEF3F2", icon: "alert-circle" },
  warning: { color: "#B54708", soft: "#FFFAEB", icon: "warning" },
  info: { color: "#175CD3", soft: "#EFF8FF", icon: "information-circle" },
};

const FrostLayer: React.FC<{
  isDark: boolean;
  blurTarget: React.RefObject<View | null> | null;
}> = ({ isDark, blurTarget }) => Platform.OS === "web" ? null : (
  <BlurView
    pointerEvents="none"
    intensity={Platform.OS === "android" ? 40 : 88}
    tint={isDark ? "dark" : "light"}
    blurTarget={Platform.OS === "android" ? undefined : (blurTarget ?? undefined)}
    blurMethod={Platform.OS === "android" ? "none" : undefined}
    style={StyleSheet.absoluteFill}
  />
);

export const PremiumFeedbackHost: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { themeMode } = useApp();
  const blurTarget = useGlassBlurTarget();
  const [events, setEvents] = useState<FeedbackEvent[]>([]);
  const translateY = useRef(new Animated.Value(-24)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const current = events[0];
  const palette = useMemo(() => TONE[current?.tone || "info"], [current?.tone]);
  const isDark = themeMode === "dark";
  const surfaceColor = isDark
    ? "rgba(15, 23, 42, 0.91)"
    : themeMode === "amber"
      ? "rgba(255, 251, 245, 0.91)"
      : "rgba(255, 255, 255, 0.89)";
  const surfaceBorder = isDark ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.96)";
  const webGlassStyle = Platform.OS === "web"
    ? ({ backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)" } as any)
    : undefined;

  useEffect(() => subscribeToAppAlerts((event) => {
    setEvents((pending) => [...pending, event]);
  }), []);

  useEffect(() => {
    if (!current || current.kind !== "toast") return;
    translateY.setValue(-24);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, friction: 8, tension: 75, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    const timer = setTimeout(() => setEvents((pending) => pending.slice(1)), current.tone === "error" ? 6500 : 4200);
    return () => clearTimeout(timer);
  }, [current, opacity, translateY]);

  const dismiss = () => setEvents((pending) => pending.slice(1));

  const runButton = (index: number) => {
    const button = current?.buttons[index];
    dismiss();
    button?.onPress?.();
  };

  return (
    <>
      {current?.kind === "toast" && (
        <View pointerEvents="box-none" style={[styles.toastLayer, { top: Math.max(insets.top, Platform.OS === "android" ? 12 : 8) + 8 }]}>
          <Animated.View style={[styles.toast, webGlassStyle, { backgroundColor: surfaceColor, borderColor: surfaceBorder, opacity, transform: [{ translateY }] }]}>
            <FrostLayer isDark={isDark} blurTarget={blurTarget} />
            <View style={[styles.iconWrap, { backgroundColor: palette.soft }]}>
              <Ionicons name={palette.icon} size={22} color={palette.color} />
            </View>
            <View style={styles.copyWrap}>
              <Text style={styles.toastTitle}>{current.title}</Text>
              {!!current.message && <Text style={styles.toastMessage}>{current.message}</Text>}
            </View>
            <TouchableOpacity onPress={dismiss} style={styles.closeButton} accessibilityLabel="Dismiss message">
              <Ionicons name="close" size={19} color={Colors.textMuted} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      <Modal
        visible={current?.kind === "dialog"}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={dismiss}
      >
        <View style={styles.backdrop}>
          <View style={[styles.dialog, webGlassStyle, { backgroundColor: surfaceColor, borderColor: surfaceBorder }]}>
            <FrostLayer isDark={isDark} blurTarget={blurTarget} />
            <View style={[styles.dialogIcon, { backgroundColor: palette.soft }]}>
              <Ionicons name={palette.icon} size={28} color={palette.color} />
            </View>
            <Text style={styles.dialogTitle}>{current?.title}</Text>
            {!!current?.message && <Text style={styles.dialogMessage}>{current.message}</Text>}
            <View style={styles.actions}>
              {(current?.buttons || []).map((button, index) => {
                const primary = button.style !== "cancel" && index === (current?.buttons.length || 1) - 1;
                return (
                  <TouchableOpacity
                    key={`${button.text || "OK"}-${index}`}
                    onPress={() => runButton(index)}
                    style={[
                      styles.action,
                      primary && styles.primaryAction,
                      button.style === "destructive" && styles.destructiveAction,
                    ]}
                  >
                    <Text style={[styles.actionText, primary && styles.primaryActionText]}>{button.text || "OK"}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = createThemedStyles({
  toastLayer: { position: "absolute", left: Spacing.md, right: Spacing.md, zIndex: 20000, elevation: 40 },
  toast: { flexDirection: "row", alignItems: "flex-start", padding: 14, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.88)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.95)", ...Shadows.card, elevation: 0 },
  iconWrap: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  copyWrap: { flex: 1, paddingHorizontal: 12, paddingTop: 1 },
  toastTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: "900" },
  toastMessage: { color: Colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  closeButton: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  backdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(15,23,42,0.48)" },
  dialog: { width: "100%", maxWidth: 430, padding: 24, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.88)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.95)", ...Shadows.card, elevation: 0 },
  dialogIcon: { width: 54, height: 54, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  dialogTitle: { color: Colors.textPrimary, fontSize: 21, lineHeight: 27, fontWeight: "900" },
  dialogMessage: { color: Colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 9 },
  actions: { flexDirection: "row", justifyContent: "flex-end", flexWrap: "wrap", gap: 10, marginTop: 24 },
  action: { minHeight: 46, paddingHorizontal: 18, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.75)", borderWidth: 1, borderColor: "rgba(226,232,240,0.85)" },
  primaryAction: { backgroundColor: Colors.primaryDark },
  destructiveAction: { backgroundColor: "#B42318" },
  actionText: { color: Colors.textPrimary, fontSize: 13, fontWeight: "800" },
  primaryActionText: { color: "#FFFFFF" },
});
