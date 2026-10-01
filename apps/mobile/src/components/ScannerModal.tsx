// apps/mobile/src/components/ScannerModal.tsx
import React, { useState, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  StatusBar,
  Animated,
  PanResponder,
  Image,
  TextInput,
  ScrollView,
  Linking,
} from "react-native";
import { AppAlert as Alert } from "../services/appAlert";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import {
  X,
  Camera,
  QrCode,
  Flashlight,
  FlashlightOff,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  ScanLine,
  Copy,
  ExternalLink,
  UploadCloud,
  Check,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius, Shadows, Glass } from "../theme";
import { useApp } from "../context/AppContext";
import { apiClient } from "../api/client";
import { DocumentType } from "../types";

interface ScannerModalProps {
  visible: boolean;
  mode?: "document" | "qr";
  onClose: () => void;
  onScanDocument?: (imageUri: string) => void;
  onScanQrCode?: (data: string) => void;
}

const DOC_TYPES: { id: DocumentType; label: string }[] = [
  { id: "prescription", label: "Prescription" },
  { id: "lab_report", label: "Lab Report" },
  { id: "radiology", label: "Radiology / X-Ray" },
  { id: "discharge_summary", label: "Discharge Summary" },
  { id: "hospital_bill", label: "Hospital Bill" },
  { id: "other", label: "Other" },
];

