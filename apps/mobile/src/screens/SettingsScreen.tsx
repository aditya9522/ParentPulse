// apps/mobile/src/screens/SettingsScreen.tsx
import React, { useState } from "react";
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
} from "react-native";
import {
  Settings,
  User,
  Globe,
  Eye,
  Mic,
  MapPin,
  Shield,
  Download,
  LogOut,
  Trash2,
  ChevronRight,
  Check,
  Smartphone,
  ExternalLink,
  ShieldAlert,
  Heart,
  Key,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useApp } from "../context/AppContext";
import { SupportedLanguage } from "../context/AppContext";
import { UserRole } from "../types";
import { Colors, Typography, Spacing, Shadows, BorderRadius, Gradients } from "../theme";
import { ConfirmationModal } from "../components/ConfirmationModal";

const INDIAN_LANGUAGES: Array<{ code: SupportedLanguage; label: string; native: string }> = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", label: "Malayalam", native: "മലയാളം" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
];

const ROLES: Array<{ role: UserRole; label: string; desc: string }> = [
  {
    role: "family_member",
    label: "Adult Child (Remote)",
    desc: "Full family care, appointments, medicines, tasks & doctor briefs",
  },
  {
    role: "parent",
    label: "Parent / Patient",
    desc: "Senior-friendly layout, medications checklist & emergency card",
  },
  {
    role: "caregiver",
    label: "Family Caregiver",
    desc: "Day-to-day medicines logging, appointment transit & care tasks",
  },
  {
    role: "doctor",
    label: "Consulting Doctor",
    desc: "Authorized medical records, timeline review & prescription issuance",
  },
  {
    role: "admin",
    label: "Administrator",
    desc: "Account security, access audits & family setup",
  },
];

