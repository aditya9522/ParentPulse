import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppAlert as Alert } from "../services/appAlert";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera, CheckCircle2, CloudUpload, ExternalLink, FileText, FolderOpen, Image as ImageIcon, RefreshCw, Search, ShieldCheck, Sparkles, Trash2, X } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { apiClient } from "../api/client";
import { useApp } from "../context/AppContext";
import { MedicalDocument } from "../types";
import { Colors, Shadows, Spacing, createThemedStyles } from "../theme";
import { SwipeableBottomSheet } from "../components/SwipeableBottomSheet";
import { ConfirmationModal } from "../components/ConfirmationModal";

const FILTERS = ["all", "prescription", "lab_report", "radiology", "discharge_summary"] as const;
const FILTER_LABELS: Record<(typeof FILTERS)[number], string> = { all: "All", prescription: "Prescriptions", lab_report: "Lab reports", radiology: "Scans", discharge_summary: "Discharge" };

export const DocumentVaultScreen: React.FC = () => {
  const { activeParent, documents, addDocument, deleteDocument, seniorMode } = useApp();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selected, setSelected] = useState<MedicalDocument | null>(null);
  const [deleting, setDeleting] = useState<MedicalDocument | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const visibleDocuments = useMemo(() => documents.filter((document) => {
    const matchesFilter = filter === "all" || document.document_type === filter;
    const needle = query.trim().toLowerCase();
    return matchesFilter && (!needle || [document.title, document.doctor_name, document.hospital_name, document.summary].some((value) => value?.toLowerCase().includes(needle)));
  }), [documents, filter, query]);

  useEffect(() => {
    if (!documents.some((document) => document.status === "pending" || document.status === "processing")) return;
    const timer = setInterval(() => {
      void apiClient.listDocuments(activeParent.id).then((remote) => remote.forEach(addDocument)).catch(() => undefined);
    }, 4000);
    return () => clearInterval(timer);
  }, [documents, activeParent.id, addDocument]);

  const classify = (filename: string): MedicalDocument["document_type"] => {
    const value = filename.toLowerCase();
    if (value.includes("lab") || value.includes("blood") || value.includes("test")) return "lab_report";
    if (value.includes("discharge")) return "discharge_summary";
    if (value.includes("scan") || value.includes("xray") || value.includes("mri")) return "radiology";
    return "prescription";
  };

  const upload = async (asset: { uri: string; name: string; mimeType: string; size?: number }) => {
    if (asset.size && asset.size > 20 * 1024 * 1024) {
      Alert.alert("File too large", "Medical documents must be 20 MB or smaller.");
      return;
    }
    setUploading(true);
    setUploadMessage("Encrypting and uploading to the private family vault…");
    try {
      const title = asset.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
      const document = await apiClient.uploadDocument({
        parentId: activeParent.id,
        familyId: activeParent.family_id,
        title: title || "Medical document",
        documentType: classify(asset.name),
        documentDate: new Date().toISOString().slice(0, 10),
        uri: asset.uri,
        filename: asset.name,
        mimeType: asset.mimeType,
        doctorName: activeParent.primary_doctors[0]?.name,
        hospitalName: activeParent.primary_doctors[0]?.hospital_or_clinic,
      });
      addDocument(document);
      setUploadMessage("Upload complete. Clinical extraction is running securely in the background.");
      if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setUploading(false), 900);
    } catch (error) {
      setUploading(false);
      Alert.alert("Upload failed", error instanceof Error ? error.message : "The document could not be uploaded.");
    }
  };

  const pickCamera = async () => {
    setPickerOpen(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return Alert.alert("Camera permission required", "Allow camera access to scan medical records.");
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.9 });
    const asset = result.assets?.[0];
    if (asset) await upload({ uri: asset.uri, name: asset.fileName || `medical-scan-${Date.now()}.jpg`, mimeType: asset.mimeType || "image/jpeg", size: asset.fileSize });
  };

  const pickGallery = async () => {
    setPickerOpen(false);
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.9 });
    const asset = result.assets?.[0];
    if (asset) await upload({ uri: asset.uri, name: asset.fileName || `medical-photo-${Date.now()}.jpg`, mimeType: asset.mimeType || "image/jpeg", size: asset.fileSize });
  };

  const pickFile = async () => {
    setPickerOpen(false);
    const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"], copyToCacheDirectory: true, multiple: false });
    const asset = result.assets?.[0];
    if (asset) await upload({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType || "application/pdf", size: asset.size });
  };

  const openOriginal = async (document: MedicalDocument) => {
    try {
      const result = await apiClient.getDocumentDownloadUrl(document.id);
      await Linking.openURL(result.download_url);
    } catch (error) {
      Alert.alert("Couldn’t open document", error instanceof Error ? error.message : "Try again shortly.");
    }
  };

  const retry = async (document: MedicalDocument) => {
    try {
      const updated = await apiClient.retryDocument(document.id);
      addDocument(updated);
      setSelected(updated);
    } catch (error) {
      Alert.alert("Retry failed", error instanceof Error ? error.message : "Try again shortly.");
    }
  };

  return <View style={styles.screen}>
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={["#063B39", "#0D9488", "#2DD4BF"]} style={styles.hero}>
        <View style={styles.heroTop}><View style={styles.heroBadge}><ShieldCheck size={14} color="#CCFBF1" /><Text style={styles.heroBadgeText}>PRIVATE • ENCRYPTED</Text></View><Text style={styles.heroCount}>{documents.length} records</Text></View>
        <Text style={[styles.heroTitle, seniorMode && { fontSize: 31 }]}>Medical vault</Text>
        <Text style={styles.heroSubtitle}>Original files stay private. Clinical details are extracted from the actual document and never shown as verified until processing completes.</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={() => setPickerOpen(true)}><CloudUpload size={20} color={Colors.primaryDark} /><Text style={styles.uploadButtonText}>Add medical record</Text></TouchableOpacity>
      </LinearGradient>

      <View style={styles.searchBox}><Search size={18} color={Colors.textMuted} /><TextInput style={styles.searchInput} value={query} onChangeText={setQuery} placeholder="Search title, doctor, hospital or finding" placeholderTextColor={Colors.textMuted} /></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{FILTERS.map((item) => <TouchableOpacity key={item} style={[styles.filterChip, filter === item && styles.filterChipActive]} onPress={() => setFilter(item)}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{FILTER_LABELS[item]}</Text></TouchableOpacity>)}</ScrollView>

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{visibleDocuments.length} medical records</Text><Text style={styles.sectionMeta}>Newest first</Text></View>
      {visibleDocuments.map((document) => <TouchableOpacity key={document.id} style={[styles.documentCard, Shadows.card]} onPress={() => setSelected(document)} activeOpacity={0.82}>
        <View style={styles.documentIcon}><FileText size={22} color={Colors.primaryDark} /></View>
        <View style={styles.documentInfo}><View style={styles.documentTitleRow}><Text style={styles.documentTitle} numberOfLines={2}>{document.title}</Text><StatusBadge status={document.status} /></View><Text style={styles.documentMeta}>{document.document_date} · {document.hospital_name || "Medical record"}</Text><Text style={styles.documentSummary} numberOfLines={2}>{document.status === "extracted" ? document.summary || "Extraction complete" : document.status === "failed" ? "Extraction needs attention. The original file remains secure." : "Secure clinical extraction in progress…"}</Text></View>
      </TouchableOpacity>)}
      {!visibleDocuments.length && <View style={styles.empty}><FolderOpen size={34} color={Colors.textMuted} /><Text style={styles.emptyTitle}>No matching records</Text><Text style={styles.emptyText}>Upload a prescription, report, scan, or discharge summary.</Text></View>}
    </ScrollView>

    <SwipeableBottomSheet visible={pickerOpen} onClose={() => setPickerOpen(false)} maxHeight="58%"><View style={styles.sheetContent}><Text style={styles.sheetTitle}>Add to medical vault</Text><Text style={styles.sheetSubtitle}>PDF, JPEG, PNG, WebP or HEIC · maximum 20 MB</Text><PickerAction icon={<Camera size={21} color={Colors.primaryDark} />} title="Scan with camera" subtitle="Capture a clear, flat image" onPress={() => void pickCamera()} /><PickerAction icon={<ImageIcon size={21} color="#0369A1" />} title="Choose a photo" subtitle="Select an existing medical image" onPress={() => void pickGallery()} /><PickerAction icon={<FolderOpen size={21} color="#7C3AED" />} title="Browse files" subtitle="Upload a PDF or image" onPress={() => void pickFile()} /></View></SwipeableBottomSheet>

    <Modal visible={uploading} transparent animationType="fade"><View style={styles.progressOverlay}><View style={styles.progressCard}><View style={styles.progressIcon}>{uploadMessage.startsWith("Upload complete") ? <CheckCircle2 size={30} color={Colors.primaryDark} /> : <ActivityIndicator size="large" color={Colors.primary} />}</View><Text style={styles.progressTitle}>{uploadMessage.startsWith("Upload complete") ? "Secured" : "Protecting your document"}</Text><Text style={styles.progressText}>{uploadMessage}</Text></View></View></Modal>

    <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}><View style={[styles.detailScreen, { paddingTop: insets.top + 10 }]}>{selected && <><View style={styles.detailHeader}><TouchableOpacity style={styles.closeButton} onPress={() => setSelected(null)}><X size={21} color={Colors.textPrimary} /></TouchableOpacity><Text style={styles.detailHeaderTitle}>Medical record</Text><View style={styles.closeButton} /></View><ScrollView contentContainerStyle={styles.detailContent}><StatusBadge status={selected.status} /><Text style={styles.detailTitle}>{selected.title}</Text><Text style={styles.detailMeta}>{selected.document_date} · {selected.doctor_name || "Provider not specified"}</Text><View style={styles.aiCard}><View style={styles.aiHeader}><Sparkles size={18} color="#7C3AED" /><Text style={styles.aiTitle}>CLINICAL EXTRACTION</Text></View>{selected.status === "extracted" ? <><Text style={styles.aiSummary}>{selected.summary || "No summary was returned."}</Text>{Object.entries(selected.extracted_fields || {}).map(([key, value]) => <View style={styles.finding} key={key}><Text style={styles.findingKey}>{key.replaceAll("_", " ")}</Text><Text style={styles.findingValue}>{String(value)}</Text></View>)}</> : <Text style={styles.aiSummary}>{selected.status === "failed" ? "The extraction could not be completed. Your original file is safe and can be retried." : "The original file is secure. Structured findings will appear when processing finishes."}</Text>}</View>{selected.status === "failed" && <TouchableOpacity style={styles.secondaryButton} onPress={() => void retry(selected)}><RefreshCw size={18} color={Colors.primaryDark} /><Text style={styles.secondaryButtonText}>Retry extraction</Text></TouchableOpacity>}<TouchableOpacity style={styles.primaryAction} onPress={() => void openOriginal(selected)}><ExternalLink size={18} color="#FFFFFF" /><Text style={styles.primaryActionText}>Open original with signed link</Text></TouchableOpacity><TouchableOpacity style={styles.deleteButton} onPress={() => setDeleting(selected)}><Trash2 size={17} color="#B91C1C" /><Text style={styles.deleteText}>Remove from vault</Text></TouchableOpacity></ScrollView></>}</View></Modal>
    <ConfirmationModal visible={!!deleting} title="Remove medical record?" message="The record will be archived and removed from this vault view." confirmText="Remove" isDestructive onCancel={() => setDeleting(null)} onConfirm={() => { if (deleting) { deleteDocument(deleting.id); setSelected(null); setDeleting(null); } }} />
  </View>;
};

