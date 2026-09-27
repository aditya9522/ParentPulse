// apps/mobile/src/components/MedicineCard.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Pill, CheckCircle2, Clock, AlertTriangle, User, Circle, Trash2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { MedicineSchedule } from "../types";
import { Colors, Typography, Spacing, Shadows, BorderRadius, Glass } from "../theme";
import { useApp } from "../context/AppContext";

export const MedicineCard: React.FC<{
  medicine: MedicineSchedule;
  onDelete?: (medicine: MedicineSchedule) => void;
}> = ({ medicine, onDelete }) => {
  const { seniorMode, language, dosesTakenToday, markDoseTaken } = useApp();
  const isTaken = !!dosesTakenToday[medicine.id];
  const isLowInventory = medicine.current_inventory <= medicine.refill_alert_threshold;

  const handleToggle = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // safe fallback on platforms without haptic engine
    }
    markDoseTaken(medicine.id);
  };

  const getInstructionBadge = () => {
    switch (medicine.instructions) {
      case "after_food":
        return { label: language === "hi" ? "भोजन के बाद" : "After Food", color: Colors.secondary, bg: "rgba(224, 242, 254, 0.85)" };
      case "before_food":
        return { label: language === "hi" ? "भोजन से पहले" : "Before Food", color: Colors.warningDark, bg: "rgba(254, 243, 199, 0.85)" };
      case "with_food":
        return { label: language === "hi" ? "भोजन के साथ" : "With Food", color: Colors.primaryDark, bg: "rgba(204, 251, 241, 0.85)" };
      case "empty_stomach":
        return { label: language === "hi" ? "खाली पेट" : "Empty Stomach", color: "#7C3AED", bg: "rgba(237, 233, 254, 0.85)" };
      default:
        return { label: "As Directed", color: Colors.textSecondary, bg: "rgba(241, 245, 249, 0.85)" };
    }
  };

  const inst = getInstructionBadge();

  return (
    <View style={[styles.card, isTaken ? styles.cardTaken : styles.cardPending]}>
      {/* Left Pill Icon / Indicator */}
      <View style={[styles.pillIconBox, isTaken ? styles.pillIconBoxTaken : styles.pillIconBoxPending]}>
        <Pill
          size={22}
          color={isTaken ? Colors.successDark : Colors.primaryDark}
          strokeWidth={2.2}
        />
      </View>

      {/* Center Details */}
      <View style={styles.centerContent}>
        <View style={styles.titleRow}>
          <Text style={[styles.medName, seniorMode && styles.seniorMedName]}>
            {medicine.name}
          </Text>
          <View style={styles.dosageBadge}>
            <Text style={styles.dosageText}>{medicine.dosage}</Text>
          </View>
        </View>

        {/* Schedule & Food Timing Badges */}
        <View style={styles.timingRow}>
          <View style={styles.scheduleBadge}>
            <Clock size={12} color={Colors.primaryDeep} />
            <Text style={styles.scheduleText}>{medicine.schedule_times.join(", ")}</Text>
          </View>

          <View style={[styles.instructionBadge, { backgroundColor: inst.bg }]}>
            <Text style={[styles.instructionText, { color: inst.color }]}>{inst.label}</Text>
          </View>
        </View>

        {medicine.reason && (
          <Text style={styles.reasonText} numberOfLines={1}>
            {language === "hi" ? "कारण: " : "For: "}
            {medicine.reason}
          </Text>
        )}

        {/* Bottom Alerts and Doctor Info */}
        <View style={styles.footerRow}>
          {isLowInventory && (
            <View style={styles.refillBadge}>
              <AlertTriangle size={12} color="#B45309" />
              <Text style={styles.refillText}>
                {language === "hi" ? `बची: ${medicine.current_inventory}` : `Low: ${medicine.current_inventory} pills`}
              </Text>
            </View>
          )}
          {medicine.prescribing_doctor && (
            <View style={styles.doctorInfoRow}>
              <User size={11} color={Colors.textMuted} />
              <Text style={styles.doctorText} numberOfLines={1}>
                {medicine.prescribing_doctor}
              </Text>
            </View>
          )}
          {onDelete && (
            <TouchableOpacity
              style={styles.deleteIconButton}
              onPress={() => onDelete(medicine)}
              activeOpacity={0.7}
              accessibilityLabel={`Delete ${medicine.name}`}
            >
              <Trash2 size={13} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Right Interactive Take Button */}
      <TouchableOpacity
        style={[
          styles.actionBtn,
          isTaken ? styles.actionBtnTaken : styles.actionBtnPending,
          seniorMode && styles.seniorActionBtn,
        ]}
        onPress={handleToggle}
        activeOpacity={0.75}
        accessibilityLabel={`Mark ${medicine.name} as ${isTaken ? "not taken" : "taken"}`}
      >
        {isTaken ? (
          <CheckCircle2 size={seniorMode ? 22 : 18} color="#FFFFFF" strokeWidth={2.5} />
        ) : (
          <Circle size={seniorMode ? 22 : 18} color="#FFFFFF" strokeWidth={2} />
        )}
        <Text style={[styles.actionBtnText, seniorMode && styles.seniorActionBtnText]}>
          {isTaken ? (language === "hi" ? "ली गई" : "TAKEN") : (language === "hi" ? "लें" : "TAKE")}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardPending: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.95)",
  },
  cardTaken: {
    backgroundColor: "rgba(240, 253, 244, 0.92)",
    borderWidth: 1.2,
    borderColor: "rgba(134, 239, 172, 0.9)",
  },
  pillIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
  },
  pillIconBoxPending: {
    backgroundColor: "rgba(204, 251, 241, 0.75)",
  },
  pillIconBoxTaken: {
    backgroundColor: "rgba(209, 250, 229, 0.85)",
  },
  centerContent: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  medName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  seniorMedName: {
    fontSize: Typography.seniorSizes.md,
  },
  dosageBadge: {
    backgroundColor: "rgba(241, 245, 249, 0.85)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
  },
  dosageText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  timingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 4,
  },
  scheduleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(204, 251, 241, 0.65)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  scheduleText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDeep,
  },
  instructionBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  instructionText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
  },
  reasonText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  refillBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(254, 243, 199, 0.85)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  refillText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: "#B45309",
  },
  doctorInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  doctorText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  deleteIconButton: {
    padding: 3,
    marginLeft: 6,
    borderRadius: 6,
    backgroundColor: "rgba(241, 245, 249, 0.7)",
  },
  actionBtn: {
    minWidth: 80,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 2,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    ...Shadows.glowTeal,
  },
  seniorActionBtn: {
    minWidth: 92,
    height: 56,
  },
  actionBtnPending: {
    backgroundColor: Colors.primaryDark,
  },
  actionBtnTaken: {
    backgroundColor: Colors.successDark,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: 0.5,
  },
  seniorActionBtnText: {
    fontSize: 14,
  },
});

