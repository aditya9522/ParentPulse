import React, { useState } from "react";
import { ActivityIndicator, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppAlert as Alert } from "../services/appAlert";
import { Clock, FileText, Lock, RotateCcw, Share2, ShieldCheck, Stethoscope, X } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import QRCode from "react-native-qrcode-svg";
import { apiClient } from "../api/client";
import { useApp } from "../context/AppContext";
import { BorderRadius, Colors, Gradients, Shadows, Spacing, Typography } from "../theme";
import { SwipeableBottomSheet } from "./SwipeableBottomSheet";

type Scope = "summary_only" | "full_history";

export const SecureDoctorShareModal: React.FC = () => {
  const { activeParent, medicines, documents, doctorShareModalVisible, setDoctorShareModalVisible } = useApp();
  const [scope, setScope] = useState<Scope>("summary_only");
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const baseUrl = (process.env.EXPO_PUBLIC_SHARE_BASE_URL || "http://localhost:8000/api/v1/sharing/doctor-brief").replace(/\/$/, "");
  const shareUrl = token ? `${baseUrl}/${token}` : null;

  const haptic = () => {
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const createLink = async () => {
    haptic();
    setBusy(true);
    try {
      const share = await apiClient.createDoctorShare(activeParent.id, scope, 72);
      setToken(share.token);
      setExpiresAt(share.expires_at);
    } catch (error) {
      Alert.alert("Couldn’t create secure access", error instanceof Error ? error.message : "Try again shortly.");
    } finally {
      setBusy(false);
    }
  };

  const shareLink = async () => {
    if (!shareUrl) return;
    await Share.share({ message: `ParentPulse Doctor Brief for ${activeParent.full_name}\nRead-only access expires at ${new Date(expiresAt || "").toLocaleString()}.\n${shareUrl}` });
  };

  const revoke = async () => {
    if (!token) return;
    setBusy(true);
    try {
      await apiClient.revokeDoctorShare(token);
      setToken(null);
      setExpiresAt(null);
      Alert.alert("Access revoked", "This QR code and link can no longer open the brief.");
    } catch (error) {
      Alert.alert("Couldn’t revoke access", error instanceof Error ? error.message : "Try again shortly.");
    } finally {
      setBusy(false);
    }
  };

  return <SwipeableBottomSheet visible={doctorShareModalVisible} onClose={() => setDoctorShareModalVisible(false)} maxHeight="92%">
    <View style={styles.header}><View style={styles.headerIdentity}><View style={styles.headerIcon}><Stethoscope size={20} color="#FFFFFF" /></View><View><Text style={styles.title}>Secure doctor brief</Text><Text style={styles.subtitle}>Read-only, expiring clinical access</Text></View></View><TouchableOpacity style={styles.close} onPress={() => setDoctorShareModalVisible(false)}><X size={20} color={Colors.textMuted} /></TouchableOpacity></View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.securityBanner}><Lock size={17} color={Colors.primaryDark} /><Text style={styles.securityText}>Doctors receive only the selected scope. Family credentials, editing access, and location history are never shared.</Text></View>

      <Text style={styles.sectionLabel}>ACCESS SCOPE</Text>
      <View style={styles.scopeRow}><ScopeButton selected={scope === "summary_only"} title="Care summary" detail="Medicines, conditions and latest reports" onPress={() => { setScope("summary_only"); setToken(null); }} /><ScopeButton selected={scope === "full_history"} title="Full history" detail="Extended medical record timeline" onPress={() => { setScope("full_history"); setToken(null); }} /></View>

      <View style={[styles.briefCard, Shadows.card]}><View style={styles.briefTop}><View><Text style={styles.patientName}>{activeParent.full_name}</Text><Text style={styles.patientMeta}>{activeParent.blood_group} blood · {activeParent.chronic_conditions.length} tracked conditions</Text></View><ShieldCheck size={23} color={Colors.primary} /></View><View style={styles.metrics}><Metric value={String(medicines.filter((item) => item.is_active).length)} label="Medicines" /><Metric value={String(documents.length)} label="Records" /><Metric value="72h" label="Expiry" /></View></View>

      <View style={styles.qrCard}>
        {shareUrl ? <><View style={styles.qrFrame}><QRCode value={shareUrl} size={164} color="#063B39" backgroundColor="#FFFFFF" ecl="H" /></View><View style={styles.expiry}><Clock size={14} color="#B45309" /><Text style={styles.expiryText}>Expires {new Date(expiresAt || "").toLocaleString()}</Text></View><Text style={styles.tokenHint}>Token ending ···{token?.slice(-6)}</Text></> : <><View style={styles.lockCircle}><ShieldCheck size={34} color={Colors.primaryDark} /></View><Text style={styles.qrEmptyTitle}>Generate one-time access</Text><Text style={styles.qrEmptyText}>A cryptographically random token will be created by the server and encoded into a scannable QR.</Text></>}
      </View>

      {!shareUrl ? <TouchableOpacity style={styles.primaryButton} onPress={() => void createLink()} disabled={busy}><LinearGradient colors={Gradients.teal} style={styles.primaryGradient}>{busy ? <ActivityIndicator color="#FFFFFF" /> : <><ShieldCheck size={18} color="#FFFFFF" /><Text style={styles.primaryText}>Generate secure QR</Text></>}</LinearGradient></TouchableOpacity> : <><TouchableOpacity style={styles.primaryButton} onPress={() => void shareLink()}><LinearGradient colors={Gradients.teal} style={styles.primaryGradient}><Share2 size={18} color="#FFFFFF" /><Text style={styles.primaryText}>Share expiring link</Text></LinearGradient></TouchableOpacity><TouchableOpacity style={styles.revokeButton} onPress={() => void revoke()} disabled={busy}>{busy ? <ActivityIndicator color="#B91C1C" /> : <><RotateCcw size={17} color="#B91C1C" /><Text style={styles.revokeText}>Revoke access now</Text></>}</TouchableOpacity></>}
      <View style={styles.auditNote}><FileText size={15} color={Colors.textMuted} /><Text style={styles.auditText}>Opening the brief increments its access count. Expired or revoked tokens fail closed.</Text></View>
    </ScrollView>
  </SwipeableBottomSheet>;
};

