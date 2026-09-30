import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppProvider, useApp } from "./src/context/AppContext";
import { Header } from "./src/components/Header";
import { AmbientBackground } from "./src/components/AmbientBackground";
import { GlassView } from "./src/components/GlassView";
import { GlassBlurProvider } from "./src/components/GlassBlurProvider";
import { HomeScreen } from "./src/screens/HomeScreen";
import { DocumentVaultScreen } from "./src/screens/DocumentVaultScreen";
import { TimelineScreen } from "./src/screens/TimelineScreen";
import { MedicinesScreen } from "./src/screens/MedicinesScreen";
import { MapsScreen } from "./src/screens/MapsScreen";
import { FamilyCareScreen } from "./src/screens/FamilyCareScreen";
import { ParentProfileScreen } from "./src/screens/ParentProfileScreen";
import { ExpensesScreen } from "./src/screens/ExpensesScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { EmergencyCenterModal } from "./src/components/EmergencyCenterModal";
import { SecureDoctorShareModal } from "./src/components/SecureDoctorShareModal";
import { AiAssistantModal } from "./src/components/AiAssistantModal";
import { LogVitalModal } from "./src/components/LogVitalModal";
import { ScannerModal } from "./src/components/ScannerModal";
import { AuthModal } from "./src/components/AuthModal";
import { HealthReportModal } from "./src/components/HealthReportModal";
import { PremiumFeedbackHost } from "./src/components/PremiumFeedbackHost";
import { SyncCenterModal } from "./src/components/SyncCenterModal";
import { BrandLaunchScreen } from "./src/components/BrandLaunchScreen";
import { AppErrorBoundary } from "./src/components/AppErrorBoundary";
import { EmptyCareHubScreen } from "./src/screens/EmptyCareHubScreen";
import * as SplashScreen from "expo-splash-screen";
import { isExpoGo } from "./src/services/runtimeEnvironment";
import { apiClient } from "./src/api/client";
import { AppAlert as Alert } from "./src/services/appAlert";
import { Colors, Typography, Spacing, Shadows, BorderRadius, Glass } from "./src/theme";

void SplashScreen.preventAutoHideAsync().catch(() => undefined);
if (!isExpoGo) SplashScreen.setOptions({ duration: 300, fade: true });

type TabId = "home" | "documents" | "timeline" | "medicines" | "maps";

interface TabItem {
  id: TabId;
  label: string;
  hindiLabel: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
}

