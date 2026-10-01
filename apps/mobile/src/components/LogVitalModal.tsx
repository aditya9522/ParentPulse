// apps/mobile/src/components/LogVitalModal.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native";
import { AppAlert as Alert } from "../services/appAlert";
import { SwipeableBottomSheet } from "./SwipeableBottomSheet";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import {
  Activity,
  Droplets,
  Heart,
  CheckCircle2,
  X,
  Plus,
  Minus,
  Info,
} from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { Colors, Spacing, Shadows, Gradients, createThemedStyles } from "../theme";

export const LogVitalModal: React.FC = () => {
  const {
    activeParent,
    logVitalModalVisible,
    setLogVitalModalVisible,
    logNewMeasurement,
    seniorMode,
    language,
  } = useApp();

  const isHindi = language === "hi";

  const [selectedType, setSelectedType] = useState<"blood_pressure" | "blood_sugar" | "heart_rate">("blood_pressure");
  const [systolic, setSystolic] = useState("125");
  const [diastolic, setDiastolic] = useState("80");
  const [bloodSugar, setBloodSugar] = useState("110");
  const [heartRate, setHeartRate] = useState("72");
  const [notes, setNotes] = useState(isHindi ? "सुबह की जांच" : "Morning check");

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(style);
      }
    } catch {
      // Graceful fallback
    }
  };

  const adjustValue = (
    field: "systolic" | "diastolic" | "bloodSugar" | "heartRate",
    delta: number
  ) => {
    triggerHaptic();
    if (field === "systolic") {
      const val = Math.max(70, Math.min(240, (parseInt(systolic) || 120) + delta));
      setSystolic(val.toString());
    } else if (field === "diastolic") {
      const val = Math.max(40, Math.min(140, (parseInt(diastolic) || 80) + delta));
      setDiastolic(val.toString());
    } else if (field === "bloodSugar") {
      const val = Math.max(40, Math.min(500, (parseInt(bloodSugar) || 100) + delta));
      setBloodSugar(val.toString());
    } else if (field === "heartRate") {
      const val = Math.max(40, Math.min(200, (parseInt(heartRate) || 72) + delta));
      setHeartRate(val.toString());
    }
  };

  const handleSave = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    if (selectedType === "blood_pressure") {
      const sys = parseFloat(systolic);
      const dia = parseFloat(diastolic);
      if (!sys || !dia) {
        Alert.alert(
          isHindi ? "त्रुटि" : "Input Error",
          isHindi
            ? "कृपया सही सिस्टोलिक और डायस्टोलिक मान दर्ज करें।"
            : "Please enter valid systolic and diastolic values."
        );
        return;
      }
      logNewMeasurement("blood_pressure", sys, dia, notes);
    } else if (selectedType === "blood_sugar") {
      const bs = parseFloat(bloodSugar);
      if (!bs) return;
      logNewMeasurement("blood_sugar", bs, undefined, notes);
    } else {
      const hr = parseFloat(heartRate);
      if (!hr) return;
      logNewMeasurement("heart_rate", hr, undefined, notes);
    }

    setLogVitalModalVisible(false);
    Alert.alert(
      isHindi ? "सफलतापूर्वक दर्ज!" : "Recorded!",
      isHindi
        ? "माप सफलतापूर्वक दर्ज की गई और फ़ैमिली डैशबोर्ड में सिंक हो गई।"
        : "Measurement logged and synced with family dashboard."
    );
  };

  return (
    <SwipeableBottomSheet
      visible={logVitalModalVisible}
      onClose={() => setLogVitalModalVisible(false)}
      maxHeight="92%"
      testID="log-vital-modal"
    >
      <View style={styles.modalBox}>

          <View style={styles.topRow}>
            <View>
              <Text style={styles.title}>
                {isHindi ? "स्वास्थ्य माप दर्ज करें" : "Log Vital Measurement"}
              </Text>
              <Text style={styles.sub}>
                {isHindi ? "रोगी:" : "Logging for"} {activeParent.full_name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic();
                setLogVitalModalVisible(false);
              }}
              style={styles.closeBtn}
              activeOpacity={0.8}
            >
              <X size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Type Selector Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tab, selectedType === "blood_pressure" && styles.tabActive]}
              onPress={() => {
                triggerHaptic();
                setSelectedType("blood_pressure");
              }}
              activeOpacity={0.85}
            >
              <Activity
                size={16}
                color={selectedType === "blood_pressure" ? Colors.primaryDark : Colors.textMuted}
              />
              <Text
                style={[styles.tabText, selectedType === "blood_pressure" && styles.tabTextActive]}
              >
                {isHindi ? "रक्तचाप" : "Blood Pressure"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, selectedType === "blood_sugar" && styles.tabActive]}
              onPress={() => {
                triggerHaptic();
                setSelectedType("blood_sugar");
              }}
              activeOpacity={0.85}
            >
              <Droplets
                size={16}
                color={selectedType === "blood_sugar" ? Colors.primaryDark : Colors.textMuted}
              />
              <Text
                style={[styles.tabText, selectedType === "blood_sugar" && styles.tabTextActive]}
              >
                {isHindi ? "ब्लड शुगर" : "Sugar"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, selectedType === "heart_rate" && styles.tabActive]}
              onPress={() => {
                triggerHaptic();
                setSelectedType("heart_rate");
              }}
              activeOpacity={0.85}
            >
              <Heart
                size={16}
                color={selectedType === "heart_rate" ? Colors.primaryDark : Colors.textMuted}
              />
              <Text
                style={[styles.tabText, selectedType === "heart_rate" && styles.tabTextActive]}
              >
                {isHindi ? "हार्ट रेट" : "Heart Rate"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 60 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          >
            {/* Form Inputs with Steppers */}
            {selectedType === "blood_pressure" && (
              <View>
                <View style={styles.bpRow}>
                  {/* Systolic */}
                  <View style={styles.inputCard}>
                    <Text style={styles.label}>
                      {isHindi ? "सिस्टोलिक (ऊपरी)" : "Systolic (Top)"}
                    </Text>
                    <View style={styles.stepperRow}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => adjustValue("systolic", -5)}
                      >
                        <Minus size={16} color={Colors.textPrimary} />
                      </TouchableOpacity>
                      <TextInput
                        style={[styles.numInput, seniorMode && styles.seniorNumInput]}
                        keyboardType="numeric"
                        value={systolic}
                        onChangeText={setSystolic}
                        placeholder="120"
                        placeholderTextColor={Colors.textMuted}
                      />
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => adjustValue("systolic", 5)}
                      >
                        <Plus size={16} color={Colors.textPrimary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.slash}>/</Text>

                  {/* Diastolic */}
                  <View style={styles.inputCard}>
                    <Text style={styles.label}>
                      {isHindi ? "डायस्टोलिक (निचला)" : "Diastolic (Bottom)"}
                    </Text>
                    <View style={styles.stepperRow}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => adjustValue("diastolic", -5)}
                      >
                        <Minus size={16} color={Colors.textPrimary} />
                      </TouchableOpacity>
                      <TextInput
                        style={[styles.numInput, seniorMode && styles.seniorNumInput]}
                        keyboardType="numeric"
                        value={diastolic}
                        onChangeText={setDiastolic}
                        placeholder="80"
                        placeholderTextColor={Colors.textMuted}
                      />
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => adjustValue("diastolic", 5)}
                      >
                        <Plus size={16} color={Colors.textPrimary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Clinical Reference Range Note */}
                <View style={styles.refBox}>
                  <Info size={13} color="#0D9488" />
                  <Text style={styles.refText}>
                    {isHindi
                      ? "सामान्य: < 120/80 mmHg • पूर्व-उच्च रक्तचाप: 120-139 / 80-89"
                      : "Optimal: < 120/80 mmHg • Pre-hypertensive: 120-139 / 80-89"}
                  </Text>
                </View>
              </View>
            )}

            {selectedType === "blood_sugar" && (
              <View>
                <View style={styles.inputCard}>
                  <Text style={styles.label}>
                    {isHindi ? "ब्लड ग्लूकोज (mg/dL)" : "Blood Glucose (mg/dL)"}
                  </Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => adjustValue("bloodSugar", -5)}
                    >
                      <Minus size={16} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.numInput, seniorMode && styles.seniorNumInput]}
                      keyboardType="numeric"
                      value={bloodSugar}
                      onChangeText={setBloodSugar}
                      placeholder="100"
                      placeholderTextColor={Colors.textMuted}
                    />
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => adjustValue("bloodSugar", 5)}
                    >
                      <Plus size={16} color={Colors.textPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.refBox}>
                  <Info size={13} color="#0D9488" />
                  <Text style={styles.refText}>
                    {isHindi
                      ? "फास्टिंग सामान्य: 70–100 mg/dL • भोजन के बाद: < 140 mg/dL"
                      : "Fasting normal: 70–100 mg/dL • Post-prandial: < 140 mg/dL"}
                  </Text>
                </View>
              </View>
            )}

            {selectedType === "heart_rate" && (
              <View>
                <View style={styles.inputCard}>
                  <Text style={styles.label}>
                    {isHindi ? "हार्ट रेट (धड़कन/मिनट)" : "Heart Rate (bpm)"}
                  </Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => adjustValue("heartRate", -2)}
                    >
                      <Minus size={16} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.numInput, seniorMode && styles.seniorNumInput]}
                      keyboardType="numeric"
                      value={heartRate}
                      onChangeText={setHeartRate}
                      placeholder="72"
                      placeholderTextColor={Colors.textMuted}
                    />
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => adjustValue("heartRate", 2)}
                    >
                      <Plus size={16} color={Colors.textPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.refBox}>
                  <Info size={13} color="#0D9488" />
                  <Text style={styles.refText}>
                    {isHindi
                      ? "सामान्य विश्राम गति: 60–100 bpm (स्वस्थ हृदय दर)"
                      : "Normal resting: 60–100 bpm for healthy adults"}
                  </Text>
                </View>
              </View>
            )}

            {/* Notes Input */}
            <View style={styles.notesGroup}>
              <Text style={styles.label}>
                {isHindi ? "टिप्पणी / संदर्भ" : "Context / Notes"}
              </Text>
              <TextInput
                style={styles.textInput}
                value={notes}
                onChangeText={setNotes}
                placeholder={
                  isHindi ? "उदा. विश्राम अवस्था, नाश्ते से पहले" : "e.g. Resting, before breakfast"
                }
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <LinearGradient
                colors={Gradients.teal}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveGradient}
              >
                <CheckCircle2 size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.saveBtnText}>
                  {isHindi ? "माप सुरक्षित करें" : "Save Measurement"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
      </View>
    </SwipeableBottomSheet>
  );
};

