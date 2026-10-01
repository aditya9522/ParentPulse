// apps/mobile/src/screens/SettingsScreen.tsx
import React, { useCallback, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
  Linking,
  Share,
  ActivityIndicator,
  Image,
  TextInput,
} from "react-native";
import { AppAlert as Alert } from "../services/appAlert";
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
  ShieldCheck,
  Trash2,
  Camera,
  User,
  Edit2,
  X,
  Check,
  Palette,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useApp , SupportedLanguage } from "../context/AppContext";
import { Colors, Typography, Spacing, Shadows, BorderRadius, Gradients, AppThemeMode } from "../theme";
import { registerRemotePushDevice, syncCareReminders } from "../services/reminders";
import { getNotifications, notificationsAvailable } from "../services/notificationRuntime";
import { apiClient, ConsentType } from "../api/client";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { DeleteAccountSheet } from "../components/DeleteAccountSheet";
import { SwipeableBottomSheet } from "../components/SwipeableBottomSheet";

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

const THEME_OPTIONS: {
  id: AppThemeMode;
  name: string;
  hindiName: string;
  tagline: string;
  hindiTagline: string;
  previewColors: string[];
  gradient: readonly [string, string];
}[] = [
  {
    id: "light",
    name: "Serene Emerald",
    hindiName: "शांत हरा (लाइट)",
    tagline: "Clinical teal & slate with calming frosted glass",
    hindiTagline: "ताज़ा हरा और स्लेट फ्रॉस्टेड लुक",
    previewColors: ["#0D9488", "#0284C7", "#8B5CF6", "#F8FAFC"],
    gradient: ["#0D9488", "#0F766E"],
  },
  {
    id: "dark",
    name: "Midnight Obsidian",
    hindiName: "मध्यरात्रि काला (डार्क)",
    tagline: "Deep dark mode with neon accents & reduced eye strain",
    hindiTagline: "गहरा काला व नीयन चमक, आरामदायक दृश्य",
    previewColors: ["#14B8A6", "#38BDF8", "#A78BFA", "#090D16"],
    gradient: ["#14B8A6", "#0D9488"],
  },
  {
    id: "amber",
    name: "Ayurvedic Amber",
    hindiName: "आयुर्वेदिक अम्बर (वॉर्म)",
    tagline: "Warm therapeutic gold & restorative ivory tones",
    hindiTagline: "प्राकृतिक सुनहरी धूप और सुखदायक आभा",
    previewColors: ["#D97706", "#EA580C", "#7C3AED", "#FFFBEB"],
    gradient: ["#F59E0B", "#D97706"],
  },
];


