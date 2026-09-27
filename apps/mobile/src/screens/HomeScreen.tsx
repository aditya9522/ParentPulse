// apps/mobile/src/screens/HomeScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "../context/AppContext";
import { Colors, Typography, Spacing, Shadows, BorderRadius, Gradients } from "../theme";
import { ParentSelector } from "../components/ParentSelector";
import { VitalBadge } from "../components/VitalBadge";
import { MedicineCard } from "../components/MedicineCard";
import { AddAppointmentModal } from "../components/AddAppointmentModal";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { Appointment } from "../types";

export const HomeScreen: React.FC<{ onNavigateTab: (tab: string) => void }> = ({ onNavigateTab }) => {
  const {
    activeParent,
    measurements,
    medicines,
    appointments,
    deleteAppointment,
    documents,
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

  const [addApptModalVisible, setAddApptModalVisible] = useState(false);
  const [apptToDelete, setApptToDelete] = useState<Appointment | null>(null);
  const [expandedWellness, setExpandedWellness] = useState<boolean>(false);
  const [selectedVitalTab, setSelectedVitalTab] = useState<"bp" | "sugar" | "pulse">("bp");
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(6);

  const nextAppointment = appointments[0];
  const parentTasks = tasks.filter((t) => t.parent_id === activeParent.id);

  const totalMeds = medicines.length;
  const takenMedsCount = Object.keys(dosesTakenToday).filter((k) =>
    medicines.some((m) => m.id === k)
  ).length;
  const adherenceRate = totalMeds > 0 ? Math.round((takenMedsCount / totalMeds) * 100) : 100;
  const isAllMedsTaken = totalMeds > 0 && takenMedsCount >= totalMeds;

  const SPARKLINE_DATA = {
    bp: {
      title: language === "hi" ? "ब्लड प्रेशर ट्रेंड (7-दिन)" : "Blood Pressure (7-Day Trend)",
      unit: "mmHg",
      target: "120/80 mmHg",
      days: [
        { day: "Mon", val: "122/80", height: 55, status: "Optimal" },
        { day: "Tue", val: "125/82", height: 68, status: "Optimal" },
        { day: "Wed", val: "128/84", height: 78, status: "Normal" },
        { day: "Thu", val: "124/80", height: 62, status: "Optimal" },
        { day: "Fri", val: "126/82", height: 70, status: "Optimal" },
        { day: "Sat", val: "123/79", height: 58, status: "Optimal" },
        { day: "Sun", val: "126/80", height: 70, status: "Optimal" },
      ],
    },
    sugar: {
      title: language === "hi" ? "फास्टिंग ब्लड शुगर (7-दिन)" : "Fasting Glucose (7-Day Trend)",
      unit: "mg/dL",
      target: "70-120 mg/dL",
      days: [
        { day: "Mon", val: "110", height: 52, status: "Normal" },
        { day: "Tue", val: "112", height: 56, status: "Normal" },
        { day: "Wed", val: "119", height: 75, status: "Borderline" },
        { day: "Thu", val: "115", height: 64, status: "Normal" },
        { day: "Fri", val: "111", height: 54, status: "Normal" },
        { day: "Sat", val: "116", height: 66, status: "Normal" },
        { day: "Sun", val: "114", height: 60, status: "Normal" },
      ],
    },
    pulse: {
      title: language === "hi" ? "हार्ट रेट / पल्स (7-दिन)" : "Heart Rate (7-Day Trend)",
      unit: "bpm",
      target: "60-100 bpm",
      days: [
        { day: "Mon", val: "72", height: 60, status: "Optimal" },
        { day: "Tue", val: "74", height: 68, status: "Optimal" },
        { day: "Wed", val: "71", height: 58, status: "Optimal" },
        { day: "Thu", val: "73", height: 65, status: "Optimal" },
        { day: "Fri", val: "75", height: 72, status: "Optimal" },
        { day: "Sat", val: "70", height: 54, status: "Optimal" },
        { day: "Sun", val: "72", height: 60, status: "Optimal" },
      ],
    },
  };

  return (
    <View style={styles.screenWrapper}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cared Parents Switcher & Alert Bar */}
        <ParentSelector />

        {/* Wellness & Care Score Card (Interactive Expandable) */}
        <View style={styles.scoreContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setExpandedWellness(!expandedWellness)}
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
                    {language === "hi" ? "दैनिक स्वास्थ्य स्कोर" : "Daily Wellness Index"}
                  </Text>
                  <Text style={styles.scoreValue}>
                    {adherenceRate}<Text style={styles.scorePercent}>%</Text>
                  </Text>
                </View>

                <View style={styles.scoreRightActions}>
                  <View style={styles.scoreStatusPill}>
                    <Ionicons name="checkmark-circle" size={14} color="#D1FAE5" />
                    <Text style={styles.scoreStatusPillText}>
                      {language === "hi" ? "सभी वाइटल स्थिर" : "Vitals Stable"}
                    </Text>
                  </View>
                  <View style={styles.expandChevron}>
                    <Ionicons
                      name={expandedWellness ? "chevron-up" : "chevron-down"}
                      size={16}
                      color="#FFFFFF"
                    />
                  </View>
                </View>
              </View>

              <Text style={styles.scoreDescription}>
                {language === "hi"
                  ? `आज की ${takenMedsCount}/${totalMeds} निर्धारित दवाइयां समय पर ली गई हैं। ब्लड प्रेशर सामान्य सीमा (126/80) में है।`
                  : `${takenMedsCount} of ${totalMeds} medications confirmed on schedule. Blood pressure resting optimal at 126/80.`}
              </Text>

              {/* Interactive Expanded Health Metrics Drawer */}
              {expandedWellness && (
                <View style={styles.expandedWellnessBox}>
                  <View style={styles.expandedDivider} />
                  <View style={styles.expandedMetricsGrid}>
                    <View style={styles.expandedMetricItem}>
                      <Ionicons name="medkit" size={16} color="#6EE7B7" />
                      <Text style={styles.expandedMetricVal}>{takenMedsCount}/{totalMeds}</Text>
                      <Text style={styles.expandedMetricLbl}>Meds Taken</Text>
                    </View>

                    <View style={styles.expandedMetricItem}>
                      <Ionicons name="pulse" size={16} color="#93C5FD" />
                      <Text style={styles.expandedMetricVal}>126/80</Text>
                      <Text style={styles.expandedMetricLbl}>Resting BP</Text>
                    </View>

                    <View style={styles.expandedMetricItem}>
                      <Ionicons name="flame" size={16} color="#FDE047" />
                      <Text style={styles.expandedMetricVal}>114</Text>
                      <Text style={styles.expandedMetricLbl}>Sugar (mg/dL)</Text>
                    </View>

                    <View style={styles.expandedMetricItem}>
                      <Ionicons name="cloud-done" size={16} color="#C4B5FD" />
                      <Text style={styles.expandedMetricVal}>Live</Text>
                      <Text style={styles.expandedMetricLbl}>FastAPI Sync</Text>
                    </View>
                  </View>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Modern 5-Item Quick Action Dock */}
        <View style={styles.quickActionsGrid}>
          {/* Emergency SOS Button */}
          <TouchableOpacity
            style={styles.actionBtnWrapper}
            onPress={() => setSosModalVisible(true)}
            activeOpacity={0.8}
          >
            <LinearGradient colors={Gradients.sos} style={[styles.actionBtnGradient, Shadows.glowRed]}>
              <Ionicons name="shield" size={20} color="#FFFFFF" />
              <Text style={styles.actionBtnTitle} numberOfLines={1}>
                {language === "hi" ? "आपातकाल" : "SOS"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Log Vitals Button */}
          <TouchableOpacity
            style={styles.actionBtnWrapper}
            onPress={() => setLogVitalModalVisible(true)}
            activeOpacity={0.8}
          >
            <LinearGradient colors={Gradients.primary} style={[styles.actionBtnGradient, Shadows.card]}>
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.actionBtnTitle} numberOfLines={1}>
                {language === "hi" ? "वाइटल" : "Vitals"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Real Camera Document / QR Scanner Button */}
          <TouchableOpacity
            style={styles.actionBtnWrapper}
            onPress={() => {
              setScannerMode("document");
              setScannerModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <LinearGradient colors={Gradients.teal} style={[styles.actionBtnGradient, Shadows.card]}>
              <Ionicons name="camera" size={20} color="#FFFFFF" />
              <Text style={styles.actionBtnTitle} numberOfLines={1}>
                {language === "hi" ? "स्कैनर" : "Scan Rx"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Ask AI Assistant */}
          <TouchableOpacity
            style={styles.actionBtnWrapper}
            onPress={() => setAiAssistantModalVisible(true)}
            activeOpacity={0.8}
          >
            <LinearGradient colors={Gradients.ai} style={[styles.actionBtnGradient, Shadows.card]}>
              <Ionicons name="sparkles" size={20} color="#FFFFFF" />
              <Text style={styles.actionBtnTitle} numberOfLines={1}>
                {language === "hi" ? "AI चैट" : "Ask AI"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Doctor Share QR */}
          <TouchableOpacity
            style={styles.actionBtnWrapper}
            onPress={() => setDoctorShareModalVisible(true)}
            activeOpacity={0.8}
          >
            <LinearGradient colors={Gradients.doctor} style={[styles.actionBtnGradient, Shadows.card]}>
              <Ionicons name="qr-code" size={20} color="#FFFFFF" />
              <Text style={styles.actionBtnTitle} numberOfLines={1}>
                {language === "hi" ? "डॉक्टर QR" : "Doc QR"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Interactive 7-Day Vitals Analytics & Trend Visualizer */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderWithoutPadding}>
            <View style={styles.sectionHeaderTitleRow}>
              <Ionicons name="analytics" size={18} color={Colors.primaryDark} />
              <Text style={[styles.sectionTitle, seniorMode && styles.seniorSectionTitle]}>
                {language === "hi" ? "वाइटल ट्रेंड विश्लेषण" : "7-Day Vitals Analytics"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setLogVitalModalVisible(true)}
              style={styles.addVitalChip}
            >
              <Ionicons name="add" size={14} color={Colors.primaryDark} />
              <Text style={styles.addVitalChipText}>
                {language === "hi" ? "रीडिंग दर्ज करें" : "Log"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Metric Selector Tabs */}
          <View style={styles.vitalTabsRow}>
            {[
              { id: "bp" as const, label: "Blood Pressure", val: "126/80" },
              { id: "sugar" as const, label: "Glucose", val: "114 mg/dL" },
              { id: "pulse" as const, label: "Heart Rate", val: "72 bpm" },
            ].map((tab) => {
              const isSelected = selectedVitalTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.vitalTabBtn, isSelected && styles.vitalTabBtnActive]}
                  onPress={() => setSelectedVitalTab(tab.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.vitalTabBtnLabel, isSelected && styles.vitalTabBtnLabelActive]}>
                    {tab.label}
                  </Text>
                  <Text style={[styles.vitalTabBtnVal, isSelected && styles.vitalTabBtnValActive]}>
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
                  {SPARKLINE_DATA[selectedVitalTab].title}
                </Text>
                <Text style={styles.sparklineTarget}>
                  Target: {SPARKLINE_DATA[selectedVitalTab].target}
                </Text>
              </View>
              <View style={styles.activeDayPill}>
                <Text style={styles.activeDayPillText}>
                  {SPARKLINE_DATA[selectedVitalTab].days[selectedDayIndex].day}: {SPARKLINE_DATA[selectedVitalTab].days[selectedDayIndex].val}
                </Text>
              </View>
            </View>

            {/* Bar Chart Bars */}
            <View style={styles.sparklineBarsRow}>
              {SPARKLINE_DATA[selectedVitalTab].days.map((d, idx) => {
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
            </View>
          </View>
        </View>

        {/* Latest Vitals Quick Cards */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderTitleRow}>
            <Ionicons name="pulse" size={18} color={Colors.primaryDark} />
            <Text style={[styles.sectionTitle, seniorMode && styles.seniorSectionTitle]}>
              {language === "hi" ? "ताज़ा वाइटल रीडिंग" : "Latest Vitals"}
            </Text>
          </View>
        </View>

        <View style={styles.vitalsRow}>
          {measurements.slice(0, 2).map((m) => (
            <VitalBadge key={m.id} measurement={m} />
          ))}
        </View>

        {/* Upcoming Doctor Appointment Spotlight Card */}
        {nextAppointment && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderWithoutPadding}>
              <View style={styles.sectionHeaderTitleRow}>
                <Ionicons name="calendar" size={18} color={Colors.secondary} />
                <Text style={[styles.sectionTitle, seniorMode && styles.seniorSectionTitle]}>
                  {language === "hi" ? "आगामी परामर्श" : "Consultation"}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setAddApptModalVisible(true)}
                  style={styles.addApptSmallBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={13} color="#FFFFFF" />
                  <Text style={styles.addApptSmallBtnText}>
                    {language === "hi" ? "जोड़ें" : "Add"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onNavigateTab("timeline")}>
                  <Text style={styles.sectionLink}>
                    {language === "hi" ? "सभी देखें" : "View All"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.appointmentCard, Shadows.card]}>
              <View style={styles.apptTop}>
                {/* Doctor Avatar Image */}
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
                  <Text style={styles.apptFacility}>
                    <Ionicons name="business-outline" size={12} color={Colors.textMuted} />{" "}
                    {nextAppointment.hospital_clinic_name}
                  </Text>
                </View>
              </View>

              {/* Date & Location Pill Bar */}
              <View style={styles.apptScheduleBar}>
                <View style={styles.scheduleItem}>
                  <Ionicons name="calendar-outline" size={14} color={Colors.primaryDeep} />
                  <Text style={styles.scheduleItemText}>Mon, Oct 5 • 10:30 AM</Text>
                </View>
                <View style={styles.scheduleItem}>
                  <Ionicons name="location-outline" size={14} color={Colors.secondaryDark} />
                  <Text style={styles.scheduleItemText}>Sector 44, Gurugram</Text>
                </View>
              </View>

              {nextAppointment.reason && (
                <Text style={styles.apptReason}>
                  <Text style={{ fontWeight: "700" }}>Note: </Text>
                  {nextAppointment.reason}
                </Text>
              )}

              {/* Quick Action Buttons */}
              <View style={styles.apptActions}>
                <TouchableOpacity
                  style={styles.callDoctorBtn}
                  onPress={() => Linking.openURL("tel:+919822334455")}
                  activeOpacity={0.7}
                >
                  <Ionicons name="call" size={15} color={Colors.primaryDeep} />
                  <Text style={styles.callDoctorText}>
                    {language === "hi" ? "कॉल करें" : "Call Clinic"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.mapBtn}
                  onPress={() => onNavigateTab("maps")}
                  activeOpacity={0.7}
                >
                  <Ionicons name="navigate" size={15} color="#FFFFFF" />
                  <Text style={styles.mapBtnText}>
                    {language === "hi" ? "दिशा-निर्देश" : "Directions"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteApptBtn}
                  onPress={() => setApptToDelete(nextAppointment)}
                  activeOpacity={0.7}
                  accessibilityLabel="Cancel consultation"
                >
                  <Ionicons name="trash-outline" size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Today's Family Care Coordination Tasks */}
        {parentTasks.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderWithoutPadding}>
              <View style={styles.sectionHeaderTitleRow}>
                <Ionicons name="checkbox" size={18} color={Colors.primaryDark} />
                <Text style={[styles.sectionTitle, seniorMode && styles.seniorSectionTitle]}>
                  {language === "hi" ? "पारिवारिक देखभाल कार्य" : "Today's Family Tasks"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setActiveScreen("family")}>
                <Text style={styles.sectionLink}>
                  {language === "hi" ? `केयर हब (${parentTasks.length})` : `Care Circle (${parentTasks.length})`}
                </Text>
              </TouchableOpacity>
            </View>

            {parentTasks.slice(0, 2).map((task) => {
              const isCompleted = task.status === "completed";
              return (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.taskItemCard, isCompleted && styles.taskItemCardCompleted]}
                  onPress={() => toggleTaskCompleted(task.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.taskCheckCircle, isCompleted && styles.taskCheckCircleDone]}>
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
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

        {/* Today's Medicine Checklist */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderWithoutPadding}>
            <View style={styles.sectionHeaderTitleRow}>
              <Ionicons name="medkit" size={18} color={Colors.primaryDark} />
              <Text style={[styles.sectionTitle, seniorMode && styles.seniorSectionTitle]}>
                {language === "hi" ? "आज का दवा शेड्यूल" : "Today's Medicine Schedule"}
              </Text>
            </View>
            <TouchableOpacity onPress={() => onNavigateTab("medicines")}>
              <Text style={styles.sectionLink}>
                {language === "hi" ? `प्रबंधन (${medicines.length})` : `Manage (${medicines.length})`}
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
                <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.celebrationTitle}>
                    {language === "hi" ? "दैनिक दवाइयां 100% पूर्ण!" : "100% Medication Adherence Today"}
                  </Text>
                  <Text style={styles.celebrationSub}>
                    {language === "hi"
                      ? `आज की सभी ${totalMeds} दवाइयां समय पर ली गई हैं। फैमिली केयर सर्कल सुरक्षित है।`
                      : `All ${totalMeds} scheduled doses marked taken. Family circle synchronized.`}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          )}

          {medicines.map((med) => (
            <MedicineCard key={med.id} medicine={med} />
          ))}
        </View>

        {/* Recent Medical Documents Preview */}
        <View style={[styles.sectionContainer, { marginBottom: 20 }]}>
          <View style={styles.sectionHeaderWithoutPadding}>
            <View style={styles.sectionHeaderTitleRow}>
              <Ionicons name="folder-open" size={18} color="#6366F1" />
              <Text style={[styles.sectionTitle, seniorMode && styles.seniorSectionTitle]}>
                {language === "hi" ? "हालिया मेडिकल रिकॉर्ड्स" : "Recent Health Records"}
              </Text>
            </View>
            <TouchableOpacity onPress={() => onNavigateTab("documents")}>
              <Text style={styles.sectionLink}>
                {language === "hi" ? `वॉल्ट (${documents.length})` : `Vault (${documents.length})`}
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
                  size={22}
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
                {doc.summary && (
                  <Text numberOfLines={2} style={styles.docSummaryText}>
                    {doc.summary}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
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
        title={language === "hi" ? "परामर्श रद्द करें?" : "Cancel Consultation?"}
        message={
          language === "hi"
            ? `क्या आप निश्चित हैं कि आप ${apptToDelete?.doctor_name} (${apptToDelete?.specialty}) के साथ परामर्श रद्द करना चाहते हैं?`
            : `Are you sure you want to cancel the scheduled visit with ${apptToDelete?.doctor_name} (${apptToDelete?.specialty})? Caregivers will be notified.`
        }
        confirmText={language === "hi" ? "रद्द करें" : "Cancel Visit"}
        cancelText={language === "hi" ? "रखें" : "Keep Visit"}
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

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    paddingBottom: 110,
  },
  scoreContainer: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  scoreCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
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
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scoreValue: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: -1,
  },
  scorePercent: {
    fontSize: 20,
    fontWeight: Typography.weights.semibold,
  },
  scoreStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  scoreStatusPillText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: Typography.weights.bold,
  },
  scoreDescription: {
    color: "#E6FFFA",
    fontSize: Typography.sizes.xs,
    lineHeight: 18,
    marginTop: Spacing.xs,
  },
  quickActionsGrid: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
    gap: 8,
  },
  actionBtnWrapper: {
    flex: 1,
  },
  actionBtnGradient: {
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  actionBtnTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: 0.2,
  },
  sectionContainer: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionHeaderWithoutPadding: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  sectionHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  seniorSectionTitle: {
    fontSize: Typography.seniorSizes.md,
  },
  seniorTitle: {
    fontSize: Typography.seniorSizes.sm,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  addVitalChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(204, 251, 241, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.85)",
  },
  addVitalChipText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDeep,
  },
  vitalsRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    gap: 10,
  },
  appointmentCard: {
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.9)",
    position: "relative",
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  apptTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  doctorAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: Spacing.md,
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
    fontSize: Typography.sizes.md,
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
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.successDark,
  },
  apptSpecialty: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: Typography.weights.semibold,
  },
  apptFacility: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  apptScheduleBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(241, 245, 249, 0.75)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  scheduleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  scheduleItemText: {
    fontSize: 11,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  apptReason: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    lineHeight: 16,
  },
  apptActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: Spacing.md,
  },
  callDoctorBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(204, 251, 241, 0.8)",
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  callDoctorText: {
    fontSize: 12,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDeep,
  },
  mapBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.primaryDark,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    ...Shadows.glowTeal,
  },
  mapBtnText: {
    fontSize: 12,
    fontWeight: Typography.weights.bold,
    color: "#FFFFFF",
  },
  deleteApptBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(254, 226, 226, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(252, 165, 165, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  addApptSmallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: Colors.secondaryDark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  addApptSmallBtnText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: "#FFFFFF",
  },
  docPreviewCard: {
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.9)",
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  docIconBox: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(204, 251, 241, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
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
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 6,
  },
  ocrChip: {
    backgroundColor: "rgba(243, 232, 255, 0.85)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  ocrChipText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: "#7E22CE",
  },
  docDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  docSummaryText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  scoreRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  expandChevron: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  expandedWellnessBox: {
    marginTop: Spacing.sm,
  },
  expandedDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
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
    fontSize: 12,
    fontWeight: Typography.weights.bold,
    color: "#FFFFFF",
  },
  expandedMetricLbl: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.8)",
  },
  vitalTabsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: Spacing.sm,
  },
  vitalTabBtn: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  vitalTabBtnActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  vitalTabBtnLabel: {
    fontSize: 10,
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
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.95)",
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
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDeep,
  },
  sparklineBarsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 70,
    paddingTop: 8,
  },
  sparklineCol: {
    alignItems: "center",
    width: 32,
  },
  sparklineBarTrack: {
    width: 14,
    height: 50,
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
  taskItemCard: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  taskItemCardCompleted: {
    backgroundColor: "rgba(240, 253, 250, 0.85)",
    borderColor: Colors.successLight,
  },
  taskCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    width: 8,
    height: 8,
    borderRadius: 4,
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
    fontSize: 11,
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
    fontSize: 9,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  taskPriorityTextHigh: {
    color: Colors.emergencyDark,
  },
  allMedsCelebration: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  celebrationGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: Spacing.md,
  },
  celebrationTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: "#FFFFFF",
  },
  celebrationSub: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
  },
});

