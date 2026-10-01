import React from "react";
import { Platform, ScrollView, Share, Text, TouchableOpacity, View } from "react-native";
import { Activity, Calendar, CheckCircle2, FileText, Pill, Share2, Sparkles, Stethoscope, X, Printer } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useApp } from "../context/AppContext";
import { BorderRadius, Colors, Gradients, Shadows, Spacing, Typography, createThemedStyles } from "../theme";
import { SwipeableBottomSheet } from "./SwipeableBottomSheet";

const createReportFileName = () => `care-report-${Date.now()}.html`;

export const HealthReportModal: React.FC = () => {
  const { activeParent, reportModalVisible, setReportModalVisible, medicines, appointments, documents, measurements, tasks, seniorMode, language } = useApp();
  const period = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date());
  const activeMedicines = medicines.filter((medicine) => medicine.is_active);
  const upcoming = appointments.filter((appointment) => appointment.status === "upcoming").sort((a, b) => Date.parse(a.appointment_date) - Date.parse(b.appointment_date));
  const latestMeasurements = [...measurements].sort((a, b) => Date.parse(b.recorded_at) - Date.parse(a.recorded_at)).slice(0, 4);
  const completedTasks = tasks.filter((task) => task.status === "completed").length;

  const isHindi = language === "hi";

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

  const exportReportFile = async () => {
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ParentPulse Care Summary - ${activeParent.full_name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 32px; color: #0F172A; max-width: 820px; margin: 0 auto; line-height: 1.5; }
    .header { border-bottom: 3px solid #0D9488; padding-bottom: 16px; margin-bottom: 24px; }
    h1 { color: #0F766E; margin: 0 0 4px 0; font-size: 26px; }
    .meta { color: #64748B; font-size: 14px; margin: 0; }
    .grid { display: flex; gap: 14px; margin-bottom: 26px; }
    .card { flex: 1; padding: 14px; background: #F8FAFC; border-radius: 10px; border: 1px solid #E2E8F0; text-align: center; }
    .val { font-size: 26px; font-weight: bold; color: #0D9488; }
    .lbl { font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
    h2 { color: #1E293B; font-size: 17px; margin-top: 26px; margin-bottom: 10px; border-bottom: 1px solid #CBD5E1; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #F1F5F9; font-size: 13px; }
    th { background: #F1F5F9; color: #334155; font-weight: 600; }
    .empty { color: #94A3B8; font-style: italic; font-size: 13px; padding: 8px 0; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #E2E8F0; font-size: 11px; color: #94A3B8; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>ParentPulse Care Summary</h1>
    <p class="meta">Patient: <strong>${activeParent.full_name}</strong> · Period: <strong>${period}</strong> · Generated on ${new Date().toLocaleDateString()}</p>
  </div>

  <div class="grid">
    <div class="card"><div class="val">${activeMedicines.length}</div><div class="lbl">Active Medicines</div></div>
    <div class="card"><div class="val">${upcoming.length}</div><div class="lbl">Upcoming Visits</div></div>
    <div class="card"><div class="val">${documents.length}</div><div class="lbl">Medical Records</div></div>
    <div class="card"><div class="val">${completedTasks}</div><div class="lbl">Care Tasks Done</div></div>
  </div>

  <h2>Upcoming Appointments</h2>
  ${upcoming.length === 0 ? '<div class="empty">No upcoming appointments recorded.</div>' : `
  <table>
    <thead><tr><th>Doctor</th><th>Specialty</th><th>Date & Time</th><th>Facility</th></tr></thead>
    <tbody>
      ${upcoming.map(a => `<tr><td>${a.doctor_name}</td><td>${a.specialty}</td><td>${new Date(a.appointment_date).toLocaleString()}</td><td>${a.hospital_clinic_name}</td></tr>`).join('')}
    </tbody>
  </table>`}

  <h2>Latest Health Vitals</h2>
  ${latestMeasurements.length === 0 ? '<div class="empty">No health measurements recorded.</div>' : `
  <table>
    <thead><tr><th>Vital Metric</th><th>Value</th><th>Recorded At</th></tr></thead>
    <tbody>
      ${latestMeasurements.map(m => `<tr><td>${m.vital_type.replaceAll('_', ' ')}</td><td><strong>${m.value_numeric}${m.value_secondary != null ? '/' + m.value_secondary : ''} ${m.unit}</strong></td><td>${m.recorded_at}</td></tr>`).join('')}
    </tbody>
  </table>`}

  <h2>Active Prescription Medicines</h2>
  ${activeMedicines.length === 0 ? '<div class="empty">No active medicines recorded.</div>' : `
  <table>
    <thead><tr><th>Medicine</th><th>Dosage</th><th>Schedule Times</th><th>Instructions</th></tr></thead>
    <tbody>
      ${activeMedicines.map(m => `<tr><td><strong>${m.name}</strong></td><td>${m.dosage}</td><td>${m.schedule_times.join(', ')}</td><td>${m.instructions.replaceAll('_', ' ')}</td></tr>`).join('')}
    </tbody>
  </table>`}

  <div class="footer">
    This clinical summary document is generated from verified records stored in ParentPulse for remote family care coordination. It does not replace independent professional medical advice.
  </div>
</body>
</html>`;

    if (Platform.OS === "web") {
      await Share.share({ title: `ParentPulse Care Report - ${activeParent.full_name}`, message: summary });
      return;
    }

    try {
      const file = new File(Paths.cache, createReportFileName());
      file.create({ overwrite: true });
      file.write(htmlContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          dialogTitle: `Print or Export Care Report (${activeParent.full_name})`,
          mimeType: "text/html",
          UTI: "public.html",
        });
      } else {
        await Share.share({ message: summary });
      }
    } catch {
      await Share.share({ message: summary });
    }
  };

  return <SwipeableBottomSheet visible={reportModalVisible} onClose={() => setReportModalVisible(false)} maxHeight="92%" testID="health-report-modal">
    <LinearGradient colors={["#0F766E", "#0369A1"]} style={styles.hero}>
      <View style={styles.heroIcon}><Sparkles size={20} color="#FFFFFF" /></View>
      <View style={styles.heroCopy}><Text style={[styles.title, seniorMode && { fontSize: 23 }]}>{isHindi ? "मासिक केयर रिपोर्ट" : "Live Care Summary"}</Text><Text style={styles.subtitle}>{activeParent.full_name} · {period}</Text></View>
      <TouchableOpacity style={styles.close} onPress={() => setReportModalVisible(false)} accessibilityLabel="Close report"><X size={21} color="#FFFFFF" /></TouchableOpacity>
    </LinearGradient>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.notice}>{isHindi ? "यह रिपोर्ट पेरेंटपल्स में संग्रहीत वर्तमान रिकॉर्ड्स का सारांश है।" : "This report summarizes records currently stored in ParentPulse. It does not calculate a wellness score or make a diagnosis."}</Text>
      <View style={styles.grid}>
        <Metric icon={<Pill size={18} color={Colors.primaryDark} />} value={activeMedicines.length} label={isHindi ? "सक्रिय दवाइयां" : "Active medicines"} />
        <Metric icon={<Calendar size={18} color="#0369A1" />} value={upcoming.length} label={isHindi ? "आगामी विज़िट" : "Upcoming visits"} />
        <Metric icon={<FileText size={18} color="#7C3AED" />} value={documents.length} label={isHindi ? "दस्तावेज़" : "Documents"} />
        <Metric icon={<CheckCircle2 size={18} color={Colors.success} />} value={completedTasks} label={isHindi ? "पूर्ण कार्य" : "Tasks completed"} />
      </View>

      <Section icon={<Stethoscope size={17} color="#0369A1" />} title={isHindi ? "आगामी अपॉइंटमेंट्स" : "Upcoming appointments"}>
        {upcoming.length === 0 ? <Empty text={isHindi ? "कोई आगामी अपॉइंटमेंट नहीं है।" : "No upcoming appointments recorded."} /> : upcoming.slice(0, 5).map((item) => <Row key={item.id} title={`${item.doctor_name} · ${item.specialty}`} detail={`${new Date(item.appointment_date).toLocaleString()} · ${item.hospital_clinic_name}`} />)}
      </Section>

      <Section icon={<Activity size={17} color="#7C3AED" />} title={isHindi ? "नवीनतम स्वास्थ्य माप" : "Latest measurements"}>
        {latestMeasurements.length === 0 ? <Empty text={isHindi ? "कोई माप दर्ज नहीं है।" : "No measurements recorded."} /> : latestMeasurements.map((item) => <Row key={item.id} title={item.vital_type.replaceAll("_", " ")} detail={`${item.value_numeric}${item.value_secondary != null ? `/${item.value_secondary}` : ""} ${item.unit} · ${item.recorded_at}`} />)}
      </Section>

      <Section icon={<Pill size={17} color={Colors.primaryDark} />} title={isHindi ? "सक्रिय दवाइयां" : "Active medicines"}>
        {activeMedicines.length === 0 ? <Empty text={isHindi ? "कोई सक्रिय दवा दर्ज नहीं है।" : "No active medicines recorded."} /> : activeMedicines.map((item) => <Row key={item.id} title={`${item.name} · ${item.dosage}`} detail={`${item.schedule_times.join(", ")} · ${item.instructions.replaceAll("_", " ")}`} />)}
      </Section>

      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.shareButton, { flex: 1 }]} onPress={() => void exportReportFile()}>
          <LinearGradient colors={Gradients.primary} style={styles.shareGradient}>
            <Printer size={17} color="#FFFFFF" />
            <Text style={styles.shareText}>{isHindi ? "रिपोर्ट प्रिंट / पीडीएफ" : "Printable Report / PDF"}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.shareButton, { flex: 1 }]} onPress={() => void share()}>
          <LinearGradient colors={Gradients.doctor} style={styles.shareGradient}>
            <Share2 size={17} color="#FFFFFF" />
            <Text style={styles.shareText}>{isHindi ? "टेक्स्ट सारांश" : "Share Summary"}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  </SwipeableBottomSheet>;
};

const Metric = ({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) => <View style={[styles.metric, Shadows.card]}>{icon}<Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => <View style={[styles.section, Shadows.card]}><View style={styles.sectionTitle}>{icon}<Text style={styles.sectionTitleText}>{title}</Text></View>{children}</View>;
const Row = ({ title, detail }: { title: string; detail: string }) => <View style={styles.row}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowDetail}>{detail}</Text></View>;
const Empty = ({ text }: { text: string }) => <Text style={styles.empty}>{text}</Text>;

const styles = createThemedStyles({
  hero: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: Spacing.lg, padding: 17, borderRadius: BorderRadius.xl },
  heroIcon: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,.16)" },
  heroCopy: { flex: 1 }, title: { color: "#FFFFFF", fontSize: 19, fontWeight: Typography.weights.extraBold }, subtitle: { color: "#CCFBF1", fontSize: 11, marginTop: 4 },
  close: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,.14)" },
  content: { padding: Spacing.lg, paddingBottom: 42 }, notice: { fontSize: 11, lineHeight: 17, color: Colors.textMuted, textAlign: "center", marginBottom: 15 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 9 }, metric: { width: "48%", padding: 14, borderRadius: 18, backgroundColor: "rgba(255, 255, 255, 0.72)", borderWidth: 1.2, borderColor: "rgba(255, 255, 255, 0.85)" }, metricValue: { fontSize: 22, fontWeight: "900", color: Colors.textPrimary, marginTop: 9 }, metricLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  section: { marginTop: 13, padding: 15, borderRadius: 20, backgroundColor: "rgba(255, 255, 255, 0.72)", borderWidth: 1.2, borderColor: "rgba(255, 255, 255, 0.85)" }, sectionTitle: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }, sectionTitleText: { fontSize: 13, fontWeight: "900", color: Colors.textPrimary },
  row: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border }, rowTitle: { fontSize: 12, fontWeight: "800", color: Colors.textPrimary, textTransform: "capitalize" }, rowDetail: { fontSize: 10, lineHeight: 15, color: Colors.textMuted, marginTop: 3 }, empty: { fontSize: 11, color: Colors.textMuted, paddingVertical: 10 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 17 },
  shareButton: { overflow: "hidden", borderRadius: 18 }, shareGradient: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 10 }, shareText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
});
