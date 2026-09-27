// apps/mobile/src/components/ConfirmationModal.tsx
import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { AlertTriangle, Trash2, X, Check, Info } from "lucide-react-native";
import { Colors, Typography, Spacing, Shadows, BorderRadius, Glass } from "../theme";

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  iconType?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = true,
  iconType = "danger",
  onConfirm,
  onCancel,
}) => {
  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(style);
      }
    } catch {}
  };

  const handleConfirm = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    onConfirm();
  };

  const handleCancel = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  const getIcon = () => {
    if (iconType === "danger") return <Trash2 size={24} color="#EF4444" />;
    if (iconType === "warning") return <AlertTriangle size={24} color="#F59E0B" />;
    return <Info size={24} color={Colors.primary} />;
  };

  const getIconBg = () => {
    if (iconType === "danger") return "#FEE2E2";
    if (iconType === "warning") return "#FEF3C7";
    return Colors.primaryLight;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={styles.dialogBox}>
          {/* Top Decorative Icon */}
          <View style={[styles.iconCircle, { backgroundColor: getIconBg() }]}>
            {getIcon()}
          </View>

          {/* Title and Message */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, isDestructive && styles.destructiveBtn]}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmBtnText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  dialogBox: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.95)",
    padding: Spacing.xl,
    alignItems: "center",
    ...Shadows.cardElevated,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  message: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(241, 245, 249, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(203, 213, 225, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.card,
  },
  destructiveBtn: {
    backgroundColor: "#DC2626",
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: Typography.weights.bold,
    color: "#FFFFFF",
  },
});
