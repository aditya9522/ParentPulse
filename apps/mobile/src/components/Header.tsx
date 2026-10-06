import React, { useState } from "react";
import { View, Text, TouchableOpacity, Platform, Image, ScrollView } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { Colors, Typography, Spacing, Shadows, BorderRadius, Glass, createThemedStyles } from "../theme";

export const Header: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    activeParent,
    seniorMode,
    language,
    setSosModalVisible,
    setDoctorShareModalVisible,
    setAiAssistantModalVisible,
    setReportModalVisible,
    setAuthModalVisible,
    activeScreen,
    setActiveScreen,
    syncQueue,
    syncBusy,
    setSyncCenterVisible,
    isDark,
    themeMode,
  } = useApp();

  const [parentCardExpanded, setParentCardExpanded] = useState(true);

  const isHindi = language === "hi";

  const topInset = Platform.select({
    web: 6,
    ios: Math.max(insets.top, 12),
    android: Math.max(insets.top, 8),
    default: 8,
  });

  const headerBg = isDark ? "rgba(9, 13, 22, 0.94)" : themeMode === "amber" ? "rgba(253, 251, 247, 0.95)" : "rgba(255, 255, 255, 0.94)";
  const headerBorder = isDark ? "rgba(51, 65, 85, 0.6)" : themeMode === "amber" ? "rgba(243, 230, 209, 0.8)" : "rgba(226, 232, 240, 0.7)";
  const pillBg = isDark ? "rgba(30, 41, 59, 0.85)" : themeMode === "amber" ? "rgba(255, 251, 245, 0.9)" : "rgba(255, 255, 255, 0.85)";
  const pillBorder = isDark ? "rgba(51, 65, 85, 0.8)" : themeMode === "amber" ? "rgba(253, 230, 138, 0.6)" : "rgba(255, 255, 255, 0.95)";
  const chipBg = isDark ? "rgba(30, 41, 59, 0.75)" : themeMode === "amber" ? "rgba(255, 251, 245, 0.8)" : "rgba(255, 255, 255, 0.8)";
  const chipBorder = isDark ? "rgba(51, 65, 85, 0.7)" : themeMode === "amber" ? "rgba(253, 230, 138, 0.5)" : Colors.border;

  // Dynamic text colors — read at render time so theme switches are reflected
  const dynTextPrimary = Colors.textPrimary;
  const dynTextMuted = Colors.textMuted;
  const shortcutAiBg = isDark ? "rgba(88, 28, 135, 0.35)" : themeMode === "amber" ? "rgba(237, 233, 254, 0.85)" : "rgba(243, 232, 255, 0.8)";
  const shortcutQrBg = isDark ? "rgba(3, 105, 161, 0.35)" : themeMode === "amber" ? "rgba(224, 242, 254, 0.85)" : "rgba(224, 242, 254, 0.8)";
  const shortcutRptBg = isDark ? "rgba(15, 118, 110, 0.35)" : themeMode === "amber" ? "rgba(204, 251, 241, 0.85)" : "rgba(204, 251, 241, 0.8)";

  return (
    <View style={[styles.container, { paddingTop: topInset, backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
      <View style={styles.headerInner}>
      {/* Top Utility Bar */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.brandContainer}
          onPress={() => setActiveScreen("tabs")}
          activeOpacity={0.8}
        >
          <View style={styles.logoBadge}>
            <Image
              source={require("../../assets/icon.png")}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>
          <View>
            <Text style={[styles.brandTitle, { color: dynTextPrimary }]}>ParentPulse</Text>
            <Text style={[styles.brandSub, { color: dynTextMuted }]}>
              {isHindi ? "पारिवारिक स्वास्थ्य समन्वय" : "Remote Family Eldercare"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Global Action Chips */}
        <View style={styles.actionsContainer}>
          {/* Expand / Collapse Second Top Parent Card Button (Left side of Profile Icon) */}
          <TouchableOpacity
            style={[styles.collapseToggleBtn, { backgroundColor: pillBg, borderColor: pillBorder }]}
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setParentCardExpanded((prev) => !prev);
            }}
            activeOpacity={0.8}
            accessibilityLabel={parentCardExpanded ? "Collapse parent profile card" : "Expand parent profile card"}
          >
            <Ionicons
              name={parentCardExpanded ? "chevron-up" : "chevron-down"}
              size={16}
              color={Colors.primaryDark}
            />
          </TouchableOpacity>

          {/* User Account / Auth Pill (Profile Icon) */}
          <TouchableOpacity
            style={[styles.authPill, { backgroundColor: pillBg, borderColor: pillBorder }]}
            onPress={() => setAuthModalVisible(true)}
            activeOpacity={0.85}
            accessibilityLabel="User Account Profile"
          >
            <Ionicons name="person-circle-outline" size={18} color={Colors.primaryDark} />
          </TouchableOpacity>

          {/* Quick Emergency SOS Pill */}
          <TouchableOpacity
            style={[styles.sosPill, Shadows.glowRed]}
            onPress={() => setSosModalVisible(true)}
            activeOpacity={0.85}
            accessibilityLabel="Trigger Emergency SOS"
          >
            <Ionicons name="alert-circle" size={15} color="#FFFFFF" />
            <Text style={styles.sosPillText}>SOS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Parent Profile Glass Ribbon (Tapping opens Health Profile, Expand/Collapse Toggleable) */}
      {parentCardExpanded && (
        <TouchableOpacity
          style={[styles.parentRibbon, Glass.card]}
          onPress={() => setActiveScreen("profile")}
          activeOpacity={0.85}
        >
          <View style={styles.avatarWrapper}>
            <Image
              source={require("../../assets/parent_avatar.jpg")}
              style={styles.parentAvatarImage}
              resizeMode="cover"
            />
            <View style={styles.activeStatusDot} />
          </View>

          <View style={styles.parentTextInfo}>
            <View style={styles.parentNameRow}>
              <Text style={[styles.parentName, seniorMode && styles.seniorParentName, { color: dynTextPrimary }]}>
                {activeParent.full_name}
              </Text>
              <View style={styles.relationChip}>
                <Text style={styles.relationChipText}>
                  {activeParent.gender === "male"
                    ? (isHindi ? "पिताजी" : "Father")
                    : activeParent.gender === "female"
                    ? (isHindi ? "माताजी" : "Mother")
                    : (isHindi ? "अभिभावक" : "Parent")}
                </Text>
              </View>
            </View>
            <Text style={[styles.parentSubDetails, { color: dynTextMuted }]} numberOfLines={1}>
              {isHindi ? "रक्त समूह" : "Blood Group"}: {activeParent.blood_group || "N/A"} • {activeParent.address ? activeParent.address.split(",")[0] : (isHindi ? "केयर हब" : "Care Hub")}
            </Text>
          </View>

          {/* Quick Header Shortcuts (AI & QR & Report) */}
          <View style={styles.headerShortcuts}>
            <TouchableOpacity
              style={[styles.shortcutBtnReport, { backgroundColor: shortcutRptBg }]}
              onPress={() => setReportModalVisible(true)}
              accessibilityLabel="Monthly Health Summary"
              activeOpacity={0.8}
            >
              <Ionicons name="document-text" size={16} color={Colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shortcutBtnAi, { backgroundColor: shortcutAiBg }]}
              onPress={() => setAiAssistantModalVisible(true)}
              accessibilityLabel="Ask AI Health Assistant"
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={16} color="#7C3AED" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shortcutBtnQr, { backgroundColor: shortcutQrBg }]}
              onPress={() => setDoctorShareModalVisible(true)}
              accessibilityLabel="Doctor Clinical Brief QR"
              activeOpacity={0.8}
            >
              <Ionicons name="qr-code-outline" size={16} color={Colors.secondary} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* Quick Navigation Drawer Strip */}
      <View style={styles.moduleStrip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moduleScroll}>
          <TouchableOpacity
            style={[styles.moduleChip, { backgroundColor: chipBg, borderColor: chipBorder }, syncQueue.length > 0 && styles.syncChipActive]}
            onPress={() => setSyncCenterVisible(true)}
            activeOpacity={0.7}
            accessibilityLabel={`${syncQueue.length} care changes waiting to synchronize`}
          >
            <Ionicons
              name={syncBusy ? "sync" : syncQueue.some((item) => item.state === "blocked" || item.state === "conflict") ? "warning-outline" : syncQueue.length > 0 ? "cloud-upload-outline" : "cloud-done-outline"}
              size={13}
              color={syncQueue.some((item) => item.state === "blocked" || item.state === "conflict") ? "#B54708" : Colors.primaryDark}
            />
            <Text style={[styles.moduleChipText, styles.syncChipText, { color: Colors.primaryDark }]}>
              {syncBusy ? "Syncing" : syncQueue.length > 0 ? `${syncQueue.length} pending` : "Synced"}
            </Text>
            {syncQueue.length > 0 && <View style={styles.syncCount}><Text style={styles.syncCountText}>{Math.min(syncQueue.length, 99)}</Text></View>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.moduleChip, { backgroundColor: chipBg, borderColor: chipBorder }, activeScreen === "tabs" && styles.moduleChipActive]}
            onPress={() => setActiveScreen("tabs")}
            activeOpacity={0.7}
          >
            <Ionicons name="grid-outline" size={12} color={activeScreen === "tabs" ? Colors.primaryDark : dynTextMuted} />
            <Text style={[styles.moduleChipText, activeScreen === "tabs" && styles.moduleChipTextActive, { color: activeScreen === "tabs" ? Colors.primaryDark : dynTextMuted }]}>
              {isHindi ? "केयर हब" : "Care Hub"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.moduleChip, { backgroundColor: chipBg, borderColor: chipBorder }, activeScreen === "family" && styles.moduleChipActive]}
            onPress={() => setActiveScreen("family")}
            activeOpacity={0.7}
          >
            <Ionicons name="people-outline" size={12} color={activeScreen === "family" ? Colors.primaryDark : dynTextMuted} />
            <Text style={[styles.moduleChipText, activeScreen === "family" && styles.moduleChipTextActive, { color: activeScreen === "family" ? Colors.primaryDark : dynTextMuted }]}>
              {isHindi ? "परिवार व कार्य" : "Family & Tasks"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.moduleChip, { backgroundColor: chipBg, borderColor: chipBorder }, activeScreen === "profile" && styles.moduleChipActive]}
            onPress={() => setActiveScreen("profile")}
            activeOpacity={0.7}
          >
            <Ionicons name="medical-outline" size={12} color={activeScreen === "profile" ? Colors.primaryDark : dynTextMuted} />
            <Text style={[styles.moduleChipText, activeScreen === "profile" && styles.moduleChipTextActive, { color: activeScreen === "profile" ? Colors.primaryDark : dynTextMuted }]}>
              {isHindi ? "स्वास्थ्य प्रोफ़ाइल" : "Health Profile"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.moduleChip, { backgroundColor: chipBg, borderColor: chipBorder }, activeScreen === "expenses" && styles.moduleChipActive]}
            onPress={() => setActiveScreen("expenses")}
            activeOpacity={0.7}
          >
            <Ionicons name="receipt-outline" size={12} color={activeScreen === "expenses" ? Colors.primaryDark : dynTextMuted} />
            <Text style={[styles.moduleChipText, activeScreen === "expenses" && styles.moduleChipTextActive, { color: activeScreen === "expenses" ? Colors.primaryDark : dynTextMuted }]}>
              {isHindi ? "खर्च व बीमा" : "Expenses & Bills"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.moduleChip, { backgroundColor: chipBg, borderColor: chipBorder }]}
            onPress={() => setReportModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="analytics-outline" size={12} color={Colors.primaryDark} />
            <Text style={[styles.moduleChipText, { color: Colors.primaryDark }]}>
              {isHindi ? "मासिक रिपोर्ट" : "Health Report"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.moduleChip, { backgroundColor: chipBg, borderColor: chipBorder }, activeScreen === "settings" && styles.moduleChipActive]}
            onPress={() => setActiveScreen("settings")}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={12} color={activeScreen === "settings" ? Colors.primaryDark : dynTextMuted} />
            <Text style={[styles.moduleChipText, activeScreen === "settings" && styles.moduleChipTextActive, { color: activeScreen === "settings" ? Colors.primaryDark : dynTextMuted }]}>
              {isHindi ? "सेटिंग्स" : "Settings"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      </View>
    </View>
  );
};

