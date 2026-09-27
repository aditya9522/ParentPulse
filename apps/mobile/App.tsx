import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Animated,
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
import { DocumentsScreen } from "./src/screens/DocumentsScreen";
import { TimelineScreen } from "./src/screens/TimelineScreen";
import { MedicinesScreen } from "./src/screens/MedicinesScreen";
import { MapsScreen } from "./src/screens/MapsScreen";
import { FamilyCareScreen } from "./src/screens/FamilyCareScreen";
import { ParentProfileScreen } from "./src/screens/ParentProfileScreen";
import { ExpensesScreen } from "./src/screens/ExpensesScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { EmergencySosModal } from "./src/components/EmergencySosModal";
import { DoctorBriefModal } from "./src/components/DoctorBriefModal";
import { AiAssistantModal } from "./src/components/AiAssistantModal";
import { LogVitalModal } from "./src/components/LogVitalModal";
import { ScannerModal } from "./src/components/ScannerModal";
import { AuthModal } from "./src/components/AuthModal";
import { HealthReportModal } from "./src/components/HealthReportModal";
import { Colors, Typography, Spacing, Shadows, BorderRadius, Glass } from "./src/theme";

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
    activeScreen,
    setActiveScreen,
  } = useApp();

  useEffect(() => {
    Animated.spring(dockEntrance, {
      toValue: 1,
      friction: 8,
      tension: 65,
      useNativeDriver: true,
    }).start();
  }, [dockEntrance]);

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Luminous Ambient Background for Glassmorphism */}
      <AmbientBackground />

      {/* Top Universal App Header (Hidden during Onboarding) */}
      {activeScreen !== "onboarding" && <Header />}

      {/* Primary Screen View */}
      <View style={styles.screenContainer}>
        {activeScreen === "onboarding" && (
          <OnboardingScreen onComplete={() => setActiveScreen("tabs")} />
        )}
        {activeScreen === "tabs" && (
          <>
            {activeTab === "home" && <HomeScreen onNavigateTab={(tab) => setActiveTab(tab as TabId)} />}
            {activeTab === "documents" && <DocumentsScreen />}
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
      {activeScreen !== "onboarding" && (
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
      <EmergencySosModal />
      <DoctorBriefModal />
      <AiAssistantModal />
      <LogVitalModal />
      <AuthModal />
      <HealthReportModal />
      <ScannerModal
        visible={scannerModalVisible}
        mode={scannerMode}
        onClose={() => setScannerModalVisible(false)}
        onScanDocument={(uri) => {
          // Document captured via real camera scanner
          const newDoc = {
            id: `doc_${Date.now()}`,
            parent_id: activeParent.id,
            title: "Camera Scanned Prescription",
            document_type: "prescription" as const,
            file_url: uri,
            document_date: new Date().toISOString().split("T")[0],
            status: "extracted" as const,
            doctor_name: activeParent.primary_doctors[0]?.name || "Dr. Arun Verma",
            hospital_name: activeParent.primary_doctors[0]?.hospital_or_clinic || "Fortis Memorial",
            summary: "Prescription captured with mobile camera scanner. Clinical OCR extracted medicines and dosage instructions.",
            extracted_tags: ["Prescription", "Camera Scan", "Gemini OCR"],
            extracted_fields: { captured: "Camera Scan", processed: "Immediate" },
          };
          addDocument(newDoc);
        }}
        onScanQrCode={(code) => {
          console.log("QR Code scanned:", code);
        }}
      />
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <GlassBlurProvider>
        <AppProvider>
          <MainApp />
        </AppProvider>
      </GlassBlurProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  screenContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
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


