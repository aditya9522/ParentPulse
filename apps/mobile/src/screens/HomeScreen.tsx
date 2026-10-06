import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useApp } from "../context/AppContext";
import { Colors, Typography, Spacing, Shadows, BorderRadius, Gradients, createThemedStyles } from "../theme";
import { ParentSelector } from "../components/ParentSelector";
import { VitalBadge } from "../components/VitalBadge";
import { MedicineCard } from "../components/MedicineCard";
import { AddAppointmentModal } from "../components/AddAppointmentModal";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { evaluateVitalCriticality } from "../services/soundService";
import { Appointment } from "../types";

export const HomeScreen: React.FC<{ onNavigateTab: (tab: string) => void }> = ({ onNavigateTab }) => {
  const {
    activeParent,
    measurements,
    medicines,
    appointments,
    deleteAppointment,
    documents,
    visits,
    tasks,
    toggleTaskCompleted,
    dosesTakenToday,
    setLogVitalModalVisible,
    setSosModalVisible,
    setDoctorShareModalVisible,
    setAiAssistantModalVisible,
    setScannerModalVisible,
    setScannerMode,
    seniorMode,
    language,
    setActiveScreen,
  } = useApp();

  const isHindi = language === "hi";

  const [addApptModalVisible, setAddApptModalVisible] = useState(false);
  const [apptToDelete, setApptToDelete] = useState<Appointment | null>(null);
  const [expandedWellness, setExpandedWellness] = useState<boolean>(false);
  const [selectedVitalTab, setSelectedVitalTab] = useState<"bp" | "sugar" | "pulse">("bp");
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(6);

  const nextAppointment = appointments[0];
  const parentTasks = tasks.filter((t) => t.parent_id === activeParent.id);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(style);
    }
  };

  const vitalAlerts = useMemo(() => {
    const alerts: {
      id: string;
      vitalType: string;
      valStr: string;
      title: string;
      detail: string;
      isCritical: boolean;
      recordedAt: string;
    }[] = [];

    measurements.slice(0, 5).forEach((m) => {
      const evaluation = evaluateVitalCriticality(
        m.vital_type,
        m.value_numeric,
        m.value_secondary
      );
      if (evaluation.isCritical || evaluation.isWarning) {
        alerts.push({
          id: m.id,
          vitalType: m.vital_type,
          valStr: m.value_secondary
            ? `${m.value_numeric}/${m.value_secondary} ${m.unit}`
            : `${m.value_numeric} ${m.unit}`,
          title: evaluation.title,
          detail: evaluation.detail,
          isCritical: evaluation.isCritical,
          recordedAt: m.recorded_at,
        });
      }
    });

    return alerts;
  }, [measurements]);

  const totalMeds = medicines.length;
  const takenMedsCount = Object.keys(dosesTakenToday).filter((k) =>
    medicines.some((m) => m.id === k)
  ).length;
  const adherenceRate = totalMeds > 0 ? Math.round((takenMedsCount / totalMeds) * 100) : 0;
  const isAllMedsTaken = totalMeds > 0 && takenMedsCount >= totalMeds;

  const vitalDefinitions = {
    bp: { type: "blood_pressure", title: isHindi ? "रक्तचाप" : "Blood Pressure", unit: "mmHg" },
    sugar: { type: "blood_sugar", title: isHindi ? "रक्त शर्करा" : "Blood Glucose", unit: "mg/dL" },
    pulse: { type: "heart_rate", title: isHindi ? "हृदय गति" : "Heart Rate", unit: "bpm" },
  } as const;

  const SPARKLINE_DATA = Object.fromEntries(
    Object.entries(vitalDefinitions).map(([key, definition]) => {
      const records = measurements
        .filter((item) => item.vital_type === definition.type)
        .sort((a, b) => {
          const ta = Date.parse(a.recorded_at);
          const tb = Date.parse(b.recorded_at);
          return (isNaN(ta) ? 0 : ta) - (isNaN(tb) ? 0 : tb);
        })
        .slice(-7);
      const maximum = Math.max(...records.map((item) => item.value_numeric), 1);
      return [
        key,
        {
          title: `${definition.title} · ${isHindi ? "हालिया रिकॉर्ड्स" : "7-Day Trend"}`,
          unit: definition.unit,
          days: records.map((item) => {
            const parsed = Date.parse(item.recorded_at);
            const date = isNaN(parsed) ? new Date() : new Date(parsed);
            return {
              day: date.toLocaleDateString(undefined, { weekday: "short" }),
              val: `${item.value_numeric}${item.value_secondary != null ? `/${item.value_secondary}` : ""}`,
              height: Math.max(14, Math.round((item.value_numeric / maximum) * 100)),
            };
          }),
        },
      ];
    })
  ) as Record<"bp" | "sugar" | "pulse", { title: string; unit: string; days: { day: string; val: string; height: number }[] }>;

  const selectedSeries = SPARKLINE_DATA[selectedVitalTab];
  const selectedRecord =
    selectedSeries.days[Math.min(selectedDayIndex, Math.max(0, selectedSeries.days.length - 1))];

  const latestVital = (type: string, fallbackName: string) => {
    const record = [...measurements].reverse().find((item) => item.vital_type === type);
    return record
      ? `${record.value_numeric}${record.value_secondary != null ? `/${record.value_secondary}` : ""} ${record.unit}`
      : (isHindi ? "कोई डेटा नहीं" : `No ${fallbackName}`);
  };

  return (
    <View style={styles.screenWrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Cared Parents Switcher & Alert Bar */}
        <ParentSelector />

        {/* 1. Daily Wellness Index Card (Interactive & Expandable) */}
        <View style={styles.section}>
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => {
              triggerHaptic();
              setExpandedWellness(!expandedWellness);
            }}
          >
            <LinearGradient
              colors={Gradients.primaryHero}
              style={[styles.scoreCard, Shadows.cardElevated]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.scoreTopRow}>
                <View>
                  <Text style={styles.scoreBadgeText}>
                    {isHindi ? "दैनिक स्वास्थ्य सूचकांक" : "DAILY WELLNESS INDEX"}
                  </Text>
                  <Text style={styles.scoreValue}>
                    {adherenceRate}
                    <Text style={styles.scorePercent}>%</Text>
                  </Text>
                </View>

                <View style={styles.scoreRightActions}>
                  <View style={styles.scoreStatusPill}>
                    <Ionicons name="checkmark-circle" size={13} color="#D1FAE5" />
                    <Text style={styles.scoreStatusPillText}>
                      {isHindi ? "लाइव सिंक" : "Live Sync"}
                    </Text>
                  </View>
                  <View style={styles.expandChevron}>
                    <Ionicons
                      name={expandedWellness ? "chevron-up" : "chevron-down"}
                      size={15}
                      color="#FFFFFF"
                    />
                  </View>
                </View>
              </View>

              <Text style={styles.scoreDescription}>
                {isHindi
                  ? (totalMeds > 0
                      ? `आज ${takenMedsCount}/${totalMeds} दवाइयां ली गईं। परिवार सर्कल सुरक्षित है।`
                      : "कोई सक्रिय दवा शेड्यूल दर्ज नहीं है।")
                  : totalMeds > 0
                  ? `${takenMedsCount} of ${totalMeds} medications taken today. Care circle synced.`
                  : "No medication scheduled for today."}
              </Text>

              {/* Interactive Expanded Health Metrics Drawer */}
              {expandedWellness && (
                <View style={styles.expandedWellnessBox}>
                  <View style={styles.expandedDivider} />
                  <View style={styles.expandedMetricsGrid}>
                    <View style={styles.expandedMetricItem}>
                      <Ionicons name="medkit" size={15} color="#6EE7B7" />
                      <Text style={styles.expandedMetricVal}>{takenMedsCount}/{totalMeds}</Text>
                      <Text style={styles.expandedMetricLbl}>{isHindi ? "दवाइयां" : "Meds Taken"}</Text>
                    </View>

                    <View style={styles.expandedMetricItem}>
                      <Ionicons name="pulse" size={15} color="#93C5FD" />
                      <Text style={styles.expandedMetricVal}>{latestVital("blood_pressure", "BP")}</Text>
                      <Text style={styles.expandedMetricLbl}>{isHindi ? "रक्तचाप" : "Resting BP"}</Text>
                    </View>

                    <View style={styles.expandedMetricItem}>
                      <Ionicons name="flame" size={15} color="#FDE047" />
                      <Text style={styles.expandedMetricVal}>{latestVital("blood_sugar", "glucose")}</Text>
                      <Text style={styles.expandedMetricLbl}>{isHindi ? "शर्करा" : "Glucose"}</Text>
                    </View>

                    <View style={styles.expandedMetricItem}>
                      <Ionicons name="cloud-done" size={15} color="#C4B5FD" />
                      <Text style={styles.expandedMetricVal}>Active</Text>
                      <Text style={styles.expandedMetricLbl}>{isHindi ? "फास्टएपीआई" : "FastAPI Sync"}</Text>
                    </View>
                  </View>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* 2. Professional Quick Actions Dock */}
        <View style={styles.actionsSection}>
          {/* Prominent Emergency SOS Button */}
          <TouchableOpacity
            style={styles.sosActionBtn}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
              setSosModalVisible(true);
            }}
            activeOpacity={0.85}
            accessibilityLabel="Emergency SOS Alert"
          >
            <LinearGradient
              colors={Gradients.sos}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sosActionGradient}
            >
              <View style={styles.sosIconCircle}>
                <Ionicons name="shield" size={17} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sosActionTitle}>
                  {isHindi ? "आपातकालीन एसओएस" : "EMERGENCY SOS"}
                </Text>
                <Text style={styles.sosActionSub}>
                  {isHindi ? "1-टैप सायरन व लोकेशन अलर्ट" : "Broadcast live GPS beacon"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </TouchableOpacity>

          {/* 4 Sleek Frosted Utility Tiles */}
          <View style={styles.utilityGrid}>
            {/* Log Vitals */}
            <TouchableOpacity
              style={styles.utilityTile}
              onPress={() => {
                triggerHaptic();
                setLogVitalModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.utilityIconWrap, { backgroundColor: Colors.primaryFaint }]}>
                <Ionicons name="add-circle" size={19} color={Colors.primaryDark} />
              </View>
              <Text style={styles.utilityTitle} numberOfLines={1}>
                {isHindi ? "वाइटल दर्ज करें" : "Log Vitals"}
              </Text>
            </TouchableOpacity>

            {/* Document / Prescription Scanner */}
            <TouchableOpacity
              style={styles.utilityTile}
              onPress={() => {
                triggerHaptic();
                setScannerMode("document");
                setScannerModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.utilityIconWrap, { backgroundColor: "#E0F2FE" }]}>
                <Ionicons name="camera" size={19} color="#0284C7" />
              </View>
              <Text style={styles.utilityTitle} numberOfLines={1}>
                {isHindi ? "पर्चा स्कैन" : "Scan Rx"}
              </Text>
            </TouchableOpacity>

            {/* AI Clinical Assistant */}
            <TouchableOpacity
              style={styles.utilityTile}
              onPress={() => {
                triggerHaptic();
                setAiAssistantModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.utilityIconWrap, { backgroundColor: "#F3E8FF" }]}>
                <Ionicons name="sparkles" size={19} color="#7C3AED" />
              </View>
              <Text style={styles.utilityTitle} numberOfLines={1}>
                {isHindi ? "एआई सहायक" : "Ask AI"}
              </Text>
            </TouchableOpacity>

            {/* Doctor Share QR */}
            <TouchableOpacity
              style={styles.utilityTile}
              onPress={() => {
                triggerHaptic();
                setDoctorShareModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.utilityIconWrap, { backgroundColor: "#EEF2FF" }]}>
                <Ionicons name="qr-code" size={19} color="#4F46E5" />
              </View>
              <Text style={styles.utilityTitle} numberOfLines={1}>
                {isHindi ? "डॉक्टर क्यूआर" : "Doc QR"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Urgent Health & Clinical Alerts (if any) */}
        {vitalAlerts.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.alertCard, Shadows.card]}>
              <View style={styles.alertHeaderRow}>
                <View
                  style={[
                    styles.alertIconCircle,
                    { backgroundColor: vitalAlerts[0].isCritical ? "#FEE2E2" : "#FEF3C7" },
                  ]}
                >
                  <Ionicons
                    name={vitalAlerts[0].isCritical ? "alert-circle" : "warning"}
                    size={19}
                    color={vitalAlerts[0].isCritical ? "#DC2626" : "#D97706"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertHeaderTitle}>
                    {vitalAlerts[0].isCritical
                      ? (isHindi ? "महत्वपूर्ण स्वास्थ्य चेतावनी" : "Critical Health Alert")
                      : (isHindi ? "वाइटल ध्यान देने योग्य" : "Vital Sign Notice")}
                  </Text>
                  <Text style={styles.alertHeaderSub} numberOfLines={1}>
                    {vitalAlerts[0].title} • {vitalAlerts[0].valStr}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.alertActionBtn,
                    { backgroundColor: vitalAlerts[0].isCritical ? "#DC2626" : "#D97706" },
                  ]}
                  onPress={() => setLogVitalModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.alertActionBtnText}>
                    {isHindi ? "जाँचें" : "Review"}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.alertDetailText}>{vitalAlerts[0].detail}</Text>
            </View>
          </View>
        )}

        {/* 4. Unified Vitals Hub & 7-Day Analytics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>
                {isHindi ? "क्लिनिकल सिग्नल्स" : "HEALTH SIGNALS"}
              </Text>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="pulse" size={17} color={Colors.primaryDark} />
                <Text style={[styles.sectionTitle, seniorMode && styles.seniorSectionTitle]}>
                  {isHindi ? "वाइटल्स एवं बायोमेट्रिक्स" : "Vitals & Biometrics"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setLogVitalModalVisible(true)}
              style={styles.headerActionPill}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={13} color={Colors.primaryDark} />
              <Text style={styles.headerActionPillText}>
                {isHindi ? "रीडिंग दर्ज करें" : "Log Vital"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Metric Selector Tabs */}
          <View style={styles.vitalTabsRow}>
            {[
              { id: "bp" as const, label: isHindi ? "रक्तचाप" : "Blood Pressure", val: latestVital("blood_pressure", "BP") },
              { id: "sugar" as const, label: isHindi ? "शर्करा" : "Glucose", val: latestVital("blood_sugar", "glucose") },
              { id: "pulse" as const, label: isHindi ? "पल्स" : "Heart Rate", val: latestVital("heart_rate", "pulse") },
            ].map((tab) => {
              const isSelected = selectedVitalTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.vitalTabBtn, isSelected && styles.vitalTabBtnActive]}
                  onPress={() => {
                    triggerHaptic();
                    setSelectedVitalTab(tab.id);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.vitalTabBtnLabel, isSelected && styles.vitalTabBtnLabelActive]}>
                    {tab.label}
                  </Text>
                  <Text style={[styles.vitalTabBtnVal, isSelected && styles.vitalTabBtnValActive]} numberOfLines={1}>
                    {tab.val}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 7-Day Sparkline Bar Chart Card */}
          <View style={[styles.sparklineCard, Shadows.card]}>
            <View style={styles.sparklineHeader}>
              <View>
                <Text style={styles.sparklineTitle}>
                  {selectedSeries.title}
                </Text>
                <Text style={styles.sparklineTarget}>
                  {isHindi ? "रिकॉर्डेड मान" : "Measured values"} · {selectedSeries.unit}
                </Text>
              </View>
              {selectedRecord && (
                <View style={styles.activeDayPill}>
                  <Text style={styles.activeDayPillText}>
                    {selectedRecord.day}: {selectedRecord.val}
                  </Text>
                </View>
              )}
            </View>

            {/* Bar Chart Bars */}
            <View style={styles.sparklineBarsRow}>
              {selectedSeries.days.map((d, idx) => {
                const isSelected = selectedDayIndex === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={styles.sparklineCol}
                    onPress={() => setSelectedDayIndex(idx)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.sparklineBarTrack}>
                      <View
                        style={[
                          styles.sparklineBarFill,
                          { height: `${d.height}%` },
                          isSelected && styles.sparklineBarFillActive,
                        ]}
                      />
                    </View>
                    <Text style={[styles.sparklineDayLabel, isSelected && styles.sparklineDayLabelActive]}>
                      {d.day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {selectedSeries.days.length === 0 && (
                <Text style={styles.emptyInlineNote}>
                  {isHindi ? "इस वाइटल के लिए कोई रिकॉर्ड नहीं मिला।" : "No measurements recorded for this vital yet."}
                </Text>
              )}
            </View>
          </View>

          {/* Clean Latest Vitals Strip */}
          {measurements.length > 0 && (
            <View style={styles.vitalsRow}>
              {measurements.slice(0, 2).map((m) => (
                <VitalBadge key={m.id} measurement={m} />
              ))}
            </View>
          )}
        </View>

        {/* 5. Upcoming Doctor Consultation Spotlight */}
        {nextAppointment && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>
                  {isHindi ? "परामर्श" : "SCHEDULED CARE"}
                </Text>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="calendar" size={17} color={Colors.secondary} />
                  <Text style={[styles.sectionTitle, seniorMode && styles.seniorSectionTitle]}>
                    {isHindi ? "आगामी परामर्श" : "Doctor Consultation"}
                  </Text>
                </View>
              </View>

              <View style={styles.headerRightActions}>
                <TouchableOpacity
                  onPress={() => setAddApptModalVisible(true)}
                  style={styles.headerActionPill}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={13} color={Colors.primaryDark} />
                  <Text style={styles.headerActionPillText}>
                    {isHindi ? "जोड़ें" : "Add"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onNavigateTab("timeline")}>
                  <Text style={styles.sectionLink}>
                    {isHindi ? "सभी" : "View All"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.appointmentCard, Shadows.card]}>
              <View style={styles.apptTop}>
                <Image
                  source={require("../../assets/doctor_avatar.jpg")}
                  style={styles.doctorAvatarImage}
                  resizeMode="cover"
                />

                <View style={styles.apptInfo}>
                  <View style={styles.doctorNameRow}>
                    <Text style={styles.apptDoctor}>{nextAppointment.doctor_name}</Text>
                    <View style={styles.confirmedPill}>
                      <Text style={styles.confirmedPillText}>Confirmed</Text>
                    </View>
                  </View>

                  <Text style={styles.apptSpecialty}>{nextAppointment.specialty}</Text>
                  <Text style={styles.apptFacility} numberOfLines={1}>
                    <Ionicons name="business-outline" size={12} color={Colors.textMuted} />{" "}
                    {nextAppointment.hospital_clinic_name}
                  </Text>
                </View>
              </View>

              {/* Date & Location Pill Bar */}
              <View style={styles.apptScheduleBar}>
                <View style={styles.scheduleItem}>
                  <Ionicons name="calendar-outline" size={13} color={Colors.primaryDeep} />
                  <Text style={styles.scheduleItemText}>
                    {(() => {
                      const ts = Date.parse(nextAppointment.appointment_date);
                      if (isNaN(ts)) return nextAppointment.appointment_date || "Upcoming";
                      const d = new Date(ts);
                      return (
                        d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) +
                        " • " +
                        d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
                      );
                    })()}
                  </Text>
                </View>
                <View style={styles.scheduleItem}>
                  <Ionicons name="location-outline" size={13} color={Colors.secondaryDark} />
                  <Text style={styles.scheduleItemText} numberOfLines={1}>
                    {nextAppointment.hospital_clinic_name || activeParent.address || "Clinic"}
                  </Text>
                </View>
              </View>

              {nextAppointment.reason ? (
                <Text style={styles.apptReason} numberOfLines={2}>
                  <Text style={{ fontWeight: "700" }}>Note: </Text>
                  {nextAppointment.reason}
                </Text>
              ) : null}

              {/* Quick Action Buttons */}
              <View style={styles.apptActions}>
                <TouchableOpacity
                  style={styles.callDoctorBtn}
                  onPress={() => Linking.openURL("tel:+919822334455")}
                  activeOpacity={0.7}
                >
                  <Ionicons name="call" size={14} color={Colors.primaryDeep} />
                  <Text style={styles.callDoctorText}>
                    {isHindi ? "कॉल करें" : "Call Clinic"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.mapBtn}
                  onPress={() => onNavigateTab("maps")}
                  activeOpacity={0.7}
                >
                  <Ionicons name="navigate" size={14} color="#FFFFFF" />
                  <Text style={styles.mapBtnText}>
                    {isHindi ? "दिशा-निर्देश" : "Directions"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteApptBtn}
                  onPress={() => setApptToDelete(nextAppointment)}
                  activeOpacity={0.7}
                  accessibilityLabel="Cancel consultation"
                >
                  <Ionicons name="trash-outline" size={15} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* 6. Today's Medication Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>
                {isHindi ? "दैनिक दिनचर्या" : "DAILY ROUTINE"}
              </Text>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="medkit" size={17} color={Colors.primaryDark} />
                <Text style={[styles.sectionTitle, seniorMode && styles.seniorSectionTitle]}>
                  {isHindi ? "आज का दवा शेड्यूल" : "Medicine Checklist"}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={() => onNavigateTab("medicines")}>
              <Text style={styles.sectionLink}>
                {isHindi ? `प्रबंधन (${medicines.length})` : `Manage (${medicines.length})`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 100% Adherence Celebration Banner */}
          {isAllMedsTaken && (
            <View style={[styles.allMedsCelebration, Shadows.subtle]}>
              <LinearGradient
                colors={["#10B981", "#059669"]}
                style={styles.celebrationGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="sparkles" size={19} color="#FFFFFF" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.celebrationTitle}>
                    {isHindi ? "दैनिक दवाइयां 100% पूर्ण!" : "100% Adherence Today!"}
                  </Text>
                  <Text style={styles.celebrationSub}>
                    {isHindi
                      ? `आज की सभी ${totalMeds} दवाइयां समय पर ली गई हैं। फैमिली सर्कल सिंक है।`
                      : `All ${totalMeds} scheduled doses marked taken. Family circle synced.`}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          )}

          {medicines.map((med) => (
            <MedicineCard key={med.id} medicine={med} />
          ))}
        </View>

        {/* 7. Today's Family Care Coordination Tasks */}
        {parentTasks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>
                  {isHindi ? "केयर सर्कल" : "CARE CIRCLE"}
                </Text>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="checkbox" size={17} color={Colors.primaryDark} />
                  <Text style={[styles.sectionTitle, seniorMode && styles.seniorSectionTitle]}>
                    {isHindi ? "पारिवारिक देखभाल कार्य" : "Today's Care Tasks"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity onPress={() => setActiveScreen("family")}>
                <Text style={styles.sectionLink}>
                  {isHindi ? `सर्कल (${parentTasks.length})` : `Tasks (${parentTasks.length})`}
                </Text>
              </TouchableOpacity>
            </View>

            {parentTasks.slice(0, 2).map((task) => {
              const isCompleted = task.status === "completed";
              return (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.taskItemCard, isCompleted && styles.taskItemCardCompleted]}
                  onPress={() => {
                    triggerHaptic();
                    toggleTaskCompleted(task.id);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.taskCheckCircle, isCompleted && styles.taskCheckCircleDone]}>
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                    ) : (
                      <View style={styles.taskCheckInnerDot} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.taskItemTitle,
                        isCompleted && styles.taskItemTitleCompleted,
                        seniorMode && styles.seniorTitle,
                      ]}
                    >
                      {task.title}
                    </Text>
                    <Text style={styles.taskItemSub} numberOfLines={1}>
                      {task.assigned_to_name} • Due: {task.due_date}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.taskPriorityPill,
                      task.priority === "high" && styles.taskPriorityHigh,
                    ]}
                  >
                    <Text
                      style={[
                        styles.taskPriorityText,
                        task.priority === "high" && styles.taskPriorityTextHigh,
                      ]}
                    >
                      {task.priority.toUpperCase()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* 8. Recent Medical Documents Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>
                {isHindi ? "हेल्थ वॉल्ट" : "RECORDS VAULT"}
              </Text>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="folder-open" size={17} color="#6366F1" />
                <Text style={[styles.sectionTitle, seniorMode && styles.seniorSectionTitle]}>
                  {isHindi ? "हालिया मेडिकल रिकॉर्ड्स" : "Recent Health Records"}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={() => onNavigateTab("documents")}>
              <Text style={styles.sectionLink}>
                {isHindi ? `वॉल्ट (${documents.length})` : `Vault (${documents.length})`}
              </Text>
            </TouchableOpacity>
          </View>

          {documents.slice(0, 2).map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={[styles.docPreviewCard, Shadows.card]}
              onPress={() => onNavigateTab("documents")}
              activeOpacity={0.8}
            >
              <View style={styles.docIconBox}>
                <Ionicons
                  name={doc.document_type === "lab_report" ? "flask" : "document-text"}
                  size={20}
                  color={Colors.primaryDark}
                />
              </View>
              <View style={styles.docInfo}>
                <View style={styles.docHeaderRow}>
                  <Text style={styles.docTitle} numberOfLines={1}>
                    {doc.title}
                  </Text>
                  <View style={styles.ocrChip}>
                    <Text style={styles.ocrChipText}>OCR Verified</Text>
                  </View>
                </View>

                <Text style={styles.docDate}>
                  {doc.document_date} • {doc.doctor_name || "Diagnostic Lab"}
                </Text>
                {doc.summary ? (
                  <Text numberOfLines={2} style={styles.docSummaryText}>
                    {doc.summary}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 9. Healthcare Facilities Activity & Map Access */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>
                {isHindi ? "नज़दीकी सुविधाएं" : "HEALTHCARE ACCESS"}
              </Text>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="location" size={17} color={Colors.primaryDark} />
                <Text style={[styles.sectionTitle, seniorMode && styles.seniorSectionTitle]}>
                  {isHindi ? "स्वास्थ्य केंद्र विज़िट्स" : "Healthcare Activity"}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={() => onNavigateTab("maps")}>
              <Text style={styles.sectionLink}>
                {isHindi ? "नक्शा खोलें" : "Open Map"}
              </Text>
            </TouchableOpacity>
          </View>

          {visits.length > 0 ? (
            visits.slice(0, 2).map((v) => (
              <TouchableOpacity
                key={v.id}
                style={[styles.visitPreviewCard, Shadows.card]}
                onPress={() => onNavigateTab("maps")}
                activeOpacity={0.8}
              >
                <View style={styles.visitPreviewIconBox}>
                  <Ionicons name="business" size={18} color={Colors.primaryDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.visitPreviewName} numberOfLines={1}>{v.place_name}</Text>
                  <Text style={styles.visitPreviewAddress} numberOfLines={1}>{v.address}</Text>
                  <Text style={styles.visitPreviewTime}>{v.visited_at} • {v.category}</Text>
                </View>
                <Ionicons name="chevron-forward" size={15} color={Colors.textMuted} />
              </TouchableOpacity>
            ))
          ) : (
            <TouchableOpacity
              style={[styles.mapPromptCard, Shadows.card]}
              onPress={() => onNavigateTab("maps")}
              activeOpacity={0.85}
            >
              <View style={styles.mapPromptIconBox}>
                <Ionicons name="map-outline" size={20} color={Colors.primaryDeep} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mapPromptTitle}>
                  {isHindi ? "नज़दीकी अस्पताल व फ़ार्मेसी खोजें" : "Explore Nearby Healthcare"}
                </Text>
                <Text style={styles.mapPromptSub}>
                  {isHindi
                    ? "इंटरैक्टिव मैप पर डॉक्टर, अस्पताल व आपातकालीन केंद्र देखें और चेक-इन दर्ज करें।"
                    : "Interactive map with verified clinics, pharmacies, and 1-tap check-in logging."}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Add Consultation Modal */}
      <AddAppointmentModal
        visible={addApptModalVisible}
        onClose={() => setAddApptModalVisible(false)}
      />

      {/* Confirmation Modal for Cancelling Appointment */}
      <ConfirmationModal
        visible={!!apptToDelete}
        title={isHindi ? "परामर्श रद्द करें?" : "Cancel Consultation?"}
        message={
          isHindi
            ? `क्या आप निश्चित हैं कि आप ${apptToDelete?.doctor_name} (${apptToDelete?.specialty}) के साथ परामर्श रद्द करना चाहते हैं?`
            : `Are you sure you want to cancel the scheduled visit with ${apptToDelete?.doctor_name} (${apptToDelete?.specialty})? Caregivers will be notified.`
        }
        confirmText={isHindi ? "रद्द करें" : "Cancel Visit"}
        cancelText={isHindi ? "रखें" : "Keep Visit"}
        isDestructive={true}
        iconType="warning"
        onConfirm={() => {
          if (apptToDelete) {
            deleteAppointment(apptToDelete.id);
            setApptToDelete(null);
          }
        }}
        onCancel={() => setApptToDelete(null)}
      />
    </View>
  );
};

const styles = createThemedStyles({
  screenWrapper: {
    flex: 1,
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    paddingBottom: 160,
  },
  section: {
    marginTop: 22,
    marginBottom: 4,
    paddingHorizontal: Spacing.md,
  },
  actionsSection: {
    marginTop: 18,
    marginBottom: 4,
    paddingHorizontal: Spacing.md,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  sectionEyebrow: {
    fontSize: 9,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: 0.8,
    color: Colors.primaryDark,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  seniorSectionTitle: {
    fontSize: Typography.seniorSizes.md,
  },
  seniorTitle: {
    fontSize: Typography.seniorSizes.sm,
  },
  sectionLink: {
    fontSize: 12.5,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerActionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(204, 251, 241, 0.85)",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
  },
  headerActionPillText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDeep,
  },
  scoreCard: {
    padding: Spacing.lg,
    borderRadius: 26,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.35)",
    position: "relative",
    overflow: "hidden",
  },
  scoreTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  scoreBadgeText: {
    color: "#CCFBF1",
    fontSize: 9.5,
    fontWeight: Typography.weights.extraBold,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  scoreValue: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: -1,
  },
  scorePercent: {
    fontSize: 19,
    fontWeight: Typography.weights.semibold,
  },
  scoreRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scoreStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  scoreStatusPillText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: Typography.weights.bold,
  },
  expandChevron: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  scoreDescription: {
    color: "#E6FFFA",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  expandedWellnessBox: {
    marginTop: 6,
  },
  expandedDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    marginVertical: 10,
  },
  expandedMetricsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  expandedMetricItem: {
    alignItems: "center",
    gap: 2,
  },
  expandedMetricVal: {
    fontSize: 11.5,
    fontWeight: Typography.weights.bold,
    color: "#FFFFFF",
  },
  expandedMetricLbl: {
    fontSize: 9.5,
    color: "rgba(255, 255, 255, 0.8)",
  },

  /* Sleek Emergency SOS Pill */
  sosActionBtn: {
    borderRadius: 18,
    overflow: "hidden",
    ...Shadows.glowRed,
  },
  sosActionGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  sosIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  sosActionTitle: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: 0.5,
  },
  sosActionSub: {
    color: "rgba(255, 255, 255, 0.88)",
    fontSize: 10,
    marginTop: 1,
  },

  /* 4-Item Utility Grid */
  utilityGrid: {
    flexDirection: "row",
    gap: 8,
  },
  utilityTile: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.95)",
    ...Shadows.subtle,
  },
  utilityIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  utilityTitle: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    textAlign: "center",
  },

  /* Urgent Alert Card */
  alertCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
  },
  alertHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  alertIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  alertHeaderTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  alertHeaderSub: {
    fontSize: 11,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  alertActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  alertActionBtnText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: "#FFFFFF",
  },
  alertDetailText: {
    fontSize: 11,
    lineHeight: 16,
    color: Colors.textMuted,
  },

  /* Vitals Hub */
  vitalTabsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  vitalTabBtn: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
  },
  vitalTabBtnActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  vitalTabBtnLabel: {
    fontSize: 9.5,
    fontWeight: Typography.weights.semibold,
    color: Colors.textMuted,
  },
  vitalTabBtnLabelActive: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  vitalTabBtnVal: {
    fontSize: 12,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  vitalTabBtnValActive: {
    color: Colors.primaryDeep,
  },
  sparklineCard: {
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderRadius: 20,
    padding: Spacing.md,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.92)",
    ...Shadows.subtle,
  },
  sparklineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sparklineTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  sparklineTarget: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  activeDayPill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  activeDayPillText: {
    fontSize: 10.5,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDeep,
  },
  sparklineBarsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 72,
    paddingTop: 8,
  },
  sparklineCol: {
    alignItems: "center",
    width: 32,
  },
  sparklineBarTrack: {
    width: 14,
    height: 52,
    backgroundColor: "rgba(241, 245, 249, 0.9)",
    borderRadius: 7,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  sparklineBarFill: {
    width: "100%",
    backgroundColor: Colors.primaryDark,
    borderRadius: 7,
  },
  sparklineBarFillActive: {
    backgroundColor: Colors.secondary,
  },
  sparklineDayLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
    fontWeight: Typography.weights.medium,
  },
  sparklineDayLabelActive: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  emptyInlineNote: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: "center",
    paddingVertical: 14,
  },
  vitalsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  /* Consultation Card */
  appointmentCard: {
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    padding: Spacing.md,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.92)",
    ...Shadows.card,
  },
  apptTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  doctorAvatarImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  apptInfo: {
    flex: 1,
  },
  doctorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  apptDoctor: {
    fontSize: 14.5,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  confirmedPill: {
    backgroundColor: "rgba(209, 250, 229, 0.85)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  confirmedPillText: {
    fontSize: 9.5,
    fontWeight: Typography.weights.bold,
    color: Colors.successDark,
  },
  apptSpecialty: {
    fontSize: 11.5,
    color: Colors.primaryDark,
    fontWeight: Typography.weights.semibold,
  },
  apptFacility: {
    fontSize: 10.5,
    color: Colors.textMuted,
    marginTop: 2,
  },
  apptScheduleBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(241, 245, 249, 0.8)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  scheduleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  scheduleItemText: {
    fontSize: 10.5,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  apptReason: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginTop: 8,
    lineHeight: 16,
  },
  apptActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  callDoctorBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "rgba(204, 251, 241, 0.85)",
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  callDoctorText: {
    fontSize: 11.5,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDeep,
  },
  mapBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: Colors.primaryDark,
    paddingVertical: 9,
    borderRadius: 12,
    ...Shadows.glowTeal,
  },
  mapBtnText: {
    fontSize: 11.5,
    fontWeight: Typography.weights.bold,
    color: "#FFFFFF",
  },
  deleteApptBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(254, 226, 226, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(252, 165, 165, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },

  /* Daily Routine & Meds */
  allMedsCelebration: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 8,
  },
  celebrationGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
  },
  celebrationTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: "#FFFFFF",
  },
  celebrationSub: {
    fontSize: 10.5,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
  },

  /* Care Circle Tasks */
  taskItemCard: {
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    padding: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.9)",
    ...Shadows.subtle,
  },
  taskItemCardCompleted: {
    backgroundColor: "rgba(240, 253, 250, 0.88)",
    borderColor: Colors.successLight,
  },
  taskCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.textSubtle,
    justifyContent: "center",
    alignItems: "center",
  },
  taskCheckCircleDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  taskCheckInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "transparent",
  },
  taskItemTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  taskItemTitleCompleted: {
    textDecorationLine: "line-through",
    color: Colors.textMuted,
  },
  taskItemSub: {
    fontSize: 10.5,
    color: Colors.textMuted,
    marginTop: 2,
  },
  taskPriorityPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.borderLight,
  },
  taskPriorityHigh: {
    backgroundColor: Colors.emergencyLight,
  },
  taskPriorityText: {
    fontSize: 8.5,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  taskPriorityTextHigh: {
    color: Colors.emergencyDark,
  },

  /* Documents Preview */
  docPreviewCard: {
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.9)",
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    ...Shadows.subtle,
  },
  docIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(204, 251, 241, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.95)",
  },
  docInfo: {
    flex: 1,
  },
  docHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  docTitle: {
    fontSize: 12.5,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 6,
  },
  ocrChip: {
    backgroundColor: "rgba(243, 232, 255, 0.85)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  ocrChipText: {
    fontSize: 9,
    fontWeight: Typography.weights.bold,
    color: "#7E22CE",
  },
  docDate: {
    fontSize: 10.5,
    color: Colors.textMuted,
    marginTop: 2,
  },
  docSummaryText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 15,
  },

  /* Facilities & Activity */
  visitPreviewCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.9)",
  },
  visitPreviewIconBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  visitPreviewName: {
    fontSize: 12,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  visitPreviewAddress: {
    fontSize: 10.5,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  visitPreviewTime: {
    fontSize: 9.5,
    color: Colors.textMuted,
    marginTop: 2,
    textTransform: "capitalize",
  },
  mapPromptCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.9)",
  },
  mapPromptIconBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  mapPromptTitle: {
    fontSize: 12.5,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  mapPromptSub: {
    fontSize: 10.5,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
});
