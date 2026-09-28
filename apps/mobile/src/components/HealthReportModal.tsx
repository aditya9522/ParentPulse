import React from "react";
import { Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Activity, Calendar, CheckCircle2, FileText, Pill, Share2, Sparkles, Stethoscope, X } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useApp } from "../context/AppContext";
import { BorderRadius, Colors, Gradients, Shadows, Spacing, Typography } from "../theme";
import { SwipeableBottomSheet } from "./SwipeableBottomSheet";

export const HealthReportModal: React.FC = () => {
  const { activeParent, reportModalVisible, setReportModalVisible, medicines, appointments, documents, measurements, tasks, seniorMode } = useApp();
  const period = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date());
  const activeMedicines = medicines.filter((medicine) => medicine.is_active);
  const upcoming = appointments.filter((appointment) => appointment.status === "upcoming").sort((a, b) => Date.parse(a.appointment_date) - Date.parse(b.appointment_date));
  const latestMeasurements = [...measurements].sort((a, b) => Date.parse(b.recorded_at) - Date.parse(a.recorded_at)).slice(0, 4);
  const completedTasks = tasks.filter((task) => task.status === "completed").length;

  const summary = [
    `ParentPulse care summary for ${activeParent.full_name} · ${period}`,
    `${activeMedicines.length} active medicines`,
    `${upcoming.length} upcoming appointments`,
    `${documents.length} medical documents`,
    `${completedTasks} completed care tasks`,
    ...latestMeasurements.map((item) => `${item.vital_type.replaceAll("_", " ")}: ${item.value_numeric}${item.value_secondary != null ? `/${item.value_secondary}` : ""} ${item.unit} (${item.recorded_at})`),
  ].join("\n");

  const share = async () => {
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Share.share({ message: summary });
  };

  return <SwipeableBottomSheet visible={reportModalVisible} onClose={() => setReportModalVisible(false)} maxHeight="92%" testID="health-report-modal">
    <LinearGradient colors={["#0F766E", "#0369A1"]} style={styles.hero}>
      <View style={styles.heroIcon}><Sparkles size={20} color="#FFFFFF" /></View>
      <View style={styles.heroCopy}><Text style={[styles.title, seniorMode && { fontSize: 23 }]}>Live care summary</Text><Text style={styles.subtitle}>{activeParent.full_name} · {period}</Text></View>
      <TouchableOpacity style={styles.close} onPress={() => setReportModalVisible(false)} accessibilityLabel="Close report"><X size={21} color="#FFFFFF" /></TouchableOpacity>
    </LinearGradient>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.notice}>This report summarizes records currently stored in ParentPulse. It does not calculate a wellness score or make a diagnosis.</Text>
      <View style={styles.grid}>
        <Metric icon={<Pill size={18} color={Colors.primaryDark} />} value={activeMedicines.length} label="Active medicines" />
        <Metric icon={<Calendar size={18} color="#0369A1" />} value={upcoming.length} label="Upcoming visits" />
        <Metric icon={<FileText size={18} color="#7C3AED" />} value={documents.length} label="Documents" />
        <Metric icon={<CheckCircle2 size={18} color={Colors.success} />} value={completedTasks} label="Tasks completed" />
      </View>

      <Section icon={<Stethoscope size={17} color="#0369A1" />} title="Upcoming appointments">
        {upcoming.length === 0 ? <Empty text="No upcoming appointments recorded." /> : upcoming.slice(0, 5).map((item) => <Row key={item.id} title={`${item.doctor_name} · ${item.specialty}`} detail={`${new Date(item.appointment_date).toLocaleString()} · ${item.hospital_clinic_name}`} />)}
      </Section>

      <Section icon={<Activity size={17} color="#7C3AED" />} title="Latest measurements">
        {latestMeasurements.length === 0 ? <Empty text="No measurements recorded." /> : latestMeasurements.map((item) => <Row key={item.id} title={item.vital_type.replaceAll("_", " ")} detail={`${item.value_numeric}${item.value_secondary != null ? `/${item.value_secondary}` : ""} ${item.unit} · ${item.recorded_at}`} />)}
      </Section>

      <Section icon={<Pill size={17} color={Colors.primaryDark} />} title="Active medicines">
        {activeMedicines.length === 0 ? <Empty text="No active medicines recorded." /> : activeMedicines.map((item) => <Row key={item.id} title={`${item.name} · ${item.dosage}`} detail={`${item.schedule_times.join(", ")} · ${item.instructions.replaceAll("_", " ")}`} />)}
      </Section>

      <TouchableOpacity style={styles.shareButton} onPress={() => void share()}><LinearGradient colors={Gradients.primary} style={styles.shareGradient}><Share2 size={18} color="#FFFFFF" /><Text style={styles.shareText}>Share factual summary</Text></LinearGradient></TouchableOpacity>
    </ScrollView>
  </SwipeableBottomSheet>;
};

const Metric = ({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) => <View style={[styles.metric, Shadows.card]}>{icon}<Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => <View style={[styles.section, Shadows.card]}><View style={styles.sectionTitle}>{icon}<Text style={styles.sectionTitleText}>{title}</Text></View>{children}</View>;
const Row = ({ title, detail }: { title: string; detail: string }) => <View style={styles.row}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowDetail}>{detail}</Text></View>;
const Empty = ({ text }: { text: string }) => <Text style={styles.empty}>{text}</Text>;

const styles = StyleSheet.create({
  hero: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: Spacing.lg, padding: 17, borderRadius: BorderRadius.xl },
  heroIcon: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,.16)" },
  heroCopy: { flex: 1 }, title: { color: "#FFFFFF", fontSize: 19, fontWeight: Typography.weights.extraBold }, subtitle: { color: "#CCFBF1", fontSize: 11, marginTop: 4 },
  close: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,.14)" },
  content: { padding: Spacing.lg, paddingBottom: 42 }, notice: { fontSize: 11, lineHeight: 17, color: Colors.textMuted, textAlign: "center", marginBottom: 15 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 9 }, metric: { width: "48%", padding: 14, borderRadius: 18, backgroundColor: "#FFFFFF" }, metricValue: { fontSize: 22, fontWeight: "900", color: Colors.textPrimary, marginTop: 9 }, metricLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  section: { marginTop: 13, padding: 15, borderRadius: 20, backgroundColor: "#FFFFFF" }, sectionTitle: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }, sectionTitleText: { fontSize: 13, fontWeight: "900", color: Colors.textPrimary },
  row: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border }, rowTitle: { fontSize: 12, fontWeight: "800", color: Colors.textPrimary, textTransform: "capitalize" }, rowDetail: { fontSize: 10, lineHeight: 15, color: Colors.textMuted, marginTop: 3 }, empty: { fontSize: 11, color: Colors.textMuted, paddingVertical: 10 },
  shareButton: { overflow: "hidden", borderRadius: 18, marginTop: 17 }, shareGradient: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 }, shareText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
});