const styles = createThemedStyles({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  dismissArea: {
    flex: 1,
  },
  modalBox: {
    backgroundColor: "transparent",
    paddingHorizontal: Spacing.xl,
    paddingTop: 4,
    paddingBottom: 40,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  sub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(226, 232, 240, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.75)",
    padding: 3,
    borderRadius: 12,
    gap: 4,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  tabActive: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 1)",
    ...Shadows.subtle,
    elevation: 0,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primaryDark,
    fontWeight: "800",
  },
  bpRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  inputCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.85)",
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.subtle,
    elevation: 0,
  },
  slash: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.textMuted,
    marginTop: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 6,
    textAlign: "center",
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.95)",
    ...Shadows.subtle,
    elevation: 0,
  },
  numInput: {
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    color: Colors.textPrimary,
    minWidth: 50,
  },
  seniorNumInput: {
    fontSize: 28,
  },
  refBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(240, 253, 250, 0.75)",
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(204, 251, 241, 0.9)",
    gap: 6,
    marginBottom: Spacing.md,
  },
  refText: {
    flex: 1,
    fontSize: 11,
    color: "#0F766E",
    fontWeight: "600",
  },
  notesGroup: {
    marginBottom: Spacing.lg,
  },
  textInput: {
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.85)",
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  saveBtn: {
    borderRadius: 14,
    overflow: "hidden",
    ...Shadows.glowTeal,
  },
  saveGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