const styles = createThemedStyles({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    paddingHorizontal: Spacing.md,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 232, 240, 0.7)",
    width: "100%",
  },
  headerInner: {
    width: "100%",
    maxWidth: 960,
    alignSelf: "center",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginRight: Spacing.sm,
    ...Shadows.glowTeal,
  },
  logoImage: {
    width: "100%",
    height: "100%",
    borderRadius: BorderRadius.md,
  },
  brandTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  brandSub: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  langBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.95)",
    ...Shadows.subtle,
  },
  langBtnText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  seniorToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.95)",
    ...Shadows.subtle,
  },
  seniorToggleActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  seniorToggleText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
  },
  seniorToggleTextActive: {
    color: Colors.primaryDeep,
  },
  collapseToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 1)",
    ...Shadows.subtle,
  },
  sosPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.emergencyDark,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  sosPillText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: 0.5,
  },
  parentRibbon: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  avatarWrapper: {
    position: "relative",
    marginRight: Spacing.sm,
  },
  parentAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  activeStatusDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  parentTextInfo: {
    flex: 1,
  },
  parentNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  parentName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  seniorParentName: {
    fontSize: Typography.seniorSizes.sm,
  },
  relationChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  relationChipText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDeep,
  },
  parentSubDetails: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  headerShortcuts: {
    flexDirection: "row",
    gap: 6,
  },
  shortcutBtnAi: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(243, 232, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
    ...Shadows.subtle,
  },
  shortcutBtnQr: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(224, 242, 254, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
    ...Shadows.subtle,
  },
  shortcutBtnReport: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(204, 251, 241, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
    ...Shadows.subtle,
  },
  authPill: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.95)",
    ...Shadows.subtle,
  },
  moduleStrip: {
    marginTop: 6,
    paddingTop: 4,
  },
  moduleScroll: {
    gap: 6,
  },
  moduleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  moduleChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  syncChipActive: {
    backgroundColor: "#F0FDFA",
    borderColor: "#99F6E4",
  },
  syncChipText: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  syncCount: {
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primaryDark,
  },
  syncCountText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: Typography.weights.extraBold,
  },
  moduleChipText: {
    fontSize: 11,
    fontWeight: Typography.weights.semibold,
    color: Colors.textMuted,
  },
  moduleChipTextActive: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
});

