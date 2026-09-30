import React from "react";
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { apiClient } from "../api/client";
import { AmbientBackground } from "../components/AmbientBackground";
import { BorderRadius, Colors, Shadows, Spacing, Typography } from "../theme";

const CAPABILITIES = [
  { icon: "pulse" as const, title: "Daily health signals", detail: "Vitals, medicines and refill tracking" },
  { icon: "shield-checkmark" as const, title: "Private care circle", detail: "Invite only the people you trust" },
  { icon: "document-lock" as const, title: "Secure medical vault", detail: "Records and doctor-ready summaries" },
];

export const EmptyCareHubScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { currentUser, familyMembers, setActiveScreen, setHasCompletedOnboarding } = useApp();
  const canSetUpCareCircle = familyMembers.some(
    (member) => member.user_id === currentUser.id && member.is_owner,
  );

  const startSetup = () => {
    setHasCompletedOnboarding(false);
    setActiveScreen("onboarding");
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 18 }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4FBFA" />
      <AmbientBackground />

      <View style={styles.header}>
        <View style={styles.identity}>
          <View style={styles.brandMark}><Ionicons name="pulse" size={22} color="#FFFFFF" /></View>
          <View>
            <Text style={styles.brand}>ParentPulse</Text>
            <Text style={styles.brandSub}>PRIVATE DISTANCE ELDERCARE</Text>
          </View>
        </View>
        <View style={styles.accountPill}>
          <Ionicons name="person-circle-outline" size={18} color={Colors.primaryDark} />
          <Text style={styles.accountText} numberOfLines={1}>{currentUser.full_name || currentUser.email}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <LinearGradient
          colors={["#073F3A", "#0F766E", "#15998D"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroGlow} />
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles" size={13} color="#99F6E4" />
            <Text style={styles.heroBadgeText}>YOUR CARE HUB IS READY</Text>
          </View>
          <Text style={styles.title}>{canSetUpCareCircle ? "Connect your first parent profile" : "Your care circle is ready"}</Text>
          <Text style={styles.subtitle}>
            {canSetUpCareCircle
              ? "Add the person you care for to activate live records, medicine coordination, emergency details and family access."
              : "You’re signed in successfully. The care-circle owner can add a parent profile, and it will appear here automatically."}
          </Text>
          {canSetUpCareCircle && (
            <TouchableOpacity style={styles.primaryButton} onPress={startSetup} activeOpacity={0.86}>
              <Text style={styles.primaryButtonText}>Set up care circle</Text>
              <Ionicons name="arrow-forward" size={19} color={Colors.primaryDark} />
            </TouchableOpacity>
          )}
        </LinearGradient>

        <View style={styles.capabilityPanel}>
          {CAPABILITIES.map((item) => (
            <View key={item.title} style={styles.capabilityRow}>
              <View style={styles.capabilityIcon}><Ionicons name={item.icon} size={19} color={Colors.primaryDark} /></View>
              <View style={styles.capabilityCopy}>
                <Text style={styles.capabilityTitle}>{item.title}</Text>
                <Text style={styles.capabilityDetail}>{item.detail}</Text>
              </View>
              <Ionicons name="lock-closed" size={14} color={Colors.textSubtle} />
            </View>
          ))}
        </View>

        <Text style={styles.privacyNote}>
          {canSetUpCareCircle
            ? "No medical information is created until you complete setup. You remain in control of every member and permission."
            : "Your account is active. Access remains limited to the care circles and permissions assigned to your role."}
        </Text>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={() => void apiClient.signOut()}>
        <Ionicons name="log-out-outline" size={17} color={Colors.textMuted} />
        <Text style={styles.signOutText}>Sign in with another account</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F4FBFA", paddingHorizontal: Spacing.md },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", zIndex: 1 },
  identity: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: Colors.primaryDark, ...Shadows.glowTeal },
  brand: { fontSize: 19, fontWeight: Typography.weights.extraBold, color: Colors.textPrimary, letterSpacing: -0.4 },
  brandSub: { marginTop: 1, fontSize: 7.5, fontWeight: Typography.weights.extraBold, letterSpacing: 1, color: Colors.textMuted },
  accountPill: { maxWidth: 125, minHeight: 38, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, borderRadius: BorderRadius.full, backgroundColor: "rgba(255,255,255,0.88)", borderWidth: 1, borderColor: Colors.border },
  accountText: { flexShrink: 1, fontSize: 10, fontWeight: Typography.weights.bold, color: Colors.textSecondary },
  content: { flex: 1, justifyContent: "center", zIndex: 1 },
  hero: { borderRadius: 30, overflow: "hidden", padding: 24, ...Shadows.cardElevated },
  heroGlow: { position: "absolute", width: 220, height: 220, borderRadius: 110, right: -70, top: -90, backgroundColor: "rgba(153,246,228,0.16)" },
  heroBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" },
  heroBadgeText: { fontSize: 9, fontWeight: Typography.weights.extraBold, letterSpacing: 1, color: "#CCFBF1" },
  title: { maxWidth: 310, marginTop: 25, color: "#FFFFFF", fontSize: 31, lineHeight: 37, fontWeight: Typography.weights.extraBold, letterSpacing: -0.9 },
  subtitle: { marginTop: 11, maxWidth: 340, color: "#D5FAF5", fontSize: 13, lineHeight: 20 },
  primaryButton: { marginTop: 24, minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 18, backgroundColor: "#FFFFFF" },
  primaryButtonText: { color: Colors.primaryDark, fontSize: 14, fontWeight: Typography.weights.extraBold },
  capabilityPanel: { marginTop: 15, padding: 8, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.82)", borderWidth: 1, borderColor: "rgba(255,255,255,0.95)", ...Shadows.card },
  capabilityRow: { minHeight: 65, flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  capabilityIcon: { width: 39, height: 39, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: Colors.primaryFaint },
  capabilityCopy: { flex: 1 },
  capabilityTitle: { fontSize: 12.5, fontWeight: Typography.weights.extraBold, color: Colors.textPrimary },
  capabilityDetail: { marginTop: 3, fontSize: 10.5, color: Colors.textMuted },
  privacyNote: { marginTop: 13, paddingHorizontal: 12, textAlign: "center", fontSize: 10.5, lineHeight: 16, color: Colors.textMuted },
  signOutButton: { minHeight: 43, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, zIndex: 1 },
  signOutText: { fontSize: 11.5, fontWeight: Typography.weights.bold, color: Colors.textMuted },
});
