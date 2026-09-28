// apps/mobile/src/screens/SettingsScreen.tsx
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Linking,
  Share,
} from "react-native";
import {
  Globe,
  Eye,
  Mic,
  MapPin,
  Download,
  LogOut,
  ChevronRight,
  Heart,
  Bell,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useApp , SupportedLanguage } from "../context/AppContext";
import { Colors, Typography, Spacing, Shadows, BorderRadius, Gradients } from "../theme";
import * as Notifications from "expo-notifications";
import { registerRemotePushDevice, syncCareReminders } from "../services/reminders";
import { apiClient } from "../api/client";

const INDIAN_LANGUAGES: { code: SupportedLanguage; label: string; native: string; available: boolean }[] = [
  { code: "en", label: "English", native: "English", available: true },
  { code: "hi", label: "Hindi", native: "हिन्दी", available: true },
  { code: "mr", label: "Marathi", native: "मराठी", available: false },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી", available: false },
  { code: "ta", label: "Tamil", native: "தமிழ்", available: false },
  { code: "te", label: "Telugu", native: "తెలుగు", available: false },
  { code: "bn", label: "Bengali", native: "বাংলা", available: false },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ", available: false },
  { code: "ml", label: "Malayalam", native: "മലയാളം", available: false },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ", available: false },
];


