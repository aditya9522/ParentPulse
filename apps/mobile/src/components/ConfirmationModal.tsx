// apps/mobile/src/components/ConfirmationModal.tsx
import React from "react";
import { Modal, View, Text, TouchableOpacity, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { AlertTriangle, Trash2, Info } from "lucide-react-native";
import { Colors, Typography, Spacing, Shadows, BorderRadius, createThemedStyles } from "../theme";
import { useApp } from "../context/AppContext";

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
  const { isDark, themeMode } = useApp();

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
    if (iconType === "danger") return isDark ? "rgba(239, 68, 68, 0.2)" : "#FEE2E2";
    if (iconType === "warning") return isDark ? "rgba(245, 158, 11, 0.2)" : "#FEF3C7";
    return isDark ? "rgba(20, 184, 166, 0.2)" : Colors.primaryLight;
  };

  const modalBoxBg = isDark
    ? "rgba(15, 23, 42, 0.95)"
    : themeMode === "amber"
    ? "rgba(255, 251, 245, 0.96)"
    : "rgba(255, 255, 255, 0.94)";
  const modalBoxBorder = isDark
    ? "rgba(51, 65, 85, 0.8)"
    : themeMode === "amber"
    ? "rgba(253, 230, 138, 0.7)"
    : "rgba(255, 255, 255, 0.95)";
  const cancelBg = isDark
    ? "rgba(30, 41, 59, 0.85)"
    : themeMode === "amber"
    ? "rgba(254, 243, 199, 0.6)"
    : "rgba(241, 245, 249, 0.8)";
  const cancelBorder = isDark
    ? "rgba(51, 65, 85, 0.8)"
    : themeMode === "amber"
    ? "rgba(253, 230, 138, 0.6)"
    : "rgba(203, 213, 225, 0.6)";
  const cancelTextColor = isDark ? "#CBD5E1" : Colors.textSecondary;
  const titleColor = isDark ? "#F8FAFC" : Colors.textPrimary;
  const messageColor = isDark ? "#94A3B8" : Colors.textSecondary;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={[styles.dialogBox, { backgroundColor: modalBoxBg, borderColor: modalBoxBorder }]}>
          {/* Top Decorative Icon */}
          <View style={[styles.iconCircle, { backgroundColor: getIconBg() }]}>
            {getIcon()}
          </View>

          {/* Title and Message */}
          <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
          <Text style={[styles.message, { color: messageColor }]}>{message}</Text>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: cancelBg, borderColor: cancelBorder }]}
              onPress={handleCancel}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelBtnText, { color: cancelTextColor }]}>{cancelText}</Text>
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

const styles = createThemedStyles({
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
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.95)",
    padding: Spacing.xl,
    alignItems: "center",
    ...Shadows.cardElevated,
    elevation: 0,
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
