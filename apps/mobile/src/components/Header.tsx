import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { Colors, Typography, Spacing, Shadows, BorderRadius, Glass } from "../theme";

export const Header: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    activeParent,
    seniorMode,
    toggleSeniorMode,
    language,
    setLanguage,
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
  } = useApp();

  const isHindi = language === "hi";

  const topInset = Platform.select({
    web: 6,
    ios: Math.max(insets.top, 12),
    android: Math.max(insets.top, 8),
    default: 8,
  });

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
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
            <Text style={styles.brandTitle}>ParentPulse</Text>
            <Text style={styles.brandSub}>
              {isHindi ? "पारिवारिक स्वास्थ्य समन्वय" : "Remote Family Eldercare"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Global Action Chips */}
        <View style={styles.actionsContainer}>
          {/* Language Toggle (EN / HI) */}
          <TouchableOpacity
            style={styles.langBtn}
            onPress={() => setLanguage(language === "en" ? "hi" : "en")}
            accessibilityLabel="Switch Language"
            activeOpacity={0.8}
          >
            <Text style={styles.langBtnText}>{language === "en" ? "हिन्दी" : "English"}</Text>
          </TouchableOpacity>

          {/* Senior Accessibility Mode Toggle */}
          <TouchableOpacity
            style={[styles.seniorToggle, seniorMode && styles.seniorToggleActive]}
            onPress={toggleSeniorMode}
            accessibilityLabel="Toggle Senior Friendly Accessibility Mode"
            activeOpacity={0.8}
          >
            <Ionicons
              name={seniorMode ? "eye" : "eye-outline"}
              size={15}
              color={seniorMode ? Colors.primaryDeep : Colors.textMuted}
            />
            <Text style={[styles.seniorToggleText, seniorMode && styles.seniorToggleTextActive]}>
              {seniorMode ? "Senior On" : "Senior"}
            </Text>
          </TouchableOpacity>

          {/* User Account / Auth Pill */}
          <TouchableOpacity
            style={styles.authPill}
            onPress={() => setAuthModalVisible(true)}
            activeOpacity={0.85}
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

      {/* Active Parent Profile Glass Ribbon (Tapping opens Health Profile) */}
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
            <Text style={[styles.parentName, seniorMode && styles.seniorParentName]}>
              {activeParent.full_name}
            </Text>
            <View style={styles.relationChip}>
              <Text style={styles.relationChipText}>
                {activeParent.gender === "male"
                  ? (isHindi ? "पिताजी" : "Father")
                  : (isHindi ? "माताजी" : "Mother")}
              </Text>
            </View>
          </View>
          <Text style={styles.parentSubDetails}>
            {isHindi ? "रक्त समूह" : "Blood Group"}: {activeParent.blood_group} • Gurugram, India
          </Text>
        </View>

        {/* Quick Header Shortcuts (AI & QR & Report) */}
        <View style={styles.headerShortcuts}>
          <TouchableOpacity
            style={styles.shortcutBtnReport}
            onPress={() => setReportModalVisible(true)}
            accessibilityLabel="Monthly Health Summary"
            activeOpacity={0.8}
          >
            <Ionicons name="document-text" size={16} color="#0D9488" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutBtnAi}
            onPress={() => setAiAssistantModalVisible(true)}
            accessibilityLabel="Ask AI Health Assistant"
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={16} color="#7C3AED" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutBtnQr}
            onPress={() => setDoctorShareModalVisible(true)}
            accessibilityLabel="Doctor Clinical Brief QR"
            activeOpacity={0.8}
          >
            <Ionicons name="qr-code-outline" size={16} color={Colors.secondary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Quick Navigation Drawer Strip */}
      <View style={styles.moduleStrip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moduleScroll}>
          <TouchableOpacity
            style={[styles.moduleChip, syncQueue.length > 0 && styles.syncChipActive]}
            onPress={() => setSyncCenterVisible(true)}
            activeOpacity={0.7}
            accessibilityLabel={`${syncQueue.length} care changes waiting to synchronize`}
          >
            <Ionicons
              name={syncBusy ? "sync" : syncQueue.some((item) => item.state === "blocked" || item.state === "conflict") ? "warning-outline" : syncQueue.length > 0 ? "cloud-upload-outline" : "cloud-done-outline"}
              size={13}
              color={syncQueue.some((item) => item.state === "blocked" || item.state === "conflict") ? "#B54708" : Colors.primaryDark}
            />
            <Text style={[styles.moduleChipText, styles.syncChipText]}>
              {syncBusy ? "Syncing" : syncQueue.length > 0 ? `${syncQueue.length} pending` : "Synced"}
            </Text>
            {syncQueue.length > 0 && <View style={styles.syncCount}><Text style={styles.syncCountText}>{Math.min(syncQueue.length, 99)}</Text></View>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.moduleChip, activeScreen === "tabs" && styles.moduleChipActive]}
            onPress={() => setActiveScreen("tabs")}
            activeOpacity={0.7}
          >
            <Ionicons name="grid-outline" size={12} color={activeScreen === "tabs" ? Colors.primaryDark : Colors.textMuted} />
            <Text style={[styles.moduleChipText, activeScreen === "tabs" && styles.moduleChipTextActive]}>
              {isHindi ? "केयर हब" : "Care Hub"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.moduleChip, activeScreen === "family" && styles.moduleChipActive]}
            onPress={() => setActiveScreen("family")}
            activeOpacity={0.7}
          >
            <Ionicons name="people-outline" size={12} color={activeScreen === "family" ? Colors.primaryDark : Colors.textMuted} />
            <Text style={[styles.moduleChipText, activeScreen === "family" && styles.moduleChipTextActive]}>
              {isHindi ? "परिवार व कार्य" : "Family & Tasks"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.moduleChip, activeScreen === "profile" && styles.moduleChipActive]}
            onPress={() => setActiveScreen("profile")}
            activeOpacity={0.7}
          >
            <Ionicons name="medical-outline" size={12} color={activeScreen === "profile" ? Colors.primaryDark : Colors.textMuted} />
            <Text style={[styles.moduleChipText, activeScreen === "profile" && styles.moduleChipTextActive]}>
              {isHindi ? "स्वास्थ्य प्रोफ़ाइल" : "Health Profile"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.moduleChip, activeScreen === "expenses" && styles.moduleChipActive]}
            onPress={() => setActiveScreen("expenses")}
            activeOpacity={0.7}
          >
            <Ionicons name="receipt-outline" size={12} color={activeScreen === "expenses" ? Colors.primaryDark : Colors.textMuted} />
            <Text style={[styles.moduleChipText, activeScreen === "expenses" && styles.moduleChipTextActive]}>
              {isHindi ? "खर्च व बीमा" : "Expenses & Bills"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.moduleChip}
            onPress={() => setReportModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="analytics-outline" size={12} color="#0D9488" />
            <Text style={[styles.moduleChipText, { color: Colors.primaryDark }]}>
              {isHindi ? "मासिक रिपोर्ट" : "Health Report"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.moduleChip, activeScreen === "settings" && styles.moduleChipActive]}
            onPress={() => setActiveScreen("settings")}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={12} color={activeScreen === "settings" ? Colors.primaryDark : Colors.textMuted} />
            <Text style={[styles.moduleChipText, activeScreen === "settings" && styles.moduleChipTextActive]}>
              {isHindi ? "सेटिंग्स" : "Settings"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    paddingHorizontal: Spacing.md,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 232, 240, 0.7)",
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