export const SettingsScreen: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const {
    currentUser,
    updateUserProfile,
    updateUserAvatar,
    seniorMode,
    toggleSeniorMode,
    language,
    setLanguage,
    themeMode,
    setThemeMode,
    isDark,
    setActiveScreen,
    medicines,
    appointments,
    setReportModalVisible,
  } = useApp();

  const isHindi = language === "hi";

  const [locationTrackingOptIn, setLocationTrackingOptIn] = useState(false);
  const [voiceAssistanceEnabled, setVoiceAssistanceEnabled] = useState(false);
  const [sosGpsBroadcast, setSosGpsBroadcast] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [consentsLoading, setConsentsLoading] = useState(true);
  const [consentSaving, setConsentSaving] = useState<ConsentType | null>(null);
  const [exporting, setExporting] = useState(false);
  const [deleteSheetVisible, setDeleteSheetVisible] = useState(false);
  const closeDeleteSheet = useCallback(() => setDeleteSheetVisible(false), []);

  // Profile Edit State
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [profileName, setProfileName] = useState(currentUser.full_name || "");
  const [profilePhone, setProfilePhone] = useState(currentUser.phone_number || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const openProfileModal = () => {
    setProfileName(currentUser.full_name || "");
    setProfilePhone(currentUser.phone_number || "");
    setEditProfileModalVisible(true);
  };

  const handlePickAvatar = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission needed", "Camera permission is required to capture a profile picture.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission needed", "Photo library access is required to select a profile picture.");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        });
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setUploadingAvatar(true);
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
        await updateUserAvatar(asset.uri, asset.fileName || "avatar.jpg", asset.mimeType || "image/jpeg");
        Alert.alert(isHindi ? "सफल" : "Success", isHindi ? "प्रोफ़ाइल फ़ोटो अपडेट हो गई!" : "Profile photo updated successfully!");
      }
    } catch (err: any) {
      Alert.alert(isHindi ? "त्रुटि" : "Error", err?.message || "Failed to upload profile photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      Alert.alert(isHindi ? "नाम आवश्यक है" : "Name Required", isHindi ? "कृपया अपना पूरा नाम दर्ज करें।" : "Please enter your full name.");
      return;
    }
    setSavingProfile(true);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await updateUserProfile({
        full_name: profileName.trim(),
        phone_number: profilePhone.trim() || undefined,
      });
      setEditProfileModalVisible(false);
      Alert.alert(isHindi ? "सफल" : "Success", isHindi ? "प्रोफ़ाइल विवरण अपडेट हो गए!" : "Profile details updated successfully!");
    } catch (err: any) {
      Alert.alert(isHindi ? "त्रुटि" : "Error", err?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    void getNotifications().then(async (Notifications) => {
      if (!Notifications) return;
      const permission = await Notifications.getPermissionsAsync();
      setRemindersEnabled(permission.status === "granted");
    });
  }, []);

  useEffect(() => {
    let active = true;
    void apiClient.listConsents()
      .then((consents) => {
        if (!active) return;
        setLocationTrackingOptIn(consents.find((item) => item.consent_type === "location_history")?.granted ?? false);
        setSosGpsBroadcast(consents.find((item) => item.consent_type === "sos_location_sharing")?.granted ?? false);
        setVoiceAssistanceEnabled(consents.some((item) =>
          item.granted && (
            item.consent_type === "voice_input" ||
            (item.consent_type === "ai_assistant" && item.policy_version === "2026-09-voice-v1")
          )
        ));
      })
      .catch(() => {
        if (active) Alert.alert("Privacy settings unavailable", "Your privacy choices could not be loaded. Sensitive sharing remains off until they can be verified.");
      })
      .finally(() => active && setConsentsLoading(false));
    return () => { active = false; };
  }, []);

  const enableReminders = async () => {
    triggerHaptic();
    if (!notificationsAvailable) {
      Alert.alert(
        "Notifications require a ParentPulse build",
        "Expo Go cannot initialize Android push notifications. Install the ParentPulse development or store build to enable reminders and SOS alerts.",
      );
      return;
    }
    await syncCareReminders(medicines, appointments, true);
    await registerRemotePushDevice().catch(() => false);
    const Notifications = await getNotifications();
    if (!Notifications) return;
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
    setExporting(true);
    try {
      const archive = await apiClient.exportAccountData();
      const serialized = JSON.stringify(archive, null, 2);
      const date = new Date().toISOString().slice(0, 10);
      if (Platform.OS === "web") {
        await Share.share({ title: `ParentPulse account export · ${date}`, message: serialized });
      } else {
        const file = new File(Paths.cache, `parentpulse-account-${date}.json`);
        file.create({ overwrite: true });
        file.write(serialized);
        if (!(await Sharing.isAvailableAsync())) throw new Error("File sharing is not available on this device.");
        try {
          await Sharing.shareAsync(file.uri, {
            dialogTitle: "Share ParentPulse account archive",
            mimeType: "application/json",
            UTI: "public.json",
          });
        } finally {
          if (file.exists) file.delete();
        }
      }
    } catch (error) {
      Alert.alert("Export could not be created", error instanceof Error ? error.message : "Please try again when connected.");
    } finally {
      setExporting(false);
    }
  };

  const updateConsent = async (
    type: "location_history" | "sos_location_sharing" | "voice_input",
    granted: boolean,
  ) => {
    const settings = {
      location_history: { value: locationTrackingOptIn, setter: setLocationTrackingOptIn },
      sos_location_sharing: { value: sosGpsBroadcast, setter: setSosGpsBroadcast },
      voice_input: { value: voiceAssistanceEnabled, setter: setVoiceAssistanceEnabled },
    } as const;
    const { value: previous, setter } = settings[type];
    triggerHaptic();
    setter(granted);
    setConsentSaving(type);
    try {
      if (type === "voice_input") {
        await apiClient.updateVoiceConsent(granted);
      } else {
        await apiClient.updateConsent(type, granted);
      }
    } catch (error) {
      setter(previous);
      Alert.alert("Privacy choice not saved", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setConsentSaving(null);
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
            <TouchableOpacity
              onPress={openProfileModal}
              activeOpacity={0.8}
              style={styles.avatarWrapper}
            >
              {currentUser.avatar_url ? (
                <Image source={{ uri: currentUser.avatar_url }} style={styles.userAvatarImage} />
              ) : (
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {currentUser.full_name.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Camera size={11} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.userInfo}
              onPress={openProfileModal}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.userName}>{currentUser.full_name}</Text>
                <Edit2 size={13} color={Colors.primary} />
              </View>
              <Text style={styles.userEmail}>{currentUser.email}</Text>
              {currentUser.phone_number ? (
                <Text style={styles.userPhone}>{currentUser.phone_number}</Text>
              ) : null}
              <View style={styles.currentRoleBadge}>
                <Text style={styles.currentRoleText}>
                  {currentUser.role.replace("_", " ").toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.userActionsCol}>
              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={openProfileModal}
                activeOpacity={0.8}
              >
                <Edit2 size={12} color={Colors.primaryDark} />
                <Text style={styles.editProfileBtnText}>{isHindi ? "संपादित करें" : "Edit"}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchAccountBtn}
                onPress={() => {
                  triggerHaptic();
                  void apiClient.signOut();
                }}
                activeOpacity={0.8}
              >
                <LogOut size={12} color={Colors.textMuted} />
                <Text style={styles.switchAccountBtnText}>{isHindi ? "लॉग आउट" : "Sign out"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Theme & Visual Appearance Section */}
        <View style={[styles.sectionCard, Shadows.card]}>
          <View style={styles.cardHeaderWithIcon}>
            <Palette size={18} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionHeaderTitle}>
                {isHindi ? "ऐप थीम और दृश्य शैली" : "App Theme & Appearance"}
              </Text>
              <Text style={styles.sectionHeaderSub}>
                {isHindi
                  ? "अपनी पसंद के अनुसार थीम चुनें • पूरे ऐप पर तुरंत लागू होता है"
                  : "Switch themes to personalize your workspace • applied to the entire app"}
              </Text>
            </View>
          </View>

          <View style={styles.themeOptionsGrid}>
            {THEME_OPTIONS.map((th) => {
              const isSelected = themeMode === th.id;
              return (
                <TouchableOpacity
                  key={th.id}
                  style={[
                    styles.themeOptionCard,
                    isSelected && styles.themeOptionCardSelected,
                  ]}
                  onPress={() => {
                    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                    setThemeMode(th.id);
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={th.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.themePreviewBar}
                  >
                    <View style={styles.themeSwatchesRow}>
                      {th.previewColors.map((color, i) => (
                        <View
                          key={i}
                          style={[
                            styles.themePreviewDot,
                            { backgroundColor: color },
                          ]}
                        />
                      ))}
                    </View>
                    {isSelected && (
                      <View style={styles.themeCheckBadge}>
                        <Check size={12} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </LinearGradient>

                  <View style={styles.themeCardContent}>
                    <View style={styles.themeNameRow}>
                      <Text
                        style={[
                          styles.themeName,
                          isSelected && styles.themeNameSelected,
                        ]}
                      >
                        {isHindi ? th.hindiName : th.name}
                      </Text>
                      {isSelected && (
                        <View style={styles.activeThemePill}>
                          <Text style={styles.activeThemePillText}>
                            {isHindi ? "सक्रिय" : "ACTIVE"}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.themeTagline}>
                      {isHindi ? th.hindiTagline : th.tagline}
                    </Text>
                  </View>
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
                  : "Microphone access is used only while dictating. Audio is not saved; review the transcript before sending."}
              </Text>
            </View>

            <Switch
              value={voiceAssistanceEnabled}
              disabled={consentsLoading || consentSaving !== null}
              onValueChange={(value) => void updateConsent("voice_input", value)}
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
              disabled={consentsLoading || consentSaving !== null}
              onValueChange={(value) => void updateConsent("location_history", value)}
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
              disabled={consentsLoading || consentSaving !== null}
              onValueChange={(value) => void updateConsent("sos_location_sharing", value)}
              trackColor={{ false: Colors.border, true: Colors.emergency }}
              thumbColor={sosGpsBroadcast ? "#FFFFFF" : "#F1F5F9"}
            />
          </View>
          <View style={styles.privacyStatus}>
            {consentsLoading || consentSaving ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <ShieldCheck size={15} color={Colors.successDark} />
            )}
            <Text style={styles.privacyStatusText}>
              {consentsLoading ? "Loading verified choices…" : consentSaving ? "Saving secure preference…" : "Choices are versioned and securely recorded"}
            </Text>
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
              : "Create a complete structured archive of every care circle and record available to your account"}
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
              disabled={exporting}
              activeOpacity={0.8}
            >
              {exporting ? <ActivityIndicator size="small" color={Colors.secondaryDark} /> : <Download size={15} color={Colors.secondaryDark} />}
              <Text style={styles.exportBtnText}>{exporting ? "Preparing archive…" : isHindi ? "JSON डेटा शेयर" : "Export account data"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.sectionCard, styles.dangerCard]}>
          <View style={styles.cardHeaderWithIcon}>
            <Trash2 size={18} color={Colors.emergencyDark} />
            <Text style={styles.sectionHeaderTitle}>Account ownership</Text>
          </View>
          <Text style={styles.sectionHeaderSub}>
            Review exactly what will be removed, verify your password, and permanently revoke account access.
          </Text>
          <TouchableOpacity
            style={styles.deleteAccountBtn}
            onPress={() => setDeleteSheetVisible(true)}
            activeOpacity={0.8}
          >
            <Trash2 size={16} color={Colors.emergencyDark} />
            <Text style={styles.deleteAccountBtnText}>Review account deletion</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Edit Profile & Photo Modal */}
      <SwipeableBottomSheet
        visible={editProfileModalVisible}
        onClose={() => setEditProfileModalVisible(false)}
        maxHeight="90%"
      >
        <View style={styles.sheetInnerPadding}>
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={styles.modalHeaderIcon}>
                <User size={18} color={Colors.primaryDark} />
              </View>
              <Text style={styles.modalTitle}>
                {isHindi ? "प्रोफ़ाइल व फ़ोटो संपादित करें" : "Edit Profile & Photo"}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setEditProfileModalVisible(false)}>
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          >
            {/* Avatar Section with Action Buttons */}
            <View style={styles.modalAvatarRow}>
              <View style={styles.modalAvatarWrapper}>
                {currentUser.avatar_url ? (
                  <Image source={{ uri: currentUser.avatar_url }} style={styles.modalAvatarImage} />
                ) : (
                  <View style={styles.modalAvatarPlaceholder}>
                    <Text style={styles.modalAvatarText}>
                      {currentUser.full_name.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}
                {uploadingAvatar && (
                  <View style={styles.avatarLoadingOverlay}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                )}
              </View>

              <View style={styles.avatarActionsCol}>
                <Text style={styles.avatarSectionTitle}>
                  {isHindi ? "प्रोफ़ाइल फ़ोटो" : "Profile Picture"}
                </Text>
                <View style={styles.avatarBtnsRow}>
                  <TouchableOpacity
                    style={styles.photoChoiceBtn}
                    onPress={() => handlePickAvatar(false)}
                    disabled={uploadingAvatar}
                    activeOpacity={0.8}
                  >
                    <User size={14} color={Colors.primaryDark} />
                    <Text style={styles.photoChoiceBtnText}>{isHindi ? "गैलरी" : "Gallery"}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.photoChoiceBtn}
                    onPress={() => handlePickAvatar(true)}
                    disabled={uploadingAvatar}
                    activeOpacity={0.8}
                  >
                    <Camera size={14} color={Colors.primaryDark} />
                    <Text style={styles.photoChoiceBtnText}>{isHindi ? "कैमरा" : "Camera"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Full Name */}
            <Text style={styles.inputLabel}>{isHindi ? "पूरा नाम *" : "Full Name *"}</Text>
            <TextInput
              style={styles.textInput}
              value={profileName}
              onChangeText={setProfileName}
              placeholder="Your full name"
              placeholderTextColor="#94A3B8"
            />

            {/* Phone Number */}
            <Text style={styles.inputLabel}>{isHindi ? "फ़ोन नंबर" : "Phone Number"}</Text>
            <TextInput
              style={styles.textInput}
              value={profilePhone}
              onChangeText={setProfilePhone}
              placeholder="+91 98765 43210"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
            />

            {/* Email (Read-Only) */}
            <Text style={styles.inputLabel}>{isHindi ? "ईमेल पता (अपरिवर्तनीय)" : "Email Address (Read-only)"}</Text>
            <View style={[styles.textInput, styles.readOnlyInput]}>
              <Text style={styles.readOnlyText}>{currentUser.email}</Text>
            </View>

            {/* Role (Read-Only) */}
            <Text style={styles.inputLabel}>{isHindi ? "खाता प्रकार / भूमिका" : "Account Role"}</Text>
            <View style={[styles.textInput, styles.readOnlyInput]}>
              <Text style={styles.readOnlyText}>{currentUser.role.replace("_", " ").toUpperCase()}</Text>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveProfileBtn}
              onPress={handleSaveProfile}
              disabled={savingProfile}
              activeOpacity={0.85}
            >
              <LinearGradient colors={Gradients.primary} style={styles.btnGradient}>
                {savingProfile ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={16} color="#FFFFFF" />
                    <Text style={styles.btnGradientText}>
                      {isHindi ? "प्रोफ़ाइल सहेजें" : "Save Profile Details"}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SwipeableBottomSheet>

      <DeleteAccountSheet visible={deleteSheetVisible} onClose={closeDeleteSheet} />

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
  privacyStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  privacyStatusText: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
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
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  deleteAccountBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.emergencyDark,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FFFDFD",
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
  avatarWrapper: {
    position: "relative",
    marginRight: 12,
  },
  userAvatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: Colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  userPhone: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  userActionsCol: {
    alignItems: "flex-end",
    gap: 6,
    marginLeft: 8,
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(13, 148, 136, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.25)",
  },
  editProfileBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  sheetInnerPadding: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Platform.OS === "ios" ? 34 : Spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  modalAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: Colors.surfaceAlt,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalAvatarWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: "hidden",
    position: "relative",
  },
  modalAvatarImage: {
    width: "100%",
    height: "100%",
  },
  modalAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  modalAvatarText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDeep,
  },
  avatarLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarActionsCol: {
    flex: 1,
  },
  avatarSectionTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  avatarBtnsRow: {
    flexDirection: "row",
    gap: 8,
  },
  photoChoiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photoChoiceBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.primaryDark,
  },
  inputLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
    marginTop: 10,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  readOnlyInput: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: "#E2E8F0",
  },
  readOnlyText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
  },
  saveProfileBtn: {
    marginTop: 20,
    marginBottom: 20,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  btnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  btnGradientText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: "#FFFFFF",
  },
  themeOptionsGrid: {
    gap: 10,
    marginTop: 6,
  },
  themeOptionCard: {
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: "hidden",
    ...Shadows.subtle,
  },
  themeOptionCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    ...Shadows.card,
  },
  themePreviewBar: {
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  themeSwatchesRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  themePreviewDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  themeCheckBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  themeCardContent: {
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  themeNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  themeName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  themeNameSelected: {
    color: Colors.primary,
  },
  activeThemePill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  activeThemePillText: {
    fontSize: 9,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDeep,
    letterSpacing: 0.5,
  },
  themeTagline: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