const StatusBadge = ({ status }: { status: MedicalDocument["status"] }) => <View style={[styles.statusBadge, status === "extracted" ? styles.statusReady : status === "failed" ? styles.statusFailed : styles.statusWorking]}>{status === "processing" || status === "pending" ? <ActivityIndicator size={10} color="#92400E" /> : null}<Text style={[styles.statusText, status === "extracted" ? styles.statusReadyText : status === "failed" ? styles.statusFailedText : styles.statusWorkingText]}>{status === "extracted" ? "Ready" : status === "failed" ? "Needs review" : "Processing"}</Text></View>;
const PickerAction = ({ icon, title, subtitle, onPress }: { icon: React.ReactNode; title: string; subtitle: string; onPress: () => void }) => <TouchableOpacity style={styles.pickerAction} onPress={onPress}><View style={styles.pickerIcon}>{icon}</View><View><Text style={styles.pickerTitle}>{title}</Text><Text style={styles.pickerSubtitle}>{subtitle}</Text></View></TouchableOpacity>;

const styles = createThemedStyles({
  screen: { flex: 1 }, content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm }, hero: { borderRadius: 28, padding: 22, overflow: "hidden" }, heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, heroBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, backgroundColor: "rgba(255,255,255,.13)" }, heroBadgeText: { color: "#CCFBF1", fontSize: 9, fontWeight: "800", letterSpacing: .8 }, heroCount: { color: "#CCFBF1", fontSize: 11, fontWeight: "700" }, heroTitle: { color: "#FFFFFF", fontSize: 28, fontWeight: "900", marginTop: 20 }, heroSubtitle: { color: "#DFFCF7", fontSize: 13, lineHeight: 19, marginTop: 7 }, uploadButton: { marginTop: 18, minHeight: 48, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.88)", borderWidth: 1.2, borderColor: "rgba(255,255,255,0.95)", flexDirection: "row", gap: 9, alignItems: "center", justifyContent: "center" }, uploadButtonText: { color: Colors.primaryDark, fontSize: 14, fontWeight: "800" }, searchBox: { marginTop: 15, height: 50, borderRadius: 16, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "rgba(255,255,255,.75)", borderWidth: 1, borderColor: "rgba(255,255,255,0.85)" }, searchInput: { flex: 1, color: Colors.textPrimary, fontSize: 13 }, filters: { gap: 8, paddingVertical: 13 }, filterChip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(255,255,255,.70)", borderWidth: 1, borderColor: "rgba(255,255,255,0.85)" }, filterChipActive: { backgroundColor: Colors.primaryDark, borderColor: Colors.primaryDark }, filterText: { fontSize: 11, fontWeight: "700", color: Colors.textSecondary }, filterTextActive: { color: "#FFFFFF" }, sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }, sectionTitle: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary }, sectionMeta: { fontSize: 10, color: Colors.textMuted }, documentCard: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 19, backgroundColor: "rgba(255,255,255,.70)", marginBottom: 10, borderWidth: 1.2, borderColor: "rgba(255,255,255,.85)" }, documentIcon: { width: 45, height: 45, borderRadius: 15, backgroundColor: Colors.primaryFaint, alignItems: "center", justifyContent: "center" }, documentInfo: { flex: 1 }, documentTitleRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" }, documentTitle: { flex: 1, color: Colors.textPrimary, fontSize: 13, lineHeight: 17, fontWeight: "800" }, documentMeta: { color: Colors.textMuted, fontSize: 10, marginTop: 4 }, documentSummary: { color: Colors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 7 }, statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 10 }, statusReady: { backgroundColor: "#DCFCE7" }, statusWorking: { backgroundColor: "#FEF3C7" }, statusFailed: { backgroundColor: "#FEE2E2" }, statusText: { fontSize: 8, fontWeight: "800" }, statusReadyText: { color: "#166534" }, statusWorkingText: { color: "#92400E" }, statusFailedText: { color: "#991B1B" }, empty: { alignItems: "center", paddingVertical: 50 }, emptyTitle: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary, marginTop: 12 }, emptyText: { fontSize: 12, color: Colors.textMuted, marginTop: 5 }, sheetContent: { paddingHorizontal: Spacing.lg, paddingBottom: 28 }, sheetTitle: { fontSize: 22, fontWeight: "900", color: Colors.textPrimary }, sheetSubtitle: { fontSize: 11, color: Colors.textMuted, marginTop: 4, marginBottom: 14 }, pickerAction: { minHeight: 70, flexDirection: "row", alignItems: "center", gap: 13, padding: 12, marginTop: 9, borderRadius: 17, backgroundColor: "rgba(255,255,255,.72)", borderWidth: 1.2, borderColor: "rgba(255,255,255,0.85)" }, pickerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.surfaceAlt, alignItems: "center", justifyContent: "center" }, pickerTitle: { fontSize: 13, fontWeight: "800", color: Colors.textPrimary }, pickerSubtitle: { fontSize: 10, color: Colors.textMuted, marginTop: 3 }, progressOverlay: { flex: 1, backgroundColor: "rgba(5,20,25,.64)", alignItems: "center", justifyContent: "center", padding: 28 }, progressCard: { width: "100%", maxWidth: 360, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.88)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.95)", padding: 26, alignItems: "center" }, progressIcon: { width: 62, height: 62, borderRadius: 22, backgroundColor: Colors.primaryFaint, alignItems: "center", justifyContent: "center" }, progressTitle: { fontSize: 19, fontWeight: "900", color: Colors.textPrimary, marginTop: 15 }, progressText: { textAlign: "center", fontSize: 12, lineHeight: 18, color: Colors.textMuted, marginTop: 7 }, detailScreen: { flex: 1, backgroundColor: "#F6FAFA" }, detailHeader: { height: 54, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, closeButton: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.75)", borderWidth: 1, borderColor: "rgba(255,255,255,0.9)" }, detailHeaderTitle: { fontSize: 14, fontWeight: "800", color: Colors.textPrimary }, detailContent: { padding: 20, paddingBottom: 50 }, detailTitle: { fontSize: 26, lineHeight: 32, fontWeight: "900", color: Colors.textPrimary, marginTop: 14 }, detailMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 7 }, aiCard: { marginTop: 22, padding: 17, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.75)", borderWidth: 1.2, borderColor: "rgba(237,233,254,0.9)" }, aiHeader: { flexDirection: "row", alignItems: "center", gap: 8 }, aiTitle: { fontSize: 10, fontWeight: "900", letterSpacing: 1, color: "#6D28D9" }, aiSummary: { marginTop: 13, fontSize: 13, lineHeight: 20, color: Colors.textSecondary }, finding: { marginTop: 11, paddingTop: 11, borderTopWidth: 1, borderTopColor: Colors.border }, findingKey: { fontSize: 9, textTransform: "uppercase", fontWeight: "800", color: Colors.textMuted }, findingValue: { fontSize: 12, color: Colors.textPrimary, marginTop: 3 }, primaryAction: { marginTop: 14, minHeight: 50, borderRadius: 16, backgroundColor: Colors.primaryDark, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, primaryActionText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" }, secondaryButton: { marginTop: 14, minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: Colors.primaryLight, backgroundColor: Colors.primaryFaint, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, secondaryButtonText: { color: Colors.primaryDark, fontSize: 13, fontWeight: "800" }, deleteButton: { marginTop: 11, minHeight: 48, borderRadius: 16, backgroundColor: "#FEF2F2", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, deleteText: { color: "#B91C1C", fontSize: 12, fontWeight: "800" },
});
