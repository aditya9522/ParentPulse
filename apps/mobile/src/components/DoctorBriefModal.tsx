// apps/mobile/src/components/DoctorBriefModal.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share,
  Image,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import {
  FileText,
  QrCode,
  Share2,
  Clock,
  Lock,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Stethoscope,
  ChevronRight,
} from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { Colors, Typography, Spacing, Shadows, Gradients } from "../theme";
import { SwipeableBottomSheet } from "./SwipeableBottomSheet";

const doctorAvatarImg = require("../../assets/doctor_avatar.jpg");

export const DoctorBriefModal: React.FC = () => {
  const {
    activeParent,
    medicines,
    documents,
    doctorShareModalVisible,
    setDoctorShareModalVisible,
    seniorMode,
    language,
  } = useApp();

  const [shareScope, setShareScope] = useState<"summary_only" | "full_history">("summary_only");
  const [copied, setCopied] = useState(false);
  const expiryHours = 72;
  const shareToken = "dr_" + activeParent.id.slice(0, 12);
  const shareUrl = `https://parentpulse.care/share/brief/${shareToken}`;

  const isHindi = language === "hi";

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(style);
      }
    } catch {
      // Graceful fallback
    }
  };

  const onShareLink = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: isHindi
          ? `पैरेंटपल्स डॉक्टर संक्षिप्त रिपोर्ट - ${activeParent.full_name}:\nपरामर्श सारांश एवं लैब रिपोर्ट देखें (${expiryHours} घंटे में समाप्त):\n${shareUrl}`
          : `ParentPulse Doctor Brief for ${activeParent.full_name}:\nView consultation summary & reports (expiring in ${expiryHours}h):\n${shareUrl}`,
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      console.warn(e);
    }
  };

  const doctor = activeParent.primary_doctors[0] || {
    name: "Dr. Arun Verma",
    specialty: "Interventional Cardiology",
    hospital_or_clinic: "Fortis Memorial Research Institute",
  };

  return (
    <SwipeableBottomSheet
      visible={doctorShareModalVisible}
      onClose={() => setDoctorShareModalVisible(false)}
    >
      {/* Top Header */}
      <View style={styles.topBar}>
            <View style={styles.topTitleRow}>
              <View style={styles.topIconCircle}>
                <Stethoscope size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>
                  {isHindi ? "डॉक्टर परामर्श संक्षिप्त" : "Doctor Consultation Brief"}
                </Text>
                <Text style={styles.headerSub}>
                  {isHindi ? "सुरक्षित 72 घंटे का QR टोकन" : "Encrypted 72-Hour QR Token"}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic();
                setDoctorShareModalVisible(false);
              }}
              style={styles.closeBtn}
              activeOpacity={0.8}
            >
              <X size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Informative Security Banner */}
          <View style={styles.securityBanner}>
            <Lock size={15} color="#0D9488" style={{ marginTop: 2 }} />
            <Text style={styles.desc}>
              {isHindi
                ? "अस्पताल के डॉक्टरों को पारिवारिक खाता दिखाए बिना केवल पढ़ने योग्य एक्सेस दें। यह लिंक 72 घंटों में स्वतः समाप्त हो जाता है।"
                : "Give attending physicians instant, secure, read-only access to vital records without exposing family credentials. Access automatically expires in 72 hours."}
            </Text>
          </View>

          {/* Scope Selection */}
          <View style={styles.scopeContainer}>
            <Text style={styles.scopeHeading}>
              {isHindi ? "साझा करने का दायरा चुनें:" : "Select Sharing Scope:"}
            </Text>
            <View style={styles.scopeRow}>
              <TouchableOpacity
                style={[styles.scopeBtn, shareScope === "summary_only" && styles.scopeBtnActive]}
                onPress={() => {
                  triggerHaptic();
                  setShareScope("summary_only");
                }}
                activeOpacity={0.85}
              >
                <FileText
                  size={14}
                  color={shareScope === "summary_only" ? Colors.primaryDark : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.scopeText,
                    shareScope === "summary_only" && styles.scopeTextActive,
                  ]}
                >
                  {isHindi ? "केवल सारांश" : "Summary Only"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.scopeBtn, shareScope === "full_history" && styles.scopeBtnActive]}
                onPress={() => {
                  triggerHaptic();
                  setShareScope("full_history");
                }}
                activeOpacity={0.85}
              >
                <ShieldCheck
                  size={14}
                  color={shareScope === "full_history" ? Colors.primaryDark : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.scopeText,
                    shareScope === "full_history" && styles.scopeTextActive,
                  ]}
                >
                  {isHindi ? "संपूर्ण रिकॉर्ड एवं लैब्स" : "Full Records & Labs"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* QR Code Presentation Box */}
          <View style={[styles.qrCard, Shadows.cardElevated]}>
            <View style={styles.qrCodeBox}>
              <View style={styles.qrIconGlow}>
                <QrCode size={56} color={Colors.primaryDark} strokeWidth={1.8} />
              </View>
              <Text style={styles.qrLabel}>
                {isHindi ? "सुरक्षित समाप्ति QR कोड" : "SECURE EXPIRING QR TOKEN"}
              </Text>
              <View style={styles.expiryBadge}>
                <Clock size={12} color="#D97706" />
                <Text style={styles.qrExpiry}>
                  {isHindi ? "वैधता: अगले 72 घंटे" : "Valid for next 72:00:00 hrs"}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.shareActionBtn} onPress={onShareLink} activeOpacity={0.85}>
              <LinearGradient
                colors={Gradients.teal}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shareGradient}
              >
                <Share2 size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.shareActionText}>
                  {copied
                    ? isHindi
                      ? "लिंक कॉपी हो गया!"
                      : "Link Copied!"
                    : isHindi
                      ? "डॉक्टर के साथ लिंक साझा करें"
                      : "Share Expiring Link with Doctor"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Attending Doctor Profile Card */}
          <View style={[styles.doctorHeaderCard, Shadows.card]}>
            <Image source={doctorAvatarImg} style={styles.doctorAvatar} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.verifiedRow}>
                <Text style={styles.doctorName}>{doctor.name}</Text>
                <UserCheck size={15} color={Colors.primary} style={{ marginLeft: 4 }} />
              </View>
              <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
              <Text style={styles.doctorHospital}>{doctor.hospital_or_clinic}</Text>
            </View>
          </View>

          {/* Consultation Summary Preview */}
          <Text style={[styles.previewHeading, seniorMode && styles.seniorPreviewHeading]}>
            {isHindi ? "क्लिनिकल सारांश पूर्वावलोकन" : "Clinical Brief Letterhead"}
          </Text>

          <View style={[styles.previewCard, Shadows.card]}>
            <View style={styles.previewSection}>
              <Text style={styles.previewLabel}>
                {isHindi ? "मरीज़ और एलर्जी" : "PATIENT & ALLERGIES"}
              </Text>
              <Text style={styles.previewValue}>
                {activeParent.full_name}, Age{" "}
                {new Date().getFullYear() -
                  new Date(activeParent.date_of_birth).getFullYear()}{" "}
                • Blood {activeParent.blood_group}
              </Text>
              <View style={styles.allergyTag}>
                <Text style={styles.alertValue}>
                  {isHindi ? "एलर्जी" : "Allergies"}: {activeParent.allergies.join(", ") || "None"}
                </Text>
              </View>
            </View>

            <View style={styles.previewDivider} />

            <View style={styles.previewSection}>
              <Text style={styles.previewLabel}>
                {isHindi ? "पुरानी बीमारियाँ" : "CHRONIC CONDITIONS"}
              </Text>
              <Text style={styles.previewValue}>
                {activeParent.chronic_conditions.join(" • ")}
              </Text>
            </View>

            <View style={styles.previewDivider} />

            <View style={styles.previewSection}>
              <Text style={styles.previewLabel}>
                {isHindi
                  ? `सक्रिय दवाएं (${medicines.length})`
                  : `ACTIVE MEDICATIONS (${medicines.length})`}
              </Text>
              {medicines.map((m, i) => (
                <View key={i} style={styles.medRow}>
                  <View style={styles.medBullet} />
                  <Text style={styles.previewItem}>
                    <Text style={{ fontWeight: "700" }}>{m.name} {m.dosage}</Text> ({m.schedule_times.join(", ")}) — {m.instructions}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.previewDivider} />

            <View style={styles.previewSection}>
              <Text style={styles.previewLabel}>
                {isHindi
                  ? "हाल की जांच रिपोर्टें"
                  : "RECENT LAB REPORTS & SUMMARIES"}
              </Text>
              {documents.slice(0, 2).map((d, i) => (
                <View key={i} style={styles.docItem}>
                  <Text style={styles.docTitle}>• {d.title} ({d.document_date})</Text>
                  <Text style={styles.docSummary}>{d.summary}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
    </SwipeableBottomSheet>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  dismissArea: {
    flex: 1,
  },
  halfSheetContainer: {
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "88%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  grabHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  topIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  headerSub: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "600",
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  securityBanner: {
    flexDirection: "row",
    backgroundColor: "#F0FDFA",
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CCFBF1",
    marginBottom: Spacing.md,
    gap: 8,
  },
  desc: {
    flex: 1,
    fontSize: 12,
    color: "#0F766E",
    lineHeight: 17,
  },
  scopeContainer: {
    marginBottom: Spacing.md,
  },
  scopeHeading: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  scopeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  scopeBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  scopeBtnActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  scopeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  scopeTextActive: {
    color: Colors.primaryDark,
    fontWeight: "800",
  },
  qrCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  qrCodeBox: {
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  qrIconGlow: {
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    ...Shadows.card,
  },
  qrLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.primaryDark,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  expiryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  qrExpiry: {
    fontSize: 11,
    color: "#92400E",
    fontWeight: "700",
  },
  shareActionBtn: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    ...Shadows.glowTeal,
  },
  shareGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  shareActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  doctorHeaderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  doctorName: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  doctorSpecialty: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: "600",
    marginTop: 1,
  },
  doctorHospital: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  previewHeading: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  seniorPreviewHeading: {
    fontSize: 18,
  },
  previewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: 40,
  },
  previewSection: {
    marginBottom: Spacing.xs,
  },
  previewDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: Spacing.md,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: Colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  allergyTag: {
    alignSelf: "flex-start",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  alertValue: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.emergency,
  },
  medRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 4,
    gap: 6,
  },
  medBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
    marginTop: 6,
  },
  previewItem: {
    fontSize: 13,
    color: Colors.textPrimary,
    flex: 1,
  },
  docItem: {
    marginBottom: 6,
    marginTop: 4,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primaryDark,
  },
  docSummary: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 8,
    marginTop: 1,
  },
});