const TABS: TabItem[] = [
  { id: "home", label: "Care Hub", hindiLabel: "केयर हब", activeIcon: "home", inactiveIcon: "home-outline" },
  { id: "documents", label: "Records", hindiLabel: "रिकॉर्ड्स", activeIcon: "folder-open", inactiveIcon: "folder-outline" },
  { id: "timeline", label: "Timeline", hindiLabel: "इतिहास", activeIcon: "time", inactiveIcon: "time-outline" },
  { id: "medicines", label: "Pills", hindiLabel: "दवाइयां", activeIcon: "medkit", inactiveIcon: "medkit-outline" },
  { id: "maps", label: "Nearby", hindiLabel: "नज़दीकी", activeIcon: "navigate", inactiveIcon: "navigate-outline" },
];

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const insets = useSafeAreaInsets();
  const dockEntrance = useRef(new Animated.Value(0)).current;
  const {
    seniorMode,
    language,
    scannerModalVisible,
    setScannerModalVisible,
    scannerMode,
    addDocument,
    activeParent,
    parentList,
    activeScreen,
    setActiveScreen,
    runtimeReady,
    isAuthenticated,
    dataLoading,
    dataError,
    dataWarning,
    refreshData,
    setAuthModalVisible,
    hasCompletedOnboarding,
    setHasCompletedOnboarding,
  } = useApp();

  useEffect(() => {
    if (dataWarning) {
      Alert.alert("Some services are reconnecting", dataWarning);
    }
  }, [dataWarning]);

  useEffect(() => {
    Animated.spring(dockEntrance, {
      toValue: 1,
      friction: 8,
      tension: 65,
      useNativeDriver: true,
    }).start();
  }, [dockEntrance]);

  if (!runtimeReady || (dataLoading && parentList.length === 0 && !dataError)) {
    return <View style={[styles.stateScreen, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }]}><StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" /><AmbientBackground /><View style={styles.stateCard}><ActivityIndicator size="large" color={Colors.primaryDark} /><Text style={styles.stateTitle}>Loading secure care data</Text><Text style={styles.stateCopy}>Connecting to ParentPulse and verifying your care circle.</Text></View></View>;
  }

  if (!isAuthenticated) {
    return <View style={styles.stateScreen}><AmbientBackground /><View style={styles.stateCard}><View style={styles.stateIcon}><Ionicons name="shield-checkmark" size={31} color="#FFFFFF" /></View><Text style={styles.stateEyebrow}>PRIVATE FAMILY HEALTH</Text><Text style={styles.stateTitle}>Your real care data, securely connected</Text><Text style={styles.stateCopy}>Sign in to load your family profiles, medicines, records, appointments, tasks, and alerts from the production service.</Text><TouchableOpacity style={styles.stateAction} onPress={() => setAuthModalVisible(true)}><Text style={styles.stateActionText}>Sign in or create account</Text><Ionicons name="arrow-forward" size={18} color="#FFFFFF" /></TouchableOpacity></View><AuthModal /></View>;
  }

  if (dataError && parentList.length === 0) {
    return <View style={styles.stateScreen}><AmbientBackground /><View style={styles.stateCard}><Ionicons name="cloud-offline-outline" size={34} color="#B45309" /><Text style={styles.stateTitle}>We couldn’t connect your care data</Text><Text style={styles.stateCopy}>{dataError}</Text><TouchableOpacity disabled={dataLoading} style={[styles.stateAction, dataLoading && styles.stateActionDisabled]} onPress={() => void refreshData()}>{dataLoading ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.stateActionText}>Reconnect securely</Text><Ionicons name="refresh" size={18} color="#FFFFFF" /></>}</TouchableOpacity><TouchableOpacity style={styles.stateSecondaryAction} onPress={() => void apiClient.signOut()}><Text style={styles.stateSecondaryActionText}>Sign in with another account</Text></TouchableOpacity></View></View>;
  }

  const showOnboarding = activeScreen === "onboarding" || (!hasCompletedOnboarding && parentList.length === 0);
  const showEmptyCareHub = !showOnboarding && parentList.length === 0;

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Luminous Ambient Background for Glassmorphism */}
      <AmbientBackground />

      {/* Top Universal App Header (Hidden during Onboarding) */}
      {!showOnboarding && !showEmptyCareHub && <Header />}

      {/* Primary Screen View */}
      <View style={styles.screenContainer}>
        {showOnboarding && (
          <OnboardingScreen onComplete={() => { setHasCompletedOnboarding(true); setActiveScreen("tabs"); }} />
        )}
        {showEmptyCareHub && <EmptyCareHubScreen />}
        {!showOnboarding && !showEmptyCareHub && activeScreen === "tabs" && (
          <>
            {activeTab === "home" && <HomeScreen onNavigateTab={(tab) => setActiveTab(tab as TabId)} />}
            {activeTab === "documents" && <DocumentVaultScreen />}
            {activeTab === "timeline" && <TimelineScreen />}
            {activeTab === "medicines" && <MedicinesScreen />}
            {activeTab === "maps" && <MapsScreen />}
          </>
        )}
        {activeScreen === "family" && <FamilyCareScreen onBack={() => setActiveScreen("tabs")} />}
        {activeScreen === "profile" && <ParentProfileScreen onBack={() => setActiveScreen("tabs")} />}
        {activeScreen === "expenses" && <ExpensesScreen onBack={() => setActiveScreen("tabs")} />}
        {activeScreen === "settings" && <SettingsScreen onBack={() => setActiveScreen("tabs")} />}
      </View>

      {/* Modern Floating Frosted Glass Bottom Navigation Dock (Visible on all screens except Onboarding) */}
      {!showOnboarding && !showEmptyCareHub && (
        <Animated.View
          style={[
            styles.floatingNavWrapper,
            {
              bottom: Math.max(insets.bottom, Platform.OS === "ios" ? 12 : 10),
              opacity: dockEntrance,
              transform: [{
                translateY: dockEntrance.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }),
              }],
            },
          ]}
          pointerEvents="box-none"
        >
          <GlassView
            variant="nav"
            intensity={85}
            style={[styles.bottomBarContainer, seniorMode && styles.seniorBottomBarContainer]}
          >
            <View style={styles.bottomBar}>
              {TABS.map((tab) => {
                const isSelected = activeScreen === "tabs" && activeTab === tab.id;
                const labelText = language === "hi" ? tab.hindiLabel : tab.label;
                const iconName = isSelected ? tab.activeIcon : tab.inactiveIcon;
                const iconSize = seniorMode ? 26 : 22;

                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[
                      styles.tabButton,
                      isSelected && styles.tabButtonActive,
                      seniorMode && styles.seniorTabButton,
                    ]}
                    onPress={() => {
                      setActiveScreen("tabs");
                      setActiveTab(tab.id);
                    }}
                    activeOpacity={0.7}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Navigate to ${labelText}`}
                  >
                    {/* Active Top Glow Pill */}
                    {isSelected && <View style={styles.activeIndicatorDot} />}

                    <Ionicons
                      name={iconName}
                      size={iconSize}
                      color={isSelected ? Colors.primaryDark : Colors.textMuted}
                    />

                    <Text
                      numberOfLines={1}
                      style={[
                        styles.tabLabel,
                        isSelected && styles.tabLabelActive,
                        seniorMode && styles.seniorTabLabel,
                      ]}
                    >
                      {labelText}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassView>
        </Animated.View>
      )}

      {/* Global Interactive Feature Modals */}
      {!showOnboarding && !showEmptyCareHub && <><EmergencyCenterModal />
      <SecureDoctorShareModal />
      <AiAssistantModal />
      <LogVitalModal />
      <AuthModal />
      <HealthReportModal />
      <SyncCenterModal />
      <ScannerModal
        visible={scannerModalVisible}
        mode={scannerMode}
        onClose={() => setScannerModalVisible(false)}
        onScanDocument={(uri) => {
          void apiClient.uploadDocument({
            parentId: activeParent.id,
            familyId: activeParent.family_id,
            title: "Camera scanned prescription",
            documentType: "prescription",
            documentDate: new Date().toISOString().slice(0, 10),
            uri,
            filename: `prescription-${Date.now()}.jpg`,
            mimeType: "image/jpeg",
            doctorName: activeParent.primary_doctors[0]?.name,
            hospitalName: activeParent.primary_doctors[0]?.hospital_or_clinic,
          }).then(addDocument).catch((error) => {
            Alert.alert("Upload failed", error instanceof Error ? error.message : "The scan could not be uploaded.");
          });
        }}
        onScanQrCode={(code) => {
          console.log("QR Code scanned:", code);
        }}
      /></>}
    </View>
  );
};

export default function App() {
  const [showLaunchScreen, setShowLaunchScreen] = useState(true);
  const [appSessionKey, setAppSessionKey] = useState(0);
  const finishLaunch = useCallback(() => setShowLaunchScreen(false), []);

  return (
    <SafeAreaProvider>
      <View style={styles.appRoot}>
        <AppErrorBoundary onRetry={() => setAppSessionKey((value) => value + 1)}>
          <GlassBlurProvider key={appSessionKey}>
            <AppProvider>
              <MainApp />
            </AppProvider>
          </GlassBlurProvider>
        </AppErrorBoundary>
        <PremiumFeedbackHost />
        {showLaunchScreen && <BrandLaunchScreen onFinished={finishLaunch} />}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  screenContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  stateScreen: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl, backgroundColor: "#F8FAFC" },
  stateCard: { width: "100%", maxWidth: 470, alignItems: "center", padding: 30, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.92)", borderWidth: 1, borderColor: "rgba(255,255,255,0.95)", ...Shadows.card },
  stateIcon: { width: 66, height: 66, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: Colors.primaryDark, marginBottom: 18 },
  stateEyebrow: { fontSize: 10, letterSpacing: 1.5, fontWeight: "900", color: Colors.primaryDark, marginBottom: 8 },
  stateTitle: { fontSize: 24, lineHeight: 30, fontWeight: "900", color: Colors.textPrimary, textAlign: "center", marginTop: 12 },
  stateCopy: { fontSize: 13, lineHeight: 20, color: Colors.textMuted, textAlign: "center", marginTop: 10 },
  stateAction: { minHeight: 52, marginTop: 22, paddingHorizontal: 20, borderRadius: 17, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, backgroundColor: Colors.primaryDark },
  stateActionText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  stateActionDisabled: { opacity: 0.7 },
  stateSecondaryAction: { minHeight: 44, marginTop: 8, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  stateSecondaryActionText: { color: Colors.primaryDark, fontSize: 13, fontWeight: "800" },
  floatingNavWrapper: {
    position: "absolute",
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 9999,
    elevation: 30,
  },
  bottomBarContainer: {
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.9)",
    minHeight: 62,
  },
  seniorBottomBarContainer: {
    paddingVertical: 10,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 16,
    position: "relative",
    minHeight: 48,
  },
  seniorTabButton: {
    paddingVertical: 8,
  },
  tabButtonActive: {
    backgroundColor: "rgba(13, 148, 136, 0.12)",
  },
  activeIndicatorDot: {
    position: "absolute",
    top: 2,
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  tabLabel: {
    fontSize: Typography.sizes.xxs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textMuted,
    marginTop: 2,
  },
  tabLabelActive: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  seniorTabLabel: {
    fontSize: Typography.seniorSizes.xs,
    fontWeight: Typography.weights.bold,
    marginTop: 3,
  },
});

