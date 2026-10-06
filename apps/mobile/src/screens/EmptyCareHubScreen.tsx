import React from "react";
import { Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useApp } from "../context/AppContext";
import { apiClient } from "../api/client";
import { AmbientBackground } from "../components/AmbientBackground";
import { BorderRadius, Colors, Shadows, Spacing, Typography, createThemedStyles } from "../theme";

const CAPABILITIES = [
  { icon: "pulse" as const, title: "Daily health signals", detail: "Vitals, blood sugar, blood pressure & refill alerts" },
  { icon: "shield-checkmark" as const, title: "Private family circle", detail: "Multi-city coordination with trusted members" },
  { icon: "document-lock" as const, title: "Secure medical vault", detail: "OCR prescription scanning & doctor-ready briefs" },
];

export const EmptyCareHubScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { currentUser, familyMembers, setActiveScreen, setHasCompletedOnboarding, isDark, language } = useApp();
  const isHindi = language === "hi";

  // If the user has no family members yet, they are the initial user and MUST be able to set up their care circle.
  const canSetUpCareCircle =
    familyMembers.length === 0 ||
    familyMembers.some((member) => member.user_id === currentUser.id && member.is_owner);

  const startSetup = () => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setHasCompletedOnboarding(false);
    setActiveScreen("onboarding");
  };

  const appBg = isDark ? "#090D16" : "#F4FBFA";

  return (
    <View style={[styles.screen, { backgroundColor: appBg, paddingTop: Math.max(insets.top, 16) + 8, paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      <AmbientBackground />

      {/* Top Brand Header */}
      <View style={styles.header}>
        <View style={styles.identity}>
          <View style={styles.brandMark}>
            <Ionicons name="pulse" size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.brand}>ParentPulse</Text>
            <Text style={styles.brandSub}>DISTANCE ELDERCARE HUB</Text>
          </View>
        </View>

        <View style={styles.accountPill}>
          <Ionicons name="person-circle-outline" size={16} color={Colors.primaryDark} />
          <Text style={styles.accountText} numberOfLines={1}>
            {currentUser.full_name || currentUser.email || "Active User"}
          </Text>
        </View>
      </View>

      {/* Main Hero & Content Flow */}
      <View style={styles.content}>
        {/* Hero Card */}
        <LinearGradient
          colors={["#073F3A", "#0F766E", "#15998D"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroGlow} />
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles" size={12} color="#99F6E4" />
            <Text style={styles.heroBadgeText}>
              {isHindi ? "केयर हब सक्रिय है" : "CARE HUB READY"}
            </Text>
          </View>

          <Text style={styles.title}>
            {canSetUpCareCircle
              ? (isHindi ? "पहला माता-पिता प्रोफ़ाइल जोड़ें" : "Connect your first parent profile")
              : (isHindi ? "आपका केयर सर्कल तैयार है" : "Your care circle is ready")}
          </Text>

          <Text style={styles.subtitle}>
            {canSetUpCareCircle
              ? (isHindi
                  ? "लाइव रिकॉर्ड्स, दवा समन्वय, आपातकालीन सुरक्षा और पारिवारिक पहुंच सक्रिय करने के लिए प्रोफ़ाइल जोड़ें।"
                  : "Add the person you care for to activate live vitals, medicine tracking, emergency SOS, and synchronized family coordination.")
              : (isHindi
                  ? "आप सफलतापूर्वक साइन इन हैं। केयर सर्कल स्वामी द्वारा प्रोफ़ाइल जोड़ने पर वह यहाँ स्वतः दिखाई देगा।"
                  : "You’re signed in. When the care circle administrator adds a parent profile, it will synchronize here automatically.")}
          </Text>

          {canSetUpCareCircle && (
            <TouchableOpacity style={styles.primaryButton} onPress={startSetup} activeOpacity={0.88}>
              <Text style={styles.primaryButtonText}>
                {isHindi ? "केयर सर्कल सेट अप करें" : "Set Up Care Circle"}
              </Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.primaryDark} />
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* Feature Capabilities Panel */}
        <View style={styles.capabilityPanel}>
          {CAPABILITIES.map((item, idx) => (
            <View
              key={item.title}
              style={[
                styles.capabilityRow,
                idx === CAPABILITIES.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View style={styles.capabilityIcon}>
                <Ionicons name={item.icon} size={18} color={Colors.primaryDark} />
              </View>
              <View style={styles.capabilityCopy}>
                <Text style={styles.capabilityTitle}>{item.title}</Text>
                <Text style={styles.capabilityDetail}>{item.detail}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={15} color={Colors.primary} />
            </View>
          ))}
        </View>

        <Text style={styles.privacyNote}>
          {canSetUpCareCircle
            ? (isHindi
                ? "सेटअप पूरा होने तक कोई संवेदनशील डेटा नहीं बनाया जाता। आपका परिवार पूर्ण नियंत्रण में रहता है।"
                : "No health records are shared until you complete setup. End-to-end access is restricted only to verified family members.")
            : (isHindi
                ? "आपका खाता सक्रिय है। डेटा केवल आपके परिवार के सदस्यों तक सीमित है।"
                : "Your account is authenticated. Access is strictly scoped to your care circle permissions.")}
        </Text>
      </View>

      {/* Footer Sign-out / Switch Option */}
      <TouchableOpacity
        style={styles.signOutButton}
        onPress={() => void apiClient.signOut()}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={16} color={Colors.textMuted} />
        <Text style={styles.signOutText}>
          {isHindi ? "अन्य खाते से साइन इन करें" : "Sign in with another account"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = createThemedStyles({
  screen: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
    zIndex: 1,
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primaryDark,
    ...Shadows.glowTeal,
  },
  brand: {
    fontSize: 18,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  brandSub: {
    marginTop: 1,
    fontSize: 7.5,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: 1,
    color: Colors.textMuted,
  },
  accountPill: {
    maxWidth: 140,
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  accountText: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    gap: 14,
    zIndex: 1,
  },
  hero: {
    borderRadius: 28,
    overflow: "hidden",
    padding: 22,
    ...Shadows.cardElevated,
  },
  heroGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -70,
    top: -90,
    backgroundColor: "rgba(153,246,228,0.16)",
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  heroBadgeText: {
    fontSize: 8.5,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: 1,
    color: "#CCFBF1",
  },
  title: {
    maxWidth: 310,
    marginTop: 16,
    color: "#FFFFFF",
    fontSize: 26,
    lineHeight: 32,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: -0.7,
  },
  subtitle: {
    marginTop: 8,
    maxWidth: 340,
    color: "#D5FAF5",
    fontSize: 12.5,
    lineHeight: 18,
  },
  primaryButton: {
    marginTop: 20,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    ...Shadows.cardElevated,
  },
  primaryButtonText: {
    color: Colors.primaryDark,
    fontSize: 13.5,
    fontWeight: Typography.weights.extraBold,
  },
  capabilityPanel: {
    padding: 6,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    ...Shadows.card,
  },
  capabilityRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  capabilityIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primaryFaint,
  },
  capabilityCopy: {
    flex: 1,
  },
  capabilityTitle: {
    fontSize: 12,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  capabilityDetail: {
    marginTop: 2,
    fontSize: 10,
    color: Colors.textMuted,
  },
  privacyNote: {
    paddingHorizontal: 8,
    textAlign: "center",
    fontSize: 10,
    lineHeight: 15,
    color: Colors.textMuted,
  },
  signOutButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    zIndex: 1,
  },
  signOutText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
  },
});