export const ScannerModal: React.FC<ScannerModalProps> = ({
  visible,
  mode = "document",
  onClose,
  onScanDocument,
  onScanQrCode,
}) => {
  const { activeParent, addDocument, language } = useApp();
  const isHindi = language === "hi";

  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const sheetPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        gesture.dy > 14 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) sheetTranslateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 60 || gesture.vy > 0.45) {
          Animated.timing(sheetTranslateY, {
            toValue: 900,
            duration: 220,
            useNativeDriver: true,
          }).start(() => {
            handleResetAndClose();
            sheetTranslateY.setValue(0);
          });
        } else {
          Animated.spring(sheetTranslateY, {
            toValue: 0,
            friction: 8,
            tension: 60,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const [activeMode, setActiveMode] = useState<"document" | "qr">(mode);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const insets = useSafeAreaInsets();

  // Scanned QR state
  const [scannedQrData, setScannedQrData] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Scanned Document state
  const [pendingDocUri, setPendingDocUri] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>("prescription");
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const topOffset = Platform.select({
    web: 12,
    ios: Math.max(insets.top, 16),
    android: (StatusBar.currentHeight || insets.top || 16) + 4,
    default: 12,
  });

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(style);
      }
    } catch {}
  };

  const handleResetAndClose = () => {
    setScannedQrData(null);
    setPendingDocUri(null);
    setCopied(false);
    setUploadingDoc(false);
    onClose();
  };

  const handleCaptureDocument = async () => {
    if (capturing) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    setCapturing(true);

    try {
      if (cameraRef.current && cameraRef.current.takePictureAsync) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.85,
          skipProcessing: false,
        });
        if (photo?.uri) {
          setPendingDocUri(photo.uri);
          setDocTitle(`Prescription - ${new Date().toLocaleDateString()}`);
          return;
        }
      }
      // Fallback via ImagePicker if takePictureAsync returns empty
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.85,
        allowsEditing: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPendingDocUri(result.assets[0].uri);
        setDocTitle(`Prescription - ${new Date().toLocaleDateString()}`);
      }
    } catch (err) {
      console.warn("Camera capture error:", err);
      Alert.alert(
        "Camera unavailable",
        "The image was not captured. Check camera permission or choose a photo from the gallery.",
      );
    } finally {
      setCapturing(false);
    }
  };

  const handlePickFromGallery = async () => {
    triggerHaptic();
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPendingDocUri(result.assets[0].uri);
        setDocTitle(`Medical Record - ${new Date().toLocaleDateString()}`);
      }
    } catch (err) {
      console.warn("Gallery picker error:", err);
    }
  };

  const handleBarcodeScanned = (scanningResult: { data: string; type: string }) => {
    if (activeMode !== "qr" || scannedQrData) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    setScannedQrData(scanningResult.data);
    onScanQrCode?.(scanningResult.data);
  };

  const handleCopyQr = async () => {
    if (!scannedQrData) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(scannedQrData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenQrLink = () => {
    if (!scannedQrData) return;
    triggerHaptic();
    Linking.canOpenURL(scannedQrData).then((supported) => {
      if (supported) {
        Linking.openURL(scannedQrData);
      } else {
        Alert.alert("Cannot open URL", scannedQrData);
      }
    });
  };

  const handleUploadDocument = async () => {
    if (!pendingDocUri) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    setUploadingDoc(true);

    try {
      const uploaded = await apiClient.uploadDocument({
        parentId: activeParent.id,
        familyId: activeParent.family_id,
        title: docTitle.trim() || `Medical Record - ${new Date().toLocaleDateString()}`,
        documentType: selectedDocType,
        documentDate: new Date().toISOString().slice(0, 10),
        uri: pendingDocUri,
        filename: `scan-${Date.now()}.jpg`,
        mimeType: "image/jpeg",
        doctorName: activeParent.primary_doctors[0]?.name,
        hospitalName: activeParent.primary_doctors[0]?.hospital_or_clinic,
      });

      addDocument(uploaded);
      onScanDocument?.(pendingDocUri);
      Alert.alert(
        isHindi ? "दस्तावेज़ सहेजा गया" : "Document Uploaded",
        isHindi
          ? "आपका मेडिकल रिकॉर्ड सुरक्षित रूप से सेव कर दिया गया है।"
          : "The medical document has been securely stored in health records.",
      );
      handleResetAndClose();
    } catch (err) {
      Alert.alert(
        "Upload failed",
        err instanceof Error ? err.message : "Could not upload document. Please check connection and try again.",
      );
    } finally {
      setUploadingDoc(false);
    }
  };

  const isUrl = scannedQrData && (scannedQrData.startsWith("http://") || scannedQrData.startsWith("https://"));

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleResetAndClose}>
      <View style={styles.modalBackdrop}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={handleResetAndClose} />
        <Animated.View
          {...sheetPanResponder.panHandlers}
          style={[styles.halfSheetContainer, { transform: [{ translateY: sheetTranslateY }] }]}
        >
          <View style={styles.grabHandle} />

          {/* Real Camera Preview */}
          {permission?.granted ? (
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              enableTorch={torchEnabled}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              onBarcodeScanned={activeMode === "qr" && !scannedQrData ? handleBarcodeScanned : undefined}
            />
          ) : (
            <View style={styles.permissionContainer}>
              <ScanLine size={48} color={Colors.primary} style={{ marginBottom: Spacing.md }} />
              <Text style={styles.permissionTitle}>Camera Access Required</Text>
              <Text style={styles.permissionSub}>
                ParentPulse uses your camera to scan prescriptions, lab reports, and doctor QR codes.
              </Text>
              <TouchableOpacity
                style={styles.grantBtn}
                onPress={() => requestPermission()}
                activeOpacity={0.8}
              >
                <Text style={styles.grantBtnText}>Allow Camera Permission</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.galleryFallbackBtn}
                onPress={handlePickFromGallery}
                activeOpacity={0.8}
              >
                <ImageIcon size={16} color={Colors.primaryDark} style={{ marginRight: 6 }} />
                <Text style={styles.galleryFallbackText}>Pick Photo from Gallery Instead</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Top Control Bar with Glassmorphic pill */}
          <View style={[styles.topBar, { top: topOffset }]}>
            <TouchableOpacity style={styles.closeBtn} onPress={handleResetAndClose} activeOpacity={0.8}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Mode Switcher: Document vs QR Code */}
            <View style={styles.modeTabs}>
              <TouchableOpacity
                style={[styles.modeTab, activeMode === "document" && styles.modeTabActive]}
                onPress={() => {
                  triggerHaptic();
                  setActiveMode("document");
                  setScannedQrData(null);
                }}
              >
                <Camera size={14} color={activeMode === "document" ? Colors.primaryDark : "#FFFFFF"} />
                <Text
                  style={[styles.modeTabText, activeMode === "document" && styles.modeTabTextActive]}
                >
                  Document Scan
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTab, activeMode === "qr" && styles.modeTabActive]}
                onPress={() => {
                  triggerHaptic();
                  setActiveMode("qr");
                  setPendingDocUri(null);
                }}
              >
                <QrCode size={14} color={activeMode === "qr" ? Colors.primaryDark : "#FFFFFF"} />
                <Text style={[styles.modeTabText, activeMode === "qr" && styles.modeTabTextActive]}>
                  Scan QR Code
                </Text>
              </TouchableOpacity>
            </View>

            {/* Flash Toggle */}
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => {
                triggerHaptic();
                setTorchEnabled((prev) => !prev);
              }}
              activeOpacity={0.8}
            >
              {torchEnabled ? (
                <Flashlight size={18} color="#FBBF24" />
              ) : (
                <FlashlightOff size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          {/* Viewfinder Frame (Only shown when not reviewing QR or Doc) */}
          {!scannedQrData && !pendingDocUri && (
            <View style={styles.viewfinderContainer} pointerEvents="none">
              <View
                style={[
                  styles.targetFrame,
                  activeMode === "qr" ? styles.qrFrame : styles.documentFrame,
                ]}
              >
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />

                <View style={styles.scanIndicatorBar}>
                  <Sparkles size={14} color="#38BDF8" style={{ marginRight: 6 }} />
                  <Text style={styles.scanGuideText}>
                    {activeMode === "qr"
                      ? "Align Doctor Brief QR within frame"
                      : "Fit prescription / lab report inside frame"}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Bottom Shutter & Controls Dock (Normal camera mode) */}
          {!scannedQrData && !pendingDocUri && (
            <View style={styles.bottomDock}>
              <TouchableOpacity
                style={styles.galleryBtn}
                onPress={handlePickFromGallery}
                activeOpacity={0.8}
              >
                <ImageIcon size={22} color="#FFFFFF" />
                <Text style={styles.galleryBtnText}>Gallery</Text>
              </TouchableOpacity>

              {activeMode === "document" ? (
                <TouchableOpacity
                  style={styles.shutterOuterRing}
                  onPress={handleCaptureDocument}
                  disabled={capturing}
                  activeOpacity={0.7}
                >
                  <View style={styles.shutterInnerCircle}>
                    {capturing ? (
                      <ActivityIndicator color={Colors.primary} size="small" />
                    ) : (
                      <View style={styles.shutterCenterDot} />
                    )}
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.qrAutoDetectBadge}>
                  <CheckCircle2 size={16} color="#10B981" style={{ marginRight: 6 }} />
                  <Text style={styles.qrAutoDetectText}>Auto-detecting QR...</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.galleryBtn}
                onPress={() => requestPermission()}
                activeOpacity={0.8}
              >
                <RefreshCw size={20} color="#FFFFFF" />
                <Text style={styles.galleryBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Interactive QR Scanned Result Card */}
          {scannedQrData && (
            <View style={styles.resultOverlay}>
              <View style={styles.resultCard}>
                <View style={styles.resultCardHeader}>
                  <View style={styles.qrResultIconBox}>
                    <QrCode size={20} color={Colors.primaryDark} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultCardTitle}>
                      {isHindi ? "QR कोड पहचाना गया" : "QR Code Detected"}
                    </Text>
                    <Text style={styles.resultCardSubtitle}>
                      {isHindi ? "सत्यापित डेटा सामग्री:" : "Scanned Content Payload:"}
                    </Text>
                  </View>
                </View>

                <View style={styles.qrDataBox}>
                  <ScrollView style={{ maxHeight: 110 }}>
                    <Text style={styles.qrDataText} selectable={true}>
                      {scannedQrData}
                    </Text>
                  </ScrollView>
                </View>

                <View style={styles.resultActionRow}>
                  <TouchableOpacity
                    style={[styles.resultActionBtn, copied && styles.resultActionBtnCopied]}
                    onPress={handleCopyQr}
                    activeOpacity={0.8}
                  >
                    {copied ? <Check size={16} color="#FFFFFF" /> : <Copy size={16} color={Colors.primaryDark} />}
                    <Text style={[styles.resultActionBtnText, copied && { color: "#FFFFFF" }]}>
                      {copied ? "Copied!" : "Copy"}
                    </Text>
                  </TouchableOpacity>

                  {isUrl && (
                    <TouchableOpacity
                      style={styles.resultActionBtnPrimary}
                      onPress={handleOpenQrLink}
                      activeOpacity={0.8}
                    >
                      <ExternalLink size={16} color="#FFFFFF" />
                      <Text style={styles.resultActionBtnPrimaryText}>Open Link</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.resultFooterRow}>
                  <TouchableOpacity
                    style={styles.scanAgainBtn}
                    onPress={() => setScannedQrData(null)}
                    activeOpacity={0.8}
                  >
                    <RefreshCw size={15} color={Colors.textSecondary} />
                    <Text style={styles.scanAgainText}>{isHindi ? "पुनः स्कैन करें" : "Scan Another"}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.doneBtn}
                    onPress={handleResetAndClose}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.doneBtnText}>{isHindi ? "पूर्ण" : "Done"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Interactive Document Review & Upload Card */}
          {pendingDocUri && (
            <View style={styles.resultOverlay}>
              <View style={styles.docConfirmCard}>
                <View style={styles.docConfirmHeader}>
                  <View style={styles.docConfirmIconBox}>
                    <UploadCloud size={20} color={Colors.primaryDark} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultCardTitle}>
                      {isHindi ? "दस्तावेज़ की पुष्टि करें" : "Review Scanned Document"}
                    </Text>
                    <Text style={styles.resultCardSubtitle}>
                      {isHindi ? "शीर्षक व प्रकार चुनें और रिकॉर्ड में सहेजें" : "Confirm title and category to save"}
                    </Text>
                  </View>
                </View>

                <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                  {/* Thumbnail Preview */}
                  <View style={styles.docThumbnailContainer}>
                    <Image source={{ uri: pendingDocUri }} style={styles.docThumbnail} resizeMode="contain" />
                  </View>

                  <Text style={styles.inputLabel}>{isHindi ? "दस्तावेज़ का शीर्षक" : "Document Title"}</Text>
                  <TextInput
                    style={styles.docTextInput}
                    value={docTitle}
                    onChangeText={setDocTitle}
                    placeholder="e.g. Dr. Mehta Cardiology Prescription"
                    placeholderTextColor="#94A3B8"
                  />

                  <Text style={styles.inputLabel}>{isHindi ? "दस्तावेज़ का प्रकार" : "Document Category"}</Text>
                  <View style={styles.docTypeRow}>
                    {DOC_TYPES.map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        style={[styles.docTypeChip, selectedDocType === t.id && styles.docTypeChipActive]}
                        onPress={() => setSelectedDocType(t.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.docTypeChipText, selectedDocType === t.id && styles.docTypeChipTextActive]}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <View style={styles.docFooterRow}>
                  <TouchableOpacity
                    style={styles.retakeBtn}
                    onPress={() => setPendingDocUri(null)}
                    disabled={uploadingDoc}
                    activeOpacity={0.8}
                  >
                    <RefreshCw size={15} color={Colors.textSecondary} />
                    <Text style={styles.retakeBtnText}>{isHindi ? "दोबारा लें" : "Retake"}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.uploadBtn, uploadingDoc && styles.uploadBtnDisabled]}
                    onPress={handleUploadDocument}
                    disabled={uploadingDoc}
                    activeOpacity={0.8}
                  >
                    {uploadingDoc ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <UploadCloud size={16} color="#FFFFFF" />
                        <Text style={styles.uploadBtnText}>{isHindi ? "अपलोड करें" : "Save to Records"}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "flex-end",
  },
  dismissArea: {
    flex: 1,
  },
  halfSheetContainer: {
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: "85%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  grabHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
    zIndex: 20,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    backgroundColor: "#0F172A",
  },
  permissionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: "#FFFFFF",
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  permissionSub: {
    fontSize: Typography.sizes.sm,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.lg,
    maxWidth: 280,
  },
  grantBtn: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  grantBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: Typography.weights.bold,
  },
  galleryFallbackBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  galleryFallbackText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: Typography.weights.semibold,
  },
  topBar: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  toolBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  modeTabs: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    borderRadius: 22,
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    gap: 4,
  },
  modeTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    gap: 5,
  },
  modeTabActive: {
    backgroundColor: "#FFFFFF",
  },
  modeTabText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: Typography.weights.semibold,
  },
  modeTabTextActive: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  viewfinderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  targetFrame: {
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 20,
    position: "relative",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: Spacing.md,
  },
  documentFrame: {
    width: "90%",
    aspectRatio: 0.72,
  },
  qrFrame: {
    width: 240,
    height: 240,
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: "#38BDF8",
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 18,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 18,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 18,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 18,
  },
  scanIndicatorBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  scanGuideText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: Typography.weights.medium,
  },
  bottomDock: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 40 : 25,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  galleryBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    width: 60,
  },
  galleryBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: Typography.weights.medium,
  },
  shutterOuterRing: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInnerCircle: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterCenterDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryDark,
  },
  qrAutoDetectBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.4)",
  },
  qrAutoDetectText: {
    color: "#A7F3D0",
    fontSize: 12,
    fontWeight: Typography.weights.bold,
  },
  resultOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
    zIndex: 30,
  },
  resultCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.cardElevated,
  },
  resultCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: Spacing.md,
  },
  qrResultIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  resultCardTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  resultCardSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  qrDataBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: Spacing.md,
  },
  qrDataText: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  resultActionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: Spacing.md,
  },
  resultActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.primaryLight,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  resultActionBtnCopied: {
    backgroundColor: Colors.success,
  },
  resultActionBtnText: {
    fontSize: 13,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  resultActionBtnPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.primaryDark,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  resultActionBtnPrimaryText: {
    fontSize: 13,
    fontWeight: Typography.weights.bold,
    color: "#FFFFFF",
  },
  resultFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  scanAgainBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  scanAgainText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.semibold,
  },
  doneBtn: {
    backgroundColor: Colors.primaryDark,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.md,
  },
  doneBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: Typography.weights.bold,
  },
  docConfirmCard: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.cardElevated,
  },
  docConfirmHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: Spacing.md,
  },
  docConfirmIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  docThumbnailContainer: {
    width: "100%",
    height: 120,
    backgroundColor: "#F1F5F9",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  docThumbnail: {
    width: "100%",
    height: "100%",
  },
  inputLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
    marginBottom: 4,
    marginTop: 6,
  },
  docTextInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  docTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: Spacing.md,
  },
  docTypeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  docTypeChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  docTypeChipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  docTypeChipTextActive: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  docFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 12,
  },
  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: "#F1F5F9",
  },
  retakeBtnText: {
    fontSize: 13,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  uploadBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primaryDark,
    paddingVertical: 11,
    borderRadius: BorderRadius.md,
  },
  uploadBtnDisabled: {
    opacity: 0.7,
  },
  uploadBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: Typography.weights.bold,
  },
});
