// apps/mobile/src/components/AddMedicineModal.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SwipeableBottomSheet } from "./SwipeableBottomSheet";
import * as Haptics from "expo-haptics";
import { Pill, X, Clock, AlertCircle, Plus, User, Stethoscope } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "../context/AppContext";
import { MedicineSchedule } from "../types";
import { Colors, Typography, Spacing, Shadows, BorderRadius, Gradients } from "../theme";

interface AddMedicineModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddMedicineModal: React.FC<AddMedicineModalProps> = ({ visible, onClose }) => {
  const { activeParent, addMedicine, seniorMode, language } = useApp();
  const isHindi = language === "hi";

  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("500 mg");
  const [form, setForm] = useState("Tablet");
  const [frequency, setFrequency] = useState("2x Daily");
  const [scheduleTime1, setScheduleTime1] = useState("08:30 AM");
  const [scheduleTime2, setScheduleTime2] = useState("08:30 PM");
  const [instructions, setInstructions] = useState<MedicineSchedule["instructions"]>("after_food");
  const [prescribingDoctor, setPrescribingDoctor] = useState(
    activeParent.primary_doctors[0]?.name || "Dr. Arun Verma"
  );
  const [reason, setReason] = useState("");
  const [inventory, setInventory] = useState("30");
  const [refillThreshold, setRefillThreshold] = useState("6");

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(style);
      }
    } catch {}
  };

  const handleSave = () => {
    if (!name.trim()) return;

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    const times: string[] = [scheduleTime1];
    if (frequency === "2x Daily" || frequency === "3x Daily") {
      times.push(scheduleTime2);
    }
    if (frequency === "3x Daily") {
      times.push("02:00 PM");
    }

    const newMed: MedicineSchedule = {
      id: `med_${Date.now()}`,
      parent_id: activeParent.id,
      name: name.trim(),
      dosage: dosage.trim() || "1 tab",
      form,
      frequency_times_per_day: times.length,
      schedule_times: times,
      instructions,
      prescribing_doctor: prescribingDoctor.trim(),
      reason: reason.trim() || "Maintenance therapy",
      start_date: new Date().toISOString().split("T")[0],
      current_inventory: parseInt(inventory, 10) || 30,
      refill_alert_threshold: parseInt(refillThreshold, 10) || 5,
      is_active: true,
    };

    addMedicine(newMed);
    setName("");
    setReason("");
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

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Medicine Name */}
            <Text style={styles.fieldLabel}>
              {isHindi ? "दवा का नाम *" : "Medicine Name *"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={isHindi ? "उदा. Metformin 500mg" : "e.g. Metformin, Telmisartan"}
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
              {isHindi ? "दवा का समय" : "Schedule Times"}
            </Text>
            <View style={styles.twoColRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputHint}>{isHindi ? "सुबह / पहली खुराक" : "Morning / 1st Dose"}</Text>
                <TextInput
                  style={styles.input}
                  value={scheduleTime1}
                  onChangeText={setScheduleTime1}
                  placeholder="08:30 AM"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputHint}>{isHindi ? "रात / दूसरी खुराक" : "Night / 2nd Dose"}</Text>
                <TextInput
                  style={styles.input}
                  value={scheduleTime2}
                  onChangeText={setScheduleTime2}
                  placeholder="08:30 PM"
                />
              </View>
            </View>

            {/* Prescribing Doctor & Condition */}
            <Text style={styles.fieldLabel}>
              {isHindi ? "चिकित्सक / डॉक्टर" : "Prescribing Doctor"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Dr. Arun Verma (Cardiologist)"
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
                  value={inventory}
                  onChangeText={setInventory}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>{isHindi ? "रिफिल अलर्ट सीमा" : "Refill Alert At"}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
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

const styles = StyleSheet.create({
  sheetContainer: {
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "rgba(241, 245, 249, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollBody: {
    paddingBottom: Spacing.xl,
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
    backgroundColor: "rgba(248, 250, 252, 0.9)",
    borderWidth: 1.2,
    borderColor: "rgba(226, 232, 240, 0.9)",
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
    backgroundColor: "rgba(241, 245, 249, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
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
});