const ScopeButton = ({ selected, title, detail, onPress }: { selected: boolean; title: string; detail: string; onPress: () => void }) => <TouchableOpacity style={[styles.scopeButton, selected && styles.scopeButtonActive]} onPress={onPress}><View style={[styles.radio, selected && styles.radioActive]}>{selected && <View style={styles.radioDot} />}</View><Text style={[styles.scopeTitle, selected && styles.scopeTitleActive]}>{title}</Text><Text style={styles.scopeDetail}>{detail}</Text></TouchableOpacity>;
const Metric = ({ value, label }: { value: string; label: string }) => <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.lg, paddingBottom: 10 }, headerIdentity: { flexDirection: "row", alignItems: "center", gap: 11 }, headerIcon: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: Colors.primaryDark }, title: { fontSize: 18, fontWeight: Typography.weights.extraBold, color: Colors.textPrimary }, subtitle: { fontSize: 10, color: Colors.textMuted, marginTop: 2 }, close: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,.8)" }, content: { paddingHorizontal: Spacing.lg, paddingBottom: 36 }, securityBanner: { flexDirection: "row", gap: 10, padding: 13, borderRadius: BorderRadius.lg, backgroundColor: Colors.primaryFaint, borderWidth: 1, borderColor: Colors.primaryLight }, securityText: { flex: 1, fontSize: 11, lineHeight: 17, color: Colors.textSecondary }, sectionLabel: { fontSize: 9, letterSpacing: 1.3, fontWeight: "900", color: Colors.textMuted, marginTop: 19, marginBottom: 8 }, scopeRow: { flexDirection: "row", gap: 9 }, scopeButton: { flex: 1, minHeight: 112, padding: 12, borderRadius: 17, borderWidth: 1, borderColor: Colors.border, backgroundColor: "rgba(255,255,255,.72)" }, scopeButtonActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryFaint }, radio: { width: 17, height: 17, borderRadius: 9, borderWidth: 2, borderColor: Colors.borderStrong, alignItems: "center", justifyContent: "center" }, radioActive: { borderColor: Colors.primary }, radioDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.primary }, scopeTitle: { fontSize: 12, fontWeight: "800", color: Colors.textSecondary, marginTop: 9 }, scopeTitleActive: { color: Colors.primaryDark }, scopeDetail: { fontSize: 9, lineHeight: 13, color: Colors.textMuted, marginTop: 4 }, briefCard: { marginTop: 14, padding: 15, borderRadius: 19, backgroundColor: "#FFFFFF" }, briefTop: { flexDirection: "row", justifyContent: "space-between" }, patientName: { fontSize: 16, fontWeight: "900", color: Colors.textPrimary }, patientMeta: { fontSize: 10, color: Colors.textMuted, marginTop: 3 }, metrics: { flexDirection: "row", marginTop: 14, paddingTop: 13, borderTopWidth: 1, borderTopColor: Colors.border }, metric: { flex: 1, alignItems: "center" }, metricValue: { fontSize: 17, fontWeight: "900", color: Colors.primaryDark }, metricLabel: { fontSize: 8, textTransform: "uppercase", color: Colors.textMuted, marginTop: 2 }, qrCard: { marginTop: 14, minHeight: 245, padding: 20, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: Colors.border }, qrFrame: { padding: 13, borderRadius: 18, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: Colors.primaryLight }, expiry: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 13, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: "#FFFBEB" }, expiryText: { fontSize: 9, fontWeight: "700", color: "#92400E" }, tokenHint: { fontSize: 9, color: Colors.textMuted, marginTop: 8 }, lockCircle: { width: 65, height: 65, borderRadius: 24, backgroundColor: Colors.primaryFaint, alignItems: "center", justifyContent: "center" }, qrEmptyTitle: { fontSize: 16, fontWeight: "900", color: Colors.textPrimary, marginTop: 14 }, qrEmptyText: { maxWidth: 280, textAlign: "center", fontSize: 11, lineHeight: 17, color: Colors.textMuted, marginTop: 5 }, primaryButton: { marginTop: 13, borderRadius: 17, overflow: "hidden" }, primaryGradient: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 }, primaryText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" }, revokeButton: { marginTop: 9, minHeight: 48, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#FEF2F2" }, revokeText: { color: "#B91C1C", fontSize: 12, fontWeight: "800" }, auditNote: { flexDirection: "row", gap: 8, padding: 12, marginTop: 12 }, auditText: { flex: 1, fontSize: 9, lineHeight: 14, color: Colors.textMuted },
});
