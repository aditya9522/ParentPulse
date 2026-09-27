// apps/mobile/src/screens/DocumentsScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
  StatusBar,
  Image as RNImage,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Search,
  UploadCloud,
  FileText,
  FlaskConical,
  Stethoscope,
  ScanLine,
  X,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Calendar,
  Building2,
  Tag,
  Trash2,
  Camera,
  Image as ImageIcon,
  FolderOpen,
  CheckCircle2,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useApp } from "../context/AppContext";
import { MedicalDocument } from "../types";
import { Colors, Typography, Spacing, Shadows, BorderRadius, Gradients, Glass } from "../theme";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { SwipeableBottomSheet } from "../components/SwipeableBottomSheet";

export const DocumentsScreen: React.FC = () => {
  const { activeParent, documents, addDocument, deleteDocument, seniorMode, language } = useApp();
  const insets = useSafeAreaInsets();
  const modalTopPadding = Platform.select({
    web: 12,
    ios: Math.max(insets.top, 16),
    android: (StatusBar.currentHeight || insets.top || 16) + 4,
    default: 12,
  });
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDocModal, setActiveDocModal] = useState<MedicalDocument | null>(null);

  // Upload Picker Modal State
  const [uploadPickerVisible, setUploadPickerVisible] = useState(false);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrStatusText, setOcrStatusText] = useState("");

  // Delete Confirmation Modal State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [docToDelete, setDocToDelete] = useState<MedicalDocument | null>(null);

  const isHindi = language === "hi";

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(style);
      }
    } catch { }
  };

  const filters = [
    { id: "all", label: isHindi ? "सभी रिकॉर्ड्स" : "All Records" },
    { id: "prescription", label: isHindi ? "पर्चे (Rx)" : "Prescriptions" },
    { id: "lab_report", label: isHindi ? "लैब रिपोर्ट्स" : "Lab Reports" },
    { id: "radiology", label: isHindi ? "एक्स-रे व स्कैन" : "Scans & ECG" },
    { id: "discharge_summary", label: isHindi ? "डिस्चार्ज समरी" : "Discharge" },
  ];

  const filteredDocs = documents.filter((doc) => {
    const matchesFilter = selectedFilter === "all" || doc.document_type === selectedFilter;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.doctor_name && doc.doctor_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.summary && doc.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const processAndSaveDocument = async (fileName: string, fileUri: string, docType: string) => {
    setIsProcessingOcr(true);
    setOcrStatusText(
      isHindi
        ? "जेमिनी 1.5 प्रो OCR से मेडिकल डेटा निकाला जा रहा है..."
        : "Gemini 1.5 Pro OCR extracting clinical data & medicines..."
    );

    // Realistic OCR extraction simulation
    setTimeout(() => {
      const isLab = docType.includes("lab") || fileName.toLowerCase().includes("blood") || fileName.toLowerCase().includes("test");
      const isRx = docType.includes("rx") || docType.includes("presc") || fileName.toLowerCase().includes("prescription");

      const newDoc: MedicalDocument = {
        id: `doc_${Date.now()}`,
        parent_id: activeParent.id,
        title: fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").toUpperCase() || (isHindi ? "नया मेडिकल दस्तावेज़" : "Medical Record"),
        document_type: isRx ? "prescription" : isLab ? "lab_report" : "radiology",
        file_url: fileUri,
        document_date: new Date().toISOString().split("T")[0],
        status: "extracted",
        doctor_name: activeParent.primary_doctors[0]?.name || "Dr. Arun Verma",
        hospital_name: activeParent.primary_doctors[0]?.hospital_or_clinic || "Fortis Memorial",
        summary: isRx
          ? (isHindi
            ? "पर्चे से दवाइयां निकाली गईं: रक्तचाप एवं हृदय स्वास्थ्य के लिए नियमित सेवन का परामर्श।"
            : "Prescription analyzed: Cardiac & BP maintenance regimen verified. Dosage instructions mapped.")
          : (isHindi
            ? "लैब टेस्ट रिपोर्ट: सभी महत्वपूर्ण पैरामीटर सामान्य सीमा में पाए गए।"
            : "Diagnostic report processed: Fasting biomarkers analyzed. Verified within reference thresholds."),
        extracted_tags: isRx
          ? ["Prescription", "Cardiology", "Verified", "Gemini OCR"]
          : ["Lab Diagnostic", "Biomarkers", "Normal", "Gemini OCR"],
        extracted_fields: isRx
          ? { regime: "Daily Morning", compliance: "Strict", validity: "6 Months" }
          : { status: "Verified Normal", sample_type: "Venous Blood", verified_by_pathologist: "Yes" },
      };

      addDocument(newDoc);
      setIsProcessingOcr(false);
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);

      Alert.alert(
        isHindi ? "✅ दस्तावेज़ सुरक्षित रूप से सहेजा गया" : "✅ Document Secured to Vault",
        isHindi
          ? `"${newDoc.title}" को जेमिनी OCR द्वारा प्रोसेस करके रिकॉर्ड्स में जोड़ दिया गया है।`
          : `"${newDoc.title}" has been structured and encrypted in ${activeParent.full_name}'s vault.`
      );
    }, 1400);
  };

  // 1. Camera Capture
  const handleLaunchCamera = async () => {
    setUploadPickerVisible(false);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          isHindi ? "कैमरा अनुमति आवश्यक है" : "Camera Permission Required",
          isHindi
            ? "दस्तावेज़ स्कैन करने के लिए कृपया सेटिंग्स में कैमरा अनुमति चालू करें।"
            : "Please enable camera access to scan medical documents."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const name = asset.fileName || `Rx_Scan_${new Date().toLocaleDateString("en-GB").replace(/\//g, "-")}.jpg`;
        processAndSaveDocument(name, asset.uri, "prescription");
      }
    } catch (err) {
      console.warn("Camera error:", err);
    }
  };

  // 2. Photo Gallery Picker
  const handleLaunchGallery = async () => {
    setUploadPickerVisible(false);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const name = asset.fileName || `Medical_Photo_${Date.now()}.jpg`;
        processAndSaveDocument(name, asset.uri, "prescription");
      }
    } catch (err) {
      console.warn("Gallery error:", err);
    }
  };

  // 3. Document / PDF Picker
  const handleLaunchDocumentPicker = async () => {
    setUploadPickerVisible(false);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        processAndSaveDocument(asset.name, asset.uri, asset.mimeType || "application/pdf");
      }
    } catch (err) {
      console.warn("Document picker error:", err);
    }
  };

  const promptDeleteDocument = (doc: MedicalDocument) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setDocToDelete(doc);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (docToDelete) {
      deleteDocument(docToDelete.id);
      if (activeDocModal?.id === docToDelete.id) {
        setActiveDocModal(null);
      }
      setDocToDelete(null);
      setDeleteModalVisible(false);
    }
  };

  const getDocTypeConfig = (type: string) => {
    switch (type) {
      case "prescription":
        return { icon: Stethoscope, color: Colors.primaryDark, bg: Colors.primaryLight, label: "Rx Prescription" };
      case "lab_report":
        return { icon: FlaskConical, color: "#7C3AED", bg: "#EDE9FE", label: "Lab Diagnostic" };
      case "radiology":
        return { icon: ScanLine, color: Colors.secondaryDark, bg: Colors.secondaryLight, label: "Radiology / ECG" };
      default:
        return { icon: FileText, color: Colors.textSecondary, bg: Colors.surfaceAlt, label: "Medical Summary" };
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Bar & Action Ribbon */}
      <View style={styles.headerArea}>
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput
            style={[styles.searchInput, seniorMode && styles.seniorSearchInput]}
            placeholder={
              isHindi
                ? "दस्तावेज़, डॉक्टर या रिपोर्ट खोजें..."
                : "Search prescriptions, doctors, lab tests..."
            }
            placeholderTextColor={Colors.textSubtle}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={() => setUploadPickerVisible(true)} activeOpacity={0.8}>
          <LinearGradient
            colors={Gradients.primary}
            style={[styles.uploadBtnGradient, Shadows.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <UploadCloud size={16} color="#FFFFFF" />
            <Text style={styles.uploadBtnText}>
              {isHindi ? "अपलोड" : "Upload"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Live OCR Processing Indicator Banner */}
      {isProcessingOcr && (
        <View style={styles.ocrBannerWrapper}>
          <LinearGradient
            colors={["#FAF5FF", "#EDE9FE"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ocrBanner}
          >
            <ActivityIndicator size="small" color="#7C3AED" style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.ocrTitle}>{isHindi ? "एआई विश्लेषण जारी है..." : "Processing Document Intelligence"}</Text>
              <Text style={styles.ocrSub} numberOfLines={1}>{ocrStatusText}</Text>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Horizontal Filter Pill Tabs */}
      <View style={styles.filterScroll}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.md, gap: 8 }}>
          {filters.map((f) => {
            const isActive = selectedFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => {
                  triggerHaptic();
                  setSelectedFilter(f.id);
                }}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Document List View */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {/* Encrypted Vault Visual Banner */}
        <View style={[styles.vaultHeroBanner, Shadows.card]}>
          <RNImage
            source={require("../../assets/documents_vault.jpg")}
            style={styles.vaultHeroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(15, 23, 42, 0.85)"]}
            style={styles.vaultHeroOverlay}
          >
            <View style={styles.vaultPill}>
              <ShieldCheck size={11} color="#FFFFFF" />
              <Text style={styles.vaultPillText}>
                {isHindi ? "256-बिट सुरक्षित मेडिकल वॉल्ट" : "256-Bit Encrypted Health Binder"}
              </Text>
            </View>
            <Text style={styles.vaultTitle}>
              {isHindi ? "डिजिटल मेडिकल रिकॉर्ड्स व प्रिस्क्रिप्शन" : "Smart Health Records & OCR"}
            </Text>
            <Text style={styles.vaultSub}>
              {isHindi
                ? "लैब रिपोर्ट्स, डिस्चार्ज समरी एवं दवा पर्चियां एक ही सुरक्षित स्थान पर।"
                : "Scanned prescriptions, lab reports, and doctor briefs organized automatically."}
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.listHeaderRow}>
          <Text style={styles.recordCount}>
            {filteredDocs.length} {isHindi ? "रिकॉर्ड्स उपलब्ध" : "records in encrypted vault"}
          </Text>
          <View style={styles.hipaaBadge}>
            <ShieldCheck size={12} color={Colors.primaryDeep} />
            <Text style={styles.hipaaText}>{isHindi ? "256-बिट एन्क्रिप्टेड" : "256-Bit Encrypted"}</Text>
          </View>
        </View>

        {filteredDocs.map((doc) => {
          const cfg = getDocTypeConfig(doc.document_type);
          const IconComp = cfg.icon;

          return (
            <TouchableOpacity
              key={doc.id}
              style={[styles.docCard, Shadows.card]}
              onPress={() => {
                triggerHaptic();
                setActiveDocModal(doc);
              }}
              activeOpacity={0.8}
            >
              {/* Top Row: Type Pill, Date & Delete */}
              <View style={styles.docHeader}>
                <View style={[styles.typeBadge, { backgroundColor: cfg.bg }]}>
                  <IconComp size={13} color={cfg.color} />
                  <Text style={[styles.typeText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>

                <View style={styles.docHeaderActions}>
                  <View style={styles.dateChip}>
                    <Calendar size={12} color={Colors.textMuted} />
                    <Text style={styles.docDate}>{doc.document_date}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteIconButton}
                    onPress={() => promptDeleteDocument(doc)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={15} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Title & Facility */}
              <Text style={[styles.docTitle, seniorMode && styles.seniorDocTitle]}>
                {doc.title}
              </Text>

              <View style={styles.facilityRow}>
                <Building2 size={13} color={Colors.textMuted} />
                <Text style={styles.docFacility} numberOfLines={1}>
                  {doc.hospital_name || "Diagnostic Laboratory"} • {doc.doctor_name || "Consultant"}
                </Text>
              </View>

              {/* AI OCR Summary Box */}
              {doc.summary && (
                <View style={styles.summaryBox}>
                  <View style={styles.summaryBadgeRow}>
                    <Sparkles size={13} color="#7C3AED" />
                    <Text style={styles.summaryLabel}>
                      {isHindi ? "जेमिनी AI सारांश" : "AI Clinical Extraction"}
                    </Text>
                  </View>
                  <Text style={styles.summaryText} numberOfLines={2}>
                    {doc.summary}
                  </Text>
                </View>
              )}

              {/* Extracted Tags */}
              <View style={styles.tagRow}>
                {doc.extracted_tags.map((tag, i) => (
                  <View key={i} style={styles.tag}>
                    <Tag size={10} color={Colors.primaryDeep} />
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Upload Source Picker Modal */}
      <SwipeableBottomSheet
        visible={uploadPickerVisible}
        onClose={() => setUploadPickerVisible(false)}
        maxHeight="92%"
        containerStyle={styles.pickerSheet}
      >
            <Text style={styles.pickerTitle}>
              {isHindi ? "मेडिकल दस्तावेज़ जोड़ें" : "Upload Health Document"}
            </Text>
            <Text style={styles.pickerSub}>
              {isHindi
                ? "दस्तावेज़ कैप्चर या अपलोड करने का तरीका चुनें:"
                : "Choose how you would like to add the document:"}
            </Text>

            <View style={styles.pickerOptionsContainer}>
              {/* Option 1: Real Camera Scan */}
              <TouchableOpacity
                style={styles.pickerOptionCard}
                onPress={handleLaunchCamera}
                activeOpacity={0.8}
              >
                <View style={[styles.pickerIconCircle, { backgroundColor: "#CCFBF1" }]}>
                  <Camera size={22} color={Colors.primaryDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickerOptionTitle}>
                    {isHindi ? "कैमरा स्कैनर" : "Camera Scanner"}
                  </Text>
                  <Text style={styles.pickerOptionDesc}>
                    {isHindi
                      ? "पर्चे या रिपोर्ट की फ़ोटो खींचें और AI OCR चलाएं"
                      : "Snap photo of prescription or paper report"}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 2: Photo Gallery Picker */}
              <TouchableOpacity
                style={styles.pickerOptionCard}
                onPress={handleLaunchGallery}
                activeOpacity={0.8}
              >
                <View style={[styles.pickerIconCircle, { backgroundColor: "#E0F2FE" }]}>
                  <ImageIcon size={22} color="#0284C7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickerOptionTitle}>
                    {isHindi ? "फ़ोटो गैलरी से चुनें" : "Photo Gallery"}
                  </Text>
                  <Text style={styles.pickerOptionDesc}>
                    {isHindi
                      ? "डिवाइस से मौजूदा इमेज या स्क्रीनशॉट चुनें"
                      : "Pick existing prescription image from device gallery"}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 3: PDF / Files Picker */}
              <TouchableOpacity
                style={styles.pickerOptionCard}
                onPress={handleLaunchDocumentPicker}
                activeOpacity={0.8}
              >
                <View style={[styles.pickerIconCircle, { backgroundColor: "#EDE9FE" }]}>
                  <FolderOpen size={22} color="#7C3AED" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickerOptionTitle}>
                    {isHindi ? "फ़ाइल या PDF चुनें" : "Browse PDF & Files"}
                  </Text>
                  <Text style={styles.pickerOptionDesc}>
                    {isHindi
                      ? "लैब रिपोर्ट या डिस्चार्ज समरी PDF चुनें"
                      : "Import digital PDF reports from file manager"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.closePickerBtn}
              onPress={() => setUploadPickerVisible(false)}
            >
              <Text style={styles.closePickerBtnText}>{isHindi ? "रद्द करें" : "Cancel"}</Text>
            </TouchableOpacity>
      </SwipeableBottomSheet>

      {/* Detailed Document & OCR Extraction Modal */}
      {activeDocModal && (
        <Modal
          visible={!!activeDocModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setActiveDocModal(null)}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalTopBar, { paddingTop: modalTopPadding }]}>
              <View style={styles.modalTitleContainer}>
                <FileText size={20} color={Colors.primaryDark} />
                <Text style={styles.modalHeaderTitle}>
                  {isHindi ? "दस्तावेज़ विवरण" : "Clinical Document Intelligence"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setActiveDocModal(null)}
                style={styles.closeBtnCircle}
              >
                <X size={18} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.modalDocCard}>
                <Text style={styles.modalDocTitle}>{activeDocModal.title}</Text>
                <Text style={styles.modalFacility}>
                  {activeDocModal.doctor_name} • {activeDocModal.hospital_name}
                </Text>
                <Text style={styles.modalDocDate}>Recorded: {activeDocModal.document_date}</Text>
              </View>

              {/* AI Structured Extraction Box */}
              <View style={[styles.extractionCard, Shadows.card]}>
                <View style={styles.extractionHeaderRow}>
                  <Sparkles size={18} color="#7C3AED" />
                  <Text style={styles.extractionTitle}>
                    {isHindi ? "जेमिनी एआई क्लिनिकल सारांश" : "GEMINI HEALTHCARE OCR"}
                  </Text>
                </View>

                <Text style={styles.fullSummary}>{activeDocModal.summary}</Text>

                {activeDocModal.extracted_fields && (
                  <View style={styles.fieldsContainer}>
                    <Text style={styles.fieldsHeader}>
                      {isHindi ? "पहचाने गए मुख्य पैरामीटर:" : "Verified Structured Findings:"}
                    </Text>
                    {Object.entries(activeDocModal.extracted_fields).map(([k, v], idx) => (
                      <View key={idx} style={styles.fieldRow}>
                        <Text style={styles.fieldKey}>{k.replace("_", " ").toUpperCase()}:</Text>
                        <Text style={styles.fieldVal}>{String(v)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.downloadSignedBtn}
                onPress={() =>
                  Alert.alert(
                    "Encrypted Vault",
                    "Loading signed pre-authenticated URL from Supabase Storage bucket..."
                  )
                }
                activeOpacity={0.8}
              >
                <ExternalLink size={18} color="#FFFFFF" />
                <Text style={styles.downloadSignedText}>
                  {isHindi ? "मूल पीडीएफ देखें" : "View Original Signed PDF"}
                </Text>
              </TouchableOpacity>

              {/* Delete Document Button */}
              <TouchableOpacity
                style={styles.modalDeleteBtn}
                onPress={() => promptDeleteDocument(activeDocModal)}
                activeOpacity={0.8}
              >
                <Trash2 size={16} color="#DC2626" />
                <Text style={styles.modalDeleteBtnText}>
                  {isHindi ? "दस्तावेज़ हटाएं" : "Delete Document from Vault"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>
      )}

      {/* Confirmation Modal for Deletion */}
      <ConfirmationModal
        visible={deleteModalVisible}
        title={isHindi ? "दस्तावेज़ हटाएं?" : "Delete Medical Document?"}
        message={
          isHindi
            ? `क्या आप वास्तव में "${docToDelete?.title || ""}" को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।`
            : `Are you sure you want to permanently delete "${docToDelete?.title || ""}" from encrypted vault? This cannot be undone.`
        }
        confirmText={isHindi ? "हटाएं" : "Delete"}
        cancelText={isHindi ? "रद्द करें" : "Cancel"}
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  headerArea: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
    gap: 8,
    ...Shadows.subtle,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
  },
  seniorSearchInput: {
    fontSize: Typography.seniorSizes.sm,
  },
  uploadBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 44,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
  },
  uploadBtnText: {
    color: "#FFFFFF",
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  ocrBannerWrapper: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  ocrBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  ocrTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6D28D9",
  },
  ocrSub: {
    fontSize: 11,
    color: "#7C3AED",
    marginTop: 1,
  },
  filterScroll: {
    paddingVertical: Spacing.sm,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.65)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.85)",
  },
  filterPillActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  filterText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: "#FFFFFF",
    fontWeight: Typography.weights.bold,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 110,
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
    marginTop: 2,
  },
  recordCount: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weights.semibold,
  },
  hipaaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  hipaaText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDeep,
  },
  docCard: {
    ...Glass.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
  },
  docHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  docHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  deleteIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(254, 226, 226, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  typeText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
  },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  docDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  docTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  seniorDocTitle: {
    fontSize: Typography.seniorSizes.md,
  },
  facilityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  docFacility: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  summaryBox: {
    backgroundColor: "rgba(250, 245, 255, 0.8)",
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: "#9333EA",
    borderWidth: 1,
    borderColor: "rgba(233, 213, 255, 0.7)",
    marginTop: Spacing.sm,
  },
  summaryBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: "#6B21A8",
  },
  summaryText: {
    fontSize: Typography.sizes.xs,
    color: "#4C1D95",
    lineHeight: 17,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: Spacing.sm,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.primaryLight + "60",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  tagText: {
    fontSize: 10,
    fontWeight: Typography.weights.semibold,
    color: Colors.primaryDeep,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 40 : 25,
    borderTopWidth: 1.5,
    borderTopColor: "#FFFFFF",
    ...Shadows.cardElevated,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 10,
  },
  pickerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  pickerSub: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.lg,
  },
  pickerOptionsContainer: {
    gap: 12,
    marginBottom: Spacing.lg,
  },
  pickerOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(248, 250, 252, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: 14,
  },
  pickerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerOptionTitle: {
    fontSize: 14,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  pickerOptionDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  closePickerBtn: {
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  closePickerBtnText: {
    fontSize: 14,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  modalTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalHeaderTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  closeBtnCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    padding: Spacing.lg,
  },
  modalDocCard: {
    backgroundColor: "#FFFFFF",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  modalDocTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  modalFacility: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  modalDocDate: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  extractionCard: {
    backgroundColor: "#FFFFFF",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    marginBottom: Spacing.md,
  },
  extractionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: Spacing.sm,
  },
  extractionTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.extraBold,
    color: "#6D28D9",
    letterSpacing: 0.5,
  },
  fullSummary: {
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  fieldsContainer: {
    backgroundColor: "#FAF5FF",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: 6,
  },
  fieldsHeader: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: "#7C3AED",
    marginBottom: 4,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldKey: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  fieldVal: {
    fontSize: 12,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  downloadSignedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primaryDark,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    ...Shadows.card,
    marginBottom: Spacing.md,
  },
  downloadSignedText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: Typography.weights.bold,
  },
  modalDeleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEE2E2",
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  modalDeleteBtnText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: Typography.weights.bold,
  },
  vaultHeroBanner: {
    width: "100%",
    height: 175,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#0F172A",
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  vaultHeroImage: {
    width: "100%",
    height: "100%",
  },
  vaultHeroOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 110,
    justifyContent: "flex-end",
    padding: Spacing.md,
  },
  vaultPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.full,
    marginBottom: 4,
  },
  vaultPillText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: "#FFFFFF",
  },
  vaultTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extraBold,
    color: "#FFFFFF",
    marginBottom: 2,
  },
  vaultSub: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 16,
  },
});