export const SettingsScreen: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const {
    currentUser,
    setCurrentUserRole,
    seniorMode,
    toggleSeniorMode,
    language,
    setLanguage,
    activeParent,
    setAuthModalVisible,
    setActiveScreen,
  } = useApp();

  const isHindi = language === "hi";

  const [locationTrackingOptIn, setLocationTrackingOptIn] = useState(true);
  const [voiceAssistanceEnabled, setVoiceAssistanceEnabled] = useState(true);
  const [sosGpsBroadcast, setSosGpsBroadcast] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(style);
      }
    } catch {}
  };

  const handleExportData = (type: "pdf" | "json") => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    if (type === "pdf") {
      Alert.alert(
        isHindi ? "📄 स्वास्थ्य सारांश तैयार" : "📄 PDF Health Summary Generated",
        isHindi
          ? `${activeParent.full_name} की 30-दिवसीय मेडिकल रिपोर्ट, दवाइयां व लैब परिणाम पीडीएफ रूप में तैयार हैं।`
          : `Clinical summary PDF for ${activeParent.full_name} with vitals, medicines, and latest tests is ready to download or print.`
      );
    } else {
      Alert.alert(
        isHindi ? "📦 डेटा बैकअप तैयार" : "📦 JSON Data Archive Ready",
        isHindi
          ? "सभी मेडिकल रिकॉर्ड्स, टाइमलाइन और अपॉइंटमेंट डेटा सुरक्षित रूप से एक्सपोर्ट किया गया।"
          : "Complete structured JSON archive generated containing records, timeline events, and prescriptions."
      );
    }
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
                setAuthModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Key size={14} color={Colors.primaryDark} />
              <Text style={styles.switchAccountBtnText}>{isHindi ? "लॉगिन" : "Sign In"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Role Switcher (Simulate Role-Based Permissions) */}
        <View style={[styles.sectionCard, Shadows.card]}>
          <Text style={styles.sectionHeaderTitle}>
            {isHindi ? "सक्रिय उपयोगकर्ता भूमिका (अनुमतियाँ)" : "Active User Role (Permissions)"}
          </Text>
          <Text style={styles.sectionHeaderSub}>
            {isHindi
              ? "विभिन्न पारिवारिक जिम्मेदारियों के अनुसार अनुमतियाँ बदलें"
              : "Switch perspective to preview role-based access for each family member"}
          </Text>

          <View style={styles.rolesList}>
            {ROLES.map((r) => {
              const isSelected = currentUser.role === r.role;
              return (
                <TouchableOpacity
                  key={r.role}
                  style={[styles.roleItem, isSelected && styles.roleItemActive]}
                  onPress={() => {
                    triggerHaptic();
                    setCurrentUserRole(r.role);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.roleItemLeft}>
                    <View style={[styles.roleDot, isSelected && styles.roleDotActive]} />
                    <View>
                      <Text style={[styles.roleItemLabel, isSelected && styles.roleItemLabelActive]}>
                        {r.label}
                      </Text>
                      <Text style={styles.roleItemDesc}>{r.desc}</Text>
                    </View>
                  </View>

                  {isSelected && <Check size={16} color={Colors.primary} />}
                </TouchableOpacity>
              );
            })}
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
                {isHindi ? "10 भारतीय क्षेत्रीय भाषाएं समर्थित" : "10 Indian languages supported across all screens"}
              </Text>
            </View>
          </View>

          <View style={styles.languagesGrid}>
            {INDIAN_LANGUAGES.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langChip, isSelected && styles.langChipActive]}
                  onPress={() => {
                    triggerHaptic();
                    setLanguage(lang.code);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.langNative, isSelected && styles.langNativeActive]}>
                    {lang.native}
                  </Text>
                  <Text style={[styles.langLabel, isSelected && styles.langLabelActive]}>
                    {lang.label}
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
              : "Generate portable medical summaries or download complete health archive"}
          </Text>

          <View style={styles.exportButtonsRow}>
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={() => handleExportData("pdf")}
              activeOpacity={0.8}
            >
              <Download size={15} color={Colors.primaryDark} />
              <Text style={styles.exportBtnText}>{isHindi ? "PDF रिपोर्ट एक्सपोर्ट" : "Export PDF Summary"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportBtn}
              onPress={() => handleExportData("json")}
              activeOpacity={0.8}
            >
              <Download size={15} color={Colors.secondaryDark} />
              <Text style={styles.exportBtnText}>{isHindi ? "JSON डेटा बैकअप" : "Download JSON Data"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone: Account Deletion */}
        <View style={[styles.sectionCard, { borderColor: "#FCA5A5" }]}>
          <Text style={[styles.sectionHeaderTitle, { color: Colors.emergencyDark }]}>
            {isHindi ? "खाता व डेटा प्रबंधन" : "Account & Data Controls"}
          </Text>
          <Text style={styles.sectionHeaderSub}>
            {isHindi
              ? "स्थायी रूप से खाता और सभी स्वास्थ्य डेटा हटाना"
              : "Permanently delete account, parent profiles, and encrypted health vaults"}
          </Text>

          <TouchableOpacity
            style={styles.deleteAccountBtn}
            onPress={() => setDeleteModalVisible(true)}
            activeOpacity={0.8}
          >
            <Trash2 size={16} color={Colors.emergencyDark} />
            <Text style={styles.deleteAccountBtnText}>
              {isHindi ? "खाता और डेटा हटाएं" : "Delete Account & All Data"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Delete Account Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModalVisible}
        title={isHindi ? "खाता स्थायी रूप से हटाएं?" : "Delete Account & Medical Data?"}
        message={
          isHindi
            ? "यह क्रिया अपरिवर्तनीय है। सभी मेडिकल रिकॉर्ड्स, नुस्खे, टाइमलाइन और पारिवारिक अनुमतियाँ स्थायी रूप से नष्ट हो जाएंगी।"
            : "This action is permanent and cannot be undone. All clinical vaults, documents, appointments, and care permissions will be deleted."
        }
        confirmText={isHindi ? "हाँ, स्थायी रूप से हटाएं" : "Yes, Delete Everything"}
        cancelText={isHindi ? "रद्द करें" : "Cancel"}
        isDestructive={true}
        onConfirm={() => {
          setDeleteModalVisible(false);
          Alert.alert(
            isHindi ? "खाता हटाया गया" : "Account Deleted",
            isHindi ? "आपका खाता और स्वास्थ्य डेटा सुरक्षित रूप से मिटा दिया गया है।" : "Your account and medical records have been permanently expunged."
          );
        }}
        onCancel={() => setDeleteModalVisible(false)}
      />
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
