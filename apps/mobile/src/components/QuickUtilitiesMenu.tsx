// apps/mobile/src/components/QuickUtilitiesMenu.tsx
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Sparkles,
  AlertCircle,
  Eye,
  Languages,
  Users,
  Receipt,
  Settings,
  X,
  ChevronRight,
  SlidersHorizontal,
  Palette,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useApp } from "../context/AppContext";
import { GlassView } from "./GlassView";
import { Colors, Typography, Spacing, Shadows, BorderRadius, Gradients } from "../theme";

export const QuickUtilitiesMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const animValue = useRef(new Animated.Value(0)).current;

  const {
    seniorMode,
    toggleSeniorMode,
    language,
    setLanguage,
    themeMode,
    setThemeMode,
    isDark,
    setActiveScreen,
    setAiAssistantModalVisible,
    setSosModalVisible,
  } = useApp();

  const isHindi = language === "hi";

  const triggerHaptic = (style = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(style);
      }
    } catch {}
  };

  const toggleMenu = (open?: boolean) => {
    const next = open !== undefined ? open : !isOpen;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    if (next) {
      setIsOpen(true);
      Animated.spring(animValue, {
        toValue: 1,
        friction: 7,
        tension: 65,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animValue, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => setIsOpen(false));
    }
  };

  const handleAction = (callback: () => void) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    toggleMenu(false);
    // Slight delay to allow modal animation to complete smoothly
    setTimeout(() => {
      callback();
    }, 150);
  };

  const cycleTheme = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const next = themeMode === "light" ? "dark" : themeMode === "dark" ? "amber" : "light";
    setThemeMode(next);
  };

  const bottomOffset = Math.max(insets.bottom, Platform.OS === "ios" ? 12 : 10) + 74;

  const rotateInterpolate = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  const menuScale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });

  const menuOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const menuTranslateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });

  return (
    <>
      {/* Floating Trigger Button (Bottom Right) */}
      <View
        style={[styles.floatingAnchor, { bottom: bottomOffset }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={[styles.triggerFab, Shadows.glowTeal]}
          onPress={() => toggleMenu(true)}
          activeOpacity={0.85}
          accessibilityLabel={isHindi ? "त्वरित सुविधाएं मेनू" : "Quick utilities menu"}
          accessibilityRole="button"
        >
          <LinearGradient
            colors={Gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.triggerGradient}
          >
            <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
              <SlidersHorizontal size={22} color="#FFFFFF" strokeWidth={2.4} />
            </Animated.View>
          </LinearGradient>

          {/* Quick Active Dot indicator if seniorMode is on */}
          {seniorMode && <View style={styles.activeNotificationDot} />}
        </TouchableOpacity>
      </View>

      {/* Expanded Quick Options Overlay Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={() => toggleMenu(false)}
      >
        <TouchableWithoutFeedback onPress={() => toggleMenu(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.menuCardWrapper,
                  {
                    bottom: bottomOffset + 6,
                    opacity: menuOpacity,
                    transform: [{ scale: menuScale }, { translateY: menuTranslateY }],
                  },
                ]}
              >
                <GlassView variant="cardElevated" intensity={88} style={styles.menuCardInner}>
                {/* Header */}
                <View style={styles.menuHeader}>
                  <View style={styles.menuHeaderTitleRow}>
                    <View style={styles.headerIconCircle}>
                      <SlidersHorizontal size={14} color={Colors.primaryDark} />
                    </View>
                    <Text style={styles.menuHeaderTitle}>
                      {isHindi ? "त्वरित सुविधाएं" : "Quick Utilities"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => toggleMenu(false)}
                    activeOpacity={0.7}
                  >
                    <X size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Options List */}
                <View style={styles.optionsList}>
                  {/* 1. AI Care Assistant */}
                  <TouchableOpacity
                    style={styles.optionRow}
                    onPress={() => handleAction(() => setAiAssistantModalVisible(true))}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.optionIconBox, { backgroundColor: "#CCFBF1" }]}>
                      <Sparkles size={18} color="#0D9488" />
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>
                        {isHindi ? "एआई स्वास्थ्य सहायक" : "AI Care Assistant"}
                      </Text>
                      <Text style={styles.optionSubtitle}>
                        {isHindi ? "लक्षण व रिपोर्ट विश्लेषण" : "Clinical & prescription insights"}
                      </Text>
                    </View>
                    <ChevronRight size={16} color={Colors.textMuted} />
                  </TouchableOpacity>

                  {/* 2. Emergency SOS */}
                  <TouchableOpacity
                    style={styles.optionRow}
                    onPress={() => handleAction(() => setSosModalVisible(true))}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.optionIconBox, { backgroundColor: "#FEE2E2" }]}>
                      <AlertCircle size={18} color="#DC2626" />
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={[styles.optionTitle, { color: "#DC2626" }]}>
                        {isHindi ? "आपातकालीन एसओएस" : "Emergency SOS"}
                      </Text>
                      <Text style={styles.optionSubtitle}>
                        {isHindi ? "1-टैप जीपीएस व अलर्ट" : "Broadcast GPS to family"}
                      </Text>
                    </View>
                    <ChevronRight size={16} color={Colors.textMuted} />
                  </TouchableOpacity>

                  {/* 3. Senior Mode Toggle */}
                  <TouchableOpacity
                    style={styles.optionRow}
                    onPress={() => {
                      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                      toggleSeniorMode();
                    }}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.optionIconBox,
                        { backgroundColor: seniorMode ? Colors.primaryLight : Colors.surfaceAlt },
                      ]}
                    >
                      <Eye
                        size={18}
                        color={seniorMode ? Colors.primaryDeep : Colors.textSecondary}
                      />
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>
                        {isHindi ? "सीनियर फ्रेंडली मोड" : "Senior Mode"}
                      </Text>
                      <Text style={styles.optionSubtitle}>
                        {seniorMode
                          ? (isHindi ? "बड़ा फ़ॉन्ट व सरल स्पर्श सक्रिय" : "Large font & high contrast active")
                          : (isHindi ? "सक्रिय करने के लिए टैप करें" : "Tap to enlarge font & icons")}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        seniorMode ? styles.statusBadgeActive : styles.statusBadgeInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          seniorMode && styles.statusBadgeTextActive,
                        ]}
                      >
                        {seniorMode ? "ON" : "OFF"}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* 4. App Theme Switcher */}
                  <TouchableOpacity
                    style={styles.optionRow}
                    onPress={cycleTheme}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.optionIconBox,
                        {
                          backgroundColor:
                            themeMode === "dark"
                              ? "rgba(20, 184, 166, 0.25)"
                              : themeMode === "amber"
                              ? "#FEF3C7"
                              : "#CCFBF1",
                        },
                      ]}
                    >
                      <Palette
                        size={18}
                        color={
                          themeMode === "dark"
                            ? "#14B8A6"
                            : themeMode === "amber"
                            ? "#D97706"
                            : "#0D9488"
                        }
                      />
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>
                        {isHindi ? "ऐप थीम" : "App Theme"}
                      </Text>
                      <Text style={styles.optionSubtitle}>
                        {themeMode === "light"
                          ? (isHindi ? "शांत हरा • टैप: डार्क" : "Serene Emerald • Tap: Dark")
                          : themeMode === "dark"
                          ? (isHindi ? "मध्यरात्रि काला • टैप: अम्बर" : "Midnight Dark • Tap: Amber")
                          : (isHindi ? "आयुर्वेदिक अम्बर • टैप: लाइट" : "Ayurvedic Amber • Tap: Light")}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.themeBadge,
                        {
                          borderColor:
                            themeMode === "dark"
                              ? "#14B8A6"
                              : themeMode === "amber"
                              ? "#D97706"
                              : "#0D9488",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.themeDot,
                          {
                            backgroundColor:
                              themeMode === "dark"
                                ? "#14B8A6"
                                : themeMode === "amber"
                                ? "#D97706"
                                : "#0D9488",
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.themeBadgeText,
                          {
                            color:
                              themeMode === "dark"
                                ? "#14B8A6"
                                : themeMode === "amber"
                                ? "#D97706"
                                : "#0D9488",
                          },
                        ]}
                      >
                        {themeMode === "light" ? "Emerald" : themeMode === "dark" ? "Dark" : "Amber"}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* 5. Language Switch */}
                  <TouchableOpacity
                    style={styles.optionRow}
                    onPress={() => {
                      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                      setLanguage(language === "en" ? "hi" : "en");
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.optionIconBox, { backgroundColor: "#E0E7FF" }]}>
                      <Languages size={18} color="#4F46E5" />
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>
                        {isHindi ? "भाषा (Language)" : "App Language"}
                      </Text>
                      <Text style={styles.optionSubtitle}>
                        {language === "en" ? "English → हिन्दी" : "हिन्दी → English"}
                      </Text>
                    </View>
                    <View style={styles.langPill}>
                      <Text style={styles.langPillText}>
                        {language === "en" ? "हिन्दी" : "English"}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* 5. Family Care Circle */}
                  <TouchableOpacity
                    style={styles.optionRow}
                    onPress={() => handleAction(() => setActiveScreen("family"))}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.optionIconBox, { backgroundColor: "#F3E8FF" }]}>
                      <Users size={18} color="#7C3AED" />
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>
                        {isHindi ? "पारिवारिक सर्कल" : "Family Care Circle"}
                      </Text>
                      <Text style={styles.optionSubtitle}>
                        {isHindi ? "कार्य व सदस्य प्रबंधन" : "Care tasks & member roles"}
                      </Text>
                    </View>
                    <ChevronRight size={16} color={Colors.textMuted} />
                  </TouchableOpacity>

                  {/* 6. Medical Expenses & Insurance */}
                  <TouchableOpacity
                    style={styles.optionRow}
                    onPress={() => handleAction(() => setActiveScreen("expenses"))}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.optionIconBox, { backgroundColor: "#ECFDF5" }]}>
                      <Receipt size={18} color="#059669" />
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>
                        {isHindi ? "खर्च व स्वास्थ्य बीमा" : "Expenses & Insurance"}
                      </Text>
                      <Text style={styles.optionSubtitle}>
                        {isHindi ? "बिल व कैशलेस पॉलिसियां" : "Medical bills & TPA policies"}
                      </Text>
                    </View>
                    <ChevronRight size={16} color={Colors.textMuted} />
                  </TouchableOpacity>

                  {/* 7. Settings & Account */}
                  <TouchableOpacity
                    style={[styles.optionRow, { borderBottomWidth: 0 }]}
                    onPress={() => handleAction(() => setActiveScreen("settings"))}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.optionIconBox, { backgroundColor: Colors.surfaceAlt }]}>
                      <Settings size={18} color={Colors.textPrimary} />
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>
                        {isHindi ? "सेटिंग्स व खाता" : "Settings & Profile"}
                      </Text>
                      <Text style={styles.optionSubtitle}>
                        {isHindi ? "गोपनीयता, प्रोफ़ाइल व डेटा" : "Privacy, avatar & preferences"}
                      </Text>
                    </View>
                    <ChevronRight size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
                </GlassView>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingAnchor: {
    position: "absolute",
    right: 18,
    zIndex: 99,
  },
  triggerFab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  triggerGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  activeNotificationDot: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F59E0B",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    paddingRight: 16,
  },
  menuCardWrapper: {
    width: 320,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  menuCardInner: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 6,
  },
  menuHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  menuHeaderTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  optionsList: {
    gap: 2,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(241, 245, 249, 0.9)",
  },
  optionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  optionSubtitle: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  statusBadgeActive: {
    backgroundColor: Colors.primary,
  },
  statusBadgeInactive: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
  },
  statusBadgeTextActive: {
    color: "#FFFFFF",
  },
  langPill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  langPillText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  themeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  themeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  themeBadgeText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
  },
});
