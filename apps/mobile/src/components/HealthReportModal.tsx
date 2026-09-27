// apps/mobile/src/components/HealthReportModal.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Share,
  Platform,
} from "react-native";
import { SwipeableBottomSheet } from "./SwipeableBottomSheet";
import {
  FileText,
  Sparkles,
  Share2,
  Download,
  X,
  CheckCircle2,
  Calendar,
  Pill,
  Activity,
  Stethoscope,
  TrendingUp,
  AlertCircle,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useApp } from "../context/AppContext";
import { Colors, Typography, Spacing, Shadows, BorderRadius, Gradients } from "../theme";

export const HealthReportModal: React.FC = () => {
  const {
    activeParent,
    reportModalVisible,
    setReportModalVisible,
    medicines,
    appointments,
    documents,
    measurements,
    tasks,
    language,
    seniorMode,
  } = useApp();

  const isHindi = language === "hi";

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(style);
      }
    } catch {}
  };

  const handleShareReport = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const summaryText = isHindi
      ? `पैरेंटपल्स मासिक स्वास्थ्य सारांश - ${activeParent.full_name} (सितंबर 2026):\n• स्वास्थ्य सूचकांक: 94% स्थिर\n• निर्धारित दवाइयां: 100% समय पर\n• आगामी परामर्श: डॉ. अरुण वर्मा (5 अक्टूबर)\n• वाइटल: बीपी 126/80 mmHg, शुगर 114 mg/dL\nसंपूर्ण पारिवारिक रिपोर्ट देखने के लिए: https://parentpulse.care/report/${activeParent.id}`
      : `ParentPulse Monthly Health Report - ${activeParent.full_name} (September 2026):\n• Health Stability Score: 94%\n• Medication Adherence: 100% on schedule\n• Next Visit: Dr. Arun Verma (Oct 5)\n• Key Vitals: Resting BP 126/80 mmHg, Fasting Glucose 114 mg/dL\nAccess complete brief: https://parentpulse.care/report/${activeParent.id}`;

    try {
      await Share.share({ message: summaryText });
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <SwipeableBottomSheet
      visible={reportModalVisible}
      onClose={() => setReportModalVisible(false)}
      maxHeight="92%"
      testID="health-report-modal"
    >
          {/* Top Gradient Header */}
          <LinearGradient
            colors={["#0F766E", "#0369A1"]}
            style={styles.topBar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.topBarContent}>
              <View style={styles.sparkleBox}>
                <Sparkles size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.topTitle, seniorMode && styles.seniorTopTitle]}>
                  {isHindi ? "मासिक परिवार स्वास्थ्य रिपोर्ट" : "Monthly Health Summary"}
                </Text>
                <Text style={styles.topSub}>
                  {isHindi
                    ? `${activeParent.full_name} • सितंबर 2026 सारांश`
                    : `Clinical Overview for ${activeParent.full_name} • September 2026`}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setReportModalVisible(false)}
                style={styles.closeBtn}
              >
                <X size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Executive Clinical Highlight Card */}
          <View style={[styles.card, Shadows.cardElevated]}>
            <View style={styles.highlightTopRow}>
              <View>
                <Text style={styles.scoreLabel}>
                  {isHindi ? "समग्र स्वास्थ्य स्थिरता सूचकांक" : "Overall Wellness Index"}
                </Text>
                <Text style={styles.scoreNumber}>94%</Text>
              </View>
              <View style={styles.statusPill}>
                <CheckCircle2 size={14} color="#D1FAE5" />
                <Text style={styles.statusPillText}>{isHindi ? "नियंत्रित" : "Optimal"}</Text>
              </View>
            </View>

            <Text style={styles.summaryParagraph}>
              {isHindi
                ? `${activeParent.full_name} की पुरानी बीमारियां (टाइप 2 डायबिटीज एवं हाइपरटेंशन) वर्तमान में टेल्मिसार्टन 40mg और मेटफ़ॉर्मिन SR के नियमित सेवन से पूरी तरह स्थिर हैं। कोई आपातकालीन स्थिति दर्ज नहीं की गई।`
                : `${activeParent.full_name}'s chronic conditions (Type 2 Diabetes & Hypertension) are currently well managed with Telmisartan 40mg and Metformin SR. Morning fasting sugars and resting blood pressure readings remain within target ranges.`}
            </Text>
          </View>

          {/* Quick Metrics Grid */}
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, Shadows.card]}>
              <Pill size={18} color={Colors.primary} />
              <Text style={styles.metricVal}>100%</Text>
              <Text style={styles.metricLabel}>{isHindi ? "दवा अनुपालन" : "Med Adherence"}</Text>
            </View>

            <View style={[styles.metricCard, Shadows.card]}>
              <Stethoscope size={18} color={Colors.secondary} />
              <Text style={styles.metricVal}>{appointments.length}</Text>
              <Text style={styles.metricLabel}>{isHindi ? "परामर्श" : "Consultations"}</Text>
            </View>

            <View style={[styles.metricCard, Shadows.card]}>
              <FileText size={18} color="#7C3AED" />
              <Text style={styles.metricVal}>{documents.length}</Text>
              <Text style={styles.metricLabel}>{isHindi ? "नए रिकॉर्ड्स" : "Documents"}</Text>
            </View>

            <View style={[styles.metricCard, Shadows.card]}>
              <CheckCircle2 size={18} color={Colors.success} />
              <Text style={styles.metricVal}>{tasks.filter((t) => t.status === "completed").length}</Text>
              <Text style={styles.metricLabel}>{isHindi ? "पूर्ण कार्य" : "Care Tasks"}</Text>
            </View>
          </View>

          {/* Key Doctor Consultations & Follow-Ups */}
          <View style={[styles.sectionCard, Shadows.card]}>
            <View style={styles.sectionHeader}>
              <Stethoscope size={16} color={Colors.secondaryDark} />
              <Text style={styles.sectionTitle}>
                {isHindi ? "चिकित्सक परामर्श एवं फॉलो-अप" : "Doctor Visits & Follow-Ups"}
              </Text>
            </View>

            <View style={styles.reportRow}>
              <Text style={styles.rowBullet}>•</Text>
              <Text style={styles.rowText}>
                <Text style={{ fontWeight: "700" }}>15 Sep 2026: </Text>
                Dr. Arun Verma (Cardiology, Fortis) - Blood pressure resting optimal at 126/80. Advised 30 min brisk morning walk.
              </Text>
            </View>

            <View style={styles.reportRow}>
              <Text style={styles.rowBullet}>•</Text>
              <Text style={styles.rowText}>
                <Text style={{ fontWeight: "700" }}>Upcoming 05 Oct 2026: </Text>
                Quarterly Blood Pressure & ECG follow-up at Fortis Sector 44.
              </Text>
            </View>
          </View>

          {/* Diagnostic Milestones */}
          <View style={[styles.sectionCard, Shadows.card]}>
            <View style={styles.sectionHeader}>
              <Activity size={16} color="#7C3AED" />
              <Text style={styles.sectionTitle}>
                {isHindi ? "जांच परिणाम एवं निष्कर्ष" : "Diagnostic Test Highlights"}
              </Text>
            </View>

            <View style={styles.reportRow}>
              <Text style={styles.rowBullet}>•</Text>
              <Text style={styles.rowText}>
                <Text style={{ fontWeight: "700" }}>HbA1c Glycated Hemoglobin: </Text>
                6.8% (Target &lt; 7.0 for age 72). Stable metabolic control.
              </Text>
            </View>

            <View style={styles.reportRow}>
              <Text style={styles.rowBullet}>•</Text>
              <Text style={styles.rowText}>
                <Text style={{ fontWeight: "700" }}>Fasting Blood Glucose: </Text>
                114 mg/dL (Normal fasting glycemic threshold).
              </Text>
            </View>

            <View style={styles.reportRow}>
              <Text style={styles.rowBullet}>•</Text>
              <Text style={styles.rowText}>
                <Text style={{ fontWeight: "700" }}>Resting ECG: </Text>
                Sinus rhythm at 72 bpm. Normal axis, no acute ischemia.
              </Text>
            </View>
          </View>

          {/* Active Medicines & Inventory Status */}
          <View style={[styles.sectionCard, Shadows.card]}>
            <View style={styles.sectionHeader}>
              <Pill size={16} color={Colors.primaryDark} />
              <Text style={styles.sectionTitle}>
                {isHindi ? "सक्रिय दवाइयां व स्टॉक स्थिति" : "Active Medications & Stock"}
              </Text>
            </View>

            {medicines.map((med) => (
              <View key={med.id} style={styles.medRow}>
                <Text style={styles.medName}>
                  {med.name} ({med.dosage})
                </Text>
                <Text style={styles.medInstruction}>
                  {med.schedule_times.join(", ")} • {med.instructions.replace("_", " ")}
                </Text>
                <Text style={[styles.inventoryNotice, med.current_inventory <= med.refill_alert_threshold && styles.inventoryLow]}>
                  Stock: {med.current_inventory} days remaining
                </Text>
              </View>
            ))}
          </View>

          {/* Action Sharing Buttons */}
          <View style={styles.shareButtonsRow}>
            <TouchableOpacity
              style={styles.primaryShareBtn}
              onPress={handleShareReport}
              activeOpacity={0.8}
            >
              <LinearGradient colors={Gradients.primary} style={styles.btnGradient}>
                <Share2 size={16} color="#FFFFFF" />
                <Text style={styles.btnGradientText}>
                  {isHindi ? "परिवार व डॉक्टर को रिपोर्ट भेजें" : "Share Clinical Report"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
    </SwipeableBottomSheet>
  );
};

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  topBarContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  sparkleBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  topTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extraBold,
    color: "#FFFFFF",
  },
  seniorTopTitle: {
    fontSize: Typography.seniorSizes.md,
  },
  topSub: {
    fontSize: Typography.sizes.xxs,
    color: "#CCFBF1",
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  highlightTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weights.semibold,
  },
  scoreNumber: {
    fontSize: Typography.sizes.display,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  statusPillText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: Typography.weights.bold,
  },
  summaryParagraph: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 6,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: Spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricVal: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: "center",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  reportRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  rowBullet: {
    fontSize: 16,
    color: Colors.primaryDark,
    marginRight: 6,
    lineHeight: 18,
  },
  rowText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  medRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  medName: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  medInstruction: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  inventoryNotice: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  inventoryLow: {
    color: Colors.emergencyDark,
    fontWeight: Typography.weights.bold,
  },
  shareButtonsRow: {
    marginTop: 8,
    marginBottom: 20,
  },
  primaryShareBtn: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  btnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
  },
  btnGradientText: {
    color: "#FFFFFF",
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
});