export const SettingsScreen: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const {
    currentUser,
    seniorMode,
    toggleSeniorMode,
    language,
    setLanguage,
    activeParent,
    setActiveScreen,
    medicines,
    appointments,
    documents,
    measurements,
    tasks,
    expenses,
    insurance,
    visits,
    setReportModalVisible,
  } = useApp();

  const isHindi = language === "hi";

  const [locationTrackingOptIn, setLocationTrackingOptIn] = useState(true);
  const [voiceAssistanceEnabled, setVoiceAssistanceEnabled] = useState(true);
  const [sosGpsBroadcast, setSosGpsBroadcast] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(false);

  useEffect(() => {
    void Notifications.getPermissionsAsync().then((permission) => setRemindersEnabled(permission.status === "granted"));
  }, []);

  const enableReminders = async () => {
    triggerHaptic();
    await syncCareReminders(medicines, appointments, true);
    await registerRemotePushDevice().catch(() => false);
    const permission = await Notifications.getPermissionsAsync();
    setRemindersEnabled(permission.status === "granted");
    if (permission.status !== "granted") {
      Alert.alert("Notifications are off", "Enable notifications in system settings to receive medicine and appointment reminders.");
    }
  };

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(style);
      }
    } catch {}
  };

  const handleExportData = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const archive = { exported_at: new Date().toISOString(), parent: activeParent, medicines, appointments, documents, measurements, tasks, expenses, insurance, visits };
    await Share.share({ title: `ParentPulse data · ${activeParent.full_name}`, message: JSON.stringify(archive, null, 2) });
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7} accessibilityLabel="Go back">
              <Ionicons name="arrow-back" size={20} color={Colors.primaryDark} />
            </TouchableOpacity>
          )}

          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, seniorMode && styles.seniorHeaderTitle]}>
              {isHindi ? "सेटिंग्स व खाता" : "Settings & Preferences"}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isHindi ? "भाषा, वरिष्ठ मोड, गोपनीयता एवं भूमिका प्रबंधन" : "Accessibility, Regional Languages, Privacy & Roles"}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Account Card */}
        <View style={[styles.sectionCard, Shadows.card]}>
          <View style={styles.userProfileRow}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {currentUser.full_name.slice(0, 2).toUpperCase()}
              </Text>
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>{currentUser.full_name}</Text>
              <Text style={styles.userEmail}>{currentUser.email}</Text>
              <View style={styles.currentRoleBadge}>
                <Text style={styles.currentRoleText}>
                  {currentUser.role.replace("_", " ").toUpperCase()}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.switchAccountBtn}
              onPress={() => {
                triggerHaptic();
                void apiClient.signOut();
              }}
              activeOpacity={0.8}
            >
              <LogOut size={14} color={Colors.primaryDark} />
              <Text style={styles.switchAccountBtnText}>{isHindi ? "लॉग आउट" : "Sign out"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Regional Language Support (10 Indian Languages) */}
        <View style={[styles.sectionCard, Shadows.card]}>
          <View style={styles.cardHeaderWithIcon}>
            <Globe size={18} color={Colors.secondary} />
            <View>
              <Text style={styles.sectionHeaderTitle}>
                {isHindi ? "क्षेत्रीय भाषा चुनें" : "Regional Language"}
              </Text>
              <Text style={styles.sectionHeaderSub}>
                {isHindi ? "अंग्रेज़ी और हिन्दी उपलब्ध • अन्य भाषाएं जल्द आ रही हैं" : "English and Hindi available • more languages in translation"}
              </Text>
            </View>
          </View>

          <View style={styles.languagesGrid}>
            {INDIAN_LANGUAGES.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.langChip,
                    !lang.available && styles.langChipUnavailable,
                    isSelected && styles.langChipActive,
                  ]}
                  onPress={() => {
                    triggerHaptic();
                    if (lang.available) {
                      setLanguage(lang.code);
                    } else {
                      Alert.alert(
                        "Translation in progress",
                        `${lang.label} is planned for the regional-language release. English and Hindi are fully selectable today.`,
                      );
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.langNative, isSelected && styles.langNativeActive]}>
                    {lang.native}
                  </Text>
                  <Text style={[styles.langLabel, isSelected && styles.langLabelActive]}>
                    {lang.label}{!lang.available ? " · Soon" : ""}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Senior-Friendly Accessibility Mode */}
        <View style={[styles.sectionCard, Shadows.card]}>
          <View style={styles.switchRow}>
            <View style={styles.switchTextInfo}>
              <View style={styles.cardHeaderWithIcon}>
                <Eye size={18} color={Colors.primaryDark} />
                <Text style={styles.sectionHeaderTitle}>
                  {isHindi ? "वरिष्ठ नागरिक सुलभता मोड" : "Senior Accessibility Mode"}
                </Text>
              </View>
              <Text style={styles.sectionHeaderSub}>
                {isHindi
                  ? "बड़े फॉन्ट, उच्च कंट्रास्ट, बड़े बटन और सरल नेविगेशन"
                  : "Enlarged fonts, high contrast, oversized touch targets & clear cues"}
              </Text>
            </View>

            <Switch
              value={seniorMode}
              onValueChange={() => {
                triggerHaptic();
                toggleSeniorMode();
              }}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={seniorMode ? "#FFFFFF" : "#F1F5F9"}
            />
          </View>
        </View>

        {/* Onboarding & Family Care Circle Setup */}
        <View style={[styles.sectionCard, Shadows.card]}>
          <View style={styles.switchRow}>
            <View style={styles.switchTextInfo}>
              <View style={styles.cardHeaderWithIcon}>
                <Bell size={18} color={Colors.primaryDark} />
                <Text style={styles.sectionHeaderTitle}>Care reminders</Text>
              </View>
              <Text style={styles.sectionHeaderSub}>
                Native medicine alerts and appointment reminders, scheduled privately on this device.
              </Text>
            </View>
            <Switch
              value={remindersEnabled}
              onValueChange={() => {
                if (remindersEnabled) {
                  Alert.alert("System setting required", "Notification permission can be disabled from your device settings.", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Open settings", onPress: () => void Linking.openSettings() },
                  ]);
                } else {
                  void enableReminders();
                }
              }}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={[styles.sectionCard, Shadows.card]}>
          <View style={styles.cardHeaderWithIcon}>
            <Heart size={18} color={Colors.primaryDark} />
            <Text style={styles.sectionHeaderTitle}>
              {isHindi ? "नया केयर सर्कल और ऑनबोर्डिंग" : "Onboarding & Care Circles"}
            </Text>
          </View>
          <Text style={styles.sectionHeaderSub}>
            {isHindi
              ? "नए परिवार के सदस्य या माता-पिता का हेल्थ प्रोफाइल ऑनबोर्डिंग शुरू करें"
              : "Launch interactive onboarding to add a new family circle or parent profile"}
          </Text>

          <TouchableOpacity
            style={styles.onboardingLaunchBtn}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
              setActiveScreen("onboarding");
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={Gradients.primary}
              style={styles.onboardingLaunchGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.onboardingLaunchText}>
                {isHindi ? "ऑनबोर्डिंग सेटअप शुरू करें" : "Launch Care Circle Onboarding"}
              </Text>
              <ChevronRight size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Voice Assistant & Search */}
        {false && (
        <View style={[styles.sectionCard, Shadows.card]}>
          <View style={styles.switchRow}>
            <View style={styles.switchTextInfo}>
              <View style={styles.cardHeaderWithIcon}>
                <Mic size={18} color="#7C3AED" />
                <Text style={styles.sectionHeaderTitle}>
                  {isHindi ? "वॉइस इनपुट व सहायक" : "Voice Input & Commands"}
                </Text>
              </View>
              <Text style={styles.sectionHeaderSub}>
                {isHindi
                  ? "बोलकर अपॉइंटमेंट, दवाइयां व रिपोर्ट खोजने की सुविधा"
                  : "Senior-friendly voice speech queries in selected language"}
              </Text>
            </View>

            <Switch
              value={voiceAssistanceEnabled}
              onValueChange={() => {
                triggerHaptic();
                setVoiceAssistanceEnabled(!voiceAssistanceEnabled);
              }}
              trackColor={{ false: Colors.border, true: "#7C3AED" }}
              thumbColor={voiceAssistanceEnabled ? "#FFFFFF" : "#F1F5F9"}
            />
          </View>
        </View>
        )}

        {/* Location Privacy & Healthcare Visit History */}
        <View style={[styles.sectionCard, Shadows.card]}>
          <View style={styles.switchRow}>
            <View style={styles.switchTextInfo}>
              <View style={styles.cardHeaderWithIcon}>
                <MapPin size={18} color={Colors.emergencyDark} />
                <Text style={styles.sectionHeaderTitle}>
                  {isHindi ? "स्वास्थ्य स्थान ट्रैकिंग (सहमति-आधारित)" : "Opt-In Location Tracking"}
                </Text>
              </View>
              <Text style={styles.sectionHeaderSub}>
                {isHindi
                  ? "पैरेंट की सहमति से केवल अस्पताल व दवा दुकान विज़िट रिकॉर्ड करना"
                  : "Consent-based healthcare visit history for family peace of mind"}
              </Text>
            </View>

            <Switch
              value={locationTrackingOptIn}
              onValueChange={() => {
                triggerHaptic();
                setLocationTrackingOptIn(!locationTrackingOptIn);
              }}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={locationTrackingOptIn ? "#FFFFFF" : "#F1F5F9"}
            />
          </View>

          <View style={styles.switchDivider} />

          <View style={styles.switchRow}>
            <View style={styles.switchTextInfo}>
              <Text style={styles.subSwitchTitle}>
                {isHindi ? "SOS अलर्ट के दौरान लाइव GPS शेयरिंग" : "SOS Real-Time GPS Broadcast"}
              </Text>
              <Text style={styles.sectionHeaderSub}>
                {isHindi
                  ? "आपातकाल के समय परिवार व डॉक्टरों को लाइव लोकेशन भेजना"
                  : "Share live coordinates during emergency SOS broadcast"}
              </Text>
            </View>

            <Switch
              value={sosGpsBroadcast}
              onValueChange={() => {
                triggerHaptic();
                setSosGpsBroadcast(!sosGpsBroadcast);
              }}
              trackColor={{ false: Colors.border, true: Colors.emergency }}
              thumbColor={sosGpsBroadcast ? "#FFFFFF" : "#F1F5F9"}
            />
          </View>
        </View>

        {/* Health Data Export & Archive */}
        <View style={[styles.sectionCard, Shadows.card]}>
          <Text style={styles.sectionHeaderTitle}>
            {isHindi ? "डेटा बैकअप एवं एक्सपोर्ट" : "Health Data Export & Backup"}
          </Text>
          <Text style={styles.sectionHeaderSub}>
            {isHindi
              ? "डॉक्टर परामर्श या यात्रा के लिए संपूर्ण रिकॉर्ड डाउनलोड करें"
              : "Review a factual care summary or share the currently loaded records as JSON"}
          </Text>

          <View style={styles.exportButtonsRow}>
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={() => setReportModalVisible(true)}
              activeOpacity={0.8}
            >
              <Download size={15} color={Colors.primaryDark} />
              <Text style={styles.exportBtnText}>{isHindi ? "केयर सारांश" : "Open care summary"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportBtn}
              onPress={() => void handleExportData()}
              activeOpacity={0.8}
            >
              <Download size={15} color={Colors.secondaryDark} />
              <Text style={styles.exportBtnText}>{isHindi ? "JSON डेटा शेयर" : "Share JSON data"}</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 12,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(13, 148, 136, 0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.18)",
  },
  backButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  seniorHeaderTitle: {
    fontSize: Typography.seniorSizes.lg,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textMuted,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userProfileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDeep,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  userEmail: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textMuted,
  },
  currentRoleBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.primaryFaint,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginTop: 3,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  currentRoleText: {
    fontSize: 9,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  switchAccountBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  switchAccountBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  sectionHeaderTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  sectionHeaderSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: 8,
  },
  cardHeaderWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rolesList: {
    marginTop: 4,
    gap: 6,
  },
  roleItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleItemActive: {
    backgroundColor: Colors.primaryFaint,
    borderColor: Colors.primary,
  },
  roleItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  roleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textMuted,
  },
  roleDotActive: {
    backgroundColor: Colors.primary,
  },
  roleItemLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  roleItemLabelActive: {
    color: Colors.primaryDark,
  },
  roleItemDesc: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  languagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  langChip: {
    width: "48%",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  langChipActive: {
    backgroundColor: Colors.secondaryLight,
    borderColor: Colors.secondary,
  },
  langChipUnavailable: {
    opacity: 0.58,
    backgroundColor: "rgba(241, 245, 249, 0.6)",
  },
  langNative: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  langNativeActive: {
    color: Colors.secondaryDark,
  },
  langLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  langLabelActive: {
    color: Colors.secondaryDark,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchTextInfo: {
    flex: 1,
    marginRight: 10,
  },
  switchDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  subSwitchTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  exportButtonsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  exportBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exportBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  deleteAccountBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FEE2E2",
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    marginTop: 8,
  },
  deleteAccountBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.emergencyDark,
  },
  onboardingLaunchBtn: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  onboardingLaunchGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
  },
  onboardingLaunchText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: "#FFFFFF",
  },
});
