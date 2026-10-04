// apps/mobile/src/components/AddMedicineModal.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { AppAlert as Alert } from "../services/appAlert";
import { SwipeableBottomSheet } from "./SwipeableBottomSheet";
import * as Haptics from "expo-haptics";
import * as Crypto from "expo-crypto";
import { Pill, X, Plus, Clock } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useApp } from "../context/AppContext";
import { MedicineSchedule } from "../types";
import { Colors, Typography, Spacing, Shadows, BorderRadius, Gradients, createThemedStyles } from "../theme";

interface AddMedicineModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddMedicineModal: React.FC<AddMedicineModalProps> = ({ visible, onClose }) => {
  const { activeParent, addMedicine, seniorMode, language } = useApp();
  const isHindi = language === "hi";

  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [form, setForm] = useState("");
  const [scheduleTime1, setScheduleTime1] = useState("08:30 AM");
  const [scheduleTime2, setScheduleTime2] = useState("08:30 PM");
  const [showPicker1, setShowPicker1] = useState(false);
  const [showPicker2, setShowPicker2] = useState(false);
  const [instructions, setInstructions] = useState<MedicineSchedule["instructions"]>("after_food");
  const [prescribingDoctor, setPrescribingDoctor] = useState(
    activeParent.primary_doctors[0]?.name || ""
  );
  const [reason, setReason] = useState("");
  const [inventory, setInventory] = useState("");
  const [refillThreshold, setRefillThreshold] = useState("");

  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const hoursStr = hours < 10 ? `0${hours}` : `${hours}`;
    return `${hoursStr}:${minutesStr} ${ampm}`;
  };

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(style);
      }
    } catch {}
  };

  const handleSave = () => {
    const timePattern = /^(0?[1-9]|1[0-2]):[0-5]\d\s*(AM|PM)$/i;
    const stock = Number.parseInt(inventory, 10);
    const threshold = Number.parseInt(refillThreshold, 10);
    if (
      !name.trim() ||
      !dosage.trim() ||
      !form.trim() ||
      !timePattern.test(scheduleTime1.trim()) ||
      (scheduleTime2.trim() && !timePattern.test(scheduleTime2.trim())) ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      !Number.isInteger(threshold) ||
      threshold < 0
    ) {
      Alert.alert(
        "Check medicine details",
        "Enter the medicine, dosage, form, a valid first dose time, and non-negative stock values.",
      );
      return;
    }

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    const times = [scheduleTime1.trim(), scheduleTime2.trim()].filter(Boolean);

    const newMed: MedicineSchedule = {
      id: Crypto.randomUUID(),
      parent_id: activeParent.id,
      name: name.trim(),
      dosage: dosage.trim(),
      form: form.trim(),
      frequency_times_per_day: times.length,
      schedule_times: times,
      instructions,
      prescribing_doctor: prescribingDoctor.trim(),
      reason: reason.trim(),
      start_date: new Date().toISOString().split("T")[0],
      current_inventory: stock,
      refill_alert_threshold: threshold,
      is_active: true,
    };

    addMedicine(newMed);
    setName("");
    setDosage("");
    setForm("");
    setScheduleTime1("");
    setScheduleTime2("");
    setReason("");
    setInventory("");
    setRefillThreshold("");
    onClose();
  };

  const instructionOptions: { id: MedicineSchedule["instructions"]; label: string; hindiLabel: string }[] = [
    { id: "after_food", label: "After Food", hindiLabel: "भोजन के बाद" },
    { id: "before_food", label: "Before Food", hindiLabel: "भोजन से पहले" },
    { id: "with_food", label: "With Food", hindiLabel: "भोजन के साथ" },
    { id: "empty_stomach", label: "Empty Stomach", hindiLabel: "खाली पेट" },
  ];

  return (
    <SwipeableBottomSheet
      visible={visible}
      onClose={onClose}
      maxHeight="92%"
      testID="add-medicine-modal"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheetContainer}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIconCircle}>
              <Pill size={22} color={Colors.primaryDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, seniorMode && styles.seniorHeaderTitle]}>
                {isHindi ? "नई दवा जोड़ें" : "Add New Medication"}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isHindi ? "शेड्यूल और खुराक रिमाइंडर सेट करें" : "Set schedule and dosage reminders"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}>
            {/* Medicine Name */}
            <Text style={styles.fieldLabel}>
              {isHindi ? "दवा का नाम *" : "Medicine Name *"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={isHindi ? "दवा का नाम" : "Medicine name"}
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            {/* Dosage & Form Row */}
            <View style={styles.twoColRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>{isHindi ? "खुराक" : "Dosage"}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="500 mg / 10 ml"
                  placeholderTextColor={Colors.textMuted}
                  value={dosage}
                  onChangeText={setDosage}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>{isHindi ? "प्रकार" : "Form"}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tablet / Capsule"
                  placeholderTextColor={Colors.textMuted}
                  value={form}
                  onChangeText={setForm}
                />
              </View>
            </View>

            {/* Food Instruction Chips */}
            <Text style={styles.fieldLabel}>
              {isHindi ? "भोजन निर्देश" : "Timing & Food Instruction"}
            </Text>
            <View style={styles.chipsRow}>
              {instructionOptions.map((opt) => {
                const isSelected = instructions === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.instructionChip, isSelected && styles.instructionChipActive]}
                    onPress={() => {
                      triggerHaptic();
                      setInstructions(opt.id);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.instructionChipText,
                        isSelected && styles.instructionChipTextActive,
                      ]}
                    >
                      {isHindi ? opt.hindiLabel : opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Schedule Times */}
            <Text style={styles.fieldLabel}>
              {isHindi ? "दवा का समय (टाइम पिकर से चुनें)" : "Schedule Times (Pick Exact Times)"}
            </Text>
            <View style={styles.twoColRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputHint}>{isHindi ? "सुबह / पहली खुराक" : "Morning / 1st Dose"}</Text>
                <TouchableOpacity
                  style={styles.timePickerBtn}
                  onPress={() => setShowPicker1(true)}
                  activeOpacity={0.8}
                >
                  <Clock size={16} color={Colors.primary} />
                  <Text style={styles.timePickerBtnText}>{scheduleTime1 || "Select Time"}</Text>
                </TouchableOpacity>

                {showPicker1 && (
                  <DateTimePicker
                    value={new Date()}
                    mode="time"
                    is24Hour={false}
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onValueChange={(event, selectedDate) => {
                      setShowPicker1(false);
                      if (selectedDate) {
                        setScheduleTime1(formatTime(selectedDate));
                      }
                    }}
                    onDismiss={() => setShowPicker1(false)}
                  />
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.inputHint}>{isHindi ? "रात / दूसरी खुराक" : "Night / 2nd Dose"}</Text>
                <TouchableOpacity
                  style={styles.timePickerBtn}
                  onPress={() => setShowPicker2(true)}
                  activeOpacity={0.8}
                >
                  <Clock size={16} color={Colors.secondary} />
                  <Text style={styles.timePickerBtnText}>{scheduleTime2 || "Select Time"}</Text>
                </TouchableOpacity>

                {showPicker2 && (
                  <DateTimePicker
                    value={new Date()}
                    mode="time"
                    is24Hour={false}
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onValueChange={(event, selectedDate) => {
                      setShowPicker2(false);
                      if (selectedDate) {
                        setScheduleTime2(formatTime(selectedDate));
                      }
                    }}
                    onDismiss={() => setShowPicker2(false)}
                  />
                )}
              </View>
            </View>

            {/* Prescribing Doctor & Condition */}
            <Text style={styles.fieldLabel}>
              {isHindi ? "चिकित्सक / डॉक्टर" : "Prescribing Doctor"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Prescribing doctor (optional)"
              placeholderTextColor={Colors.textMuted}
              value={prescribingDoctor}
              onChangeText={setPrescribingDoctor}
            />

            <Text style={styles.fieldLabel}>
              {isHindi ? "उपचार का कारण" : "Condition / Medical Reason"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={isHindi ? "उदा. उच्च रक्तचाप नियंत्रण" : "e.g. Hypertension, Blood Sugar"}
              placeholderTextColor={Colors.textMuted}
              value={reason}
              onChangeText={setReason}
            />

            {/* Inventory Tracking */}
            <View style={styles.twoColRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>{isHindi ? "वर्तमान स्टॉक (गोलियां)" : "Current Stock (Units)"}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="30"
                  placeholderTextColor={Colors.textMuted}
                  value={inventory}
                  onChangeText={setInventory}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>{isHindi ? "रिफिल अलर्ट सीमा" : "Refill Alert At"}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="5"
                  placeholderTextColor={Colors.textMuted}
                  value={refillThreshold}
                  onChangeText={setRefillThreshold}
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!name.trim()}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={name.trim() ? Gradients.teal : ["#94A3B8", "#64748B"]}
                style={styles.saveBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Plus size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>
                  {isHindi ? "दवा शेड्यूल सुरक्षित करें" : "Save Medication Schedule"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SwipeableBottomSheet>
  );
};

const styles = createThemedStyles({
  sheetContainer: {
    backgroundColor: "transparent",
    paddingTop: 4,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: 12,
  },
  headerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  seniorHeaderTitle: {
    fontSize: Typography.seniorSizes.md,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scrollBody: {
    paddingBottom: 70,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  inputHint: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  twoColRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: Spacing.xs,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  instructionChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  instructionChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  instructionChipText: {
    fontSize: 11,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  instructionChipTextActive: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  saveBtn: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Shadows.glowTeal,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: Typography.weights.bold,
  },
  timePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  timePickerBtnText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.medium,
  },
});
