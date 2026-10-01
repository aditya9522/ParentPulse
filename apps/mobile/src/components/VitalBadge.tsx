// apps/mobile/src/components/VitalBadge.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Activity, Droplets, Heart, Wind, Clock } from "lucide-react-native";
import { HealthMeasurement } from "../types";
import { Colors, Typography, Spacing, Shadows, BorderRadius, Glass } from "../theme";
import { useApp } from "../context/AppContext";

export const VitalBadge: React.FC<{ measurement: HealthMeasurement }> = ({ measurement }) => {
  const { seniorMode, language } = useApp();

  const getVitalConfig = () => {
    switch (measurement.vital_type) {
      case "blood_pressure":
        return {
          label: language === "hi" ? "ब्लड प्रेशर" : "Blood Pressure",
          icon: Activity,
          color: Colors.secondary,
          bgLight: "rgba(224, 242, 254, 0.8)",
          statusText: (measurement.value_numeric <= 130) ? "Optimal" : "Attention",
          statusColor: (measurement.value_numeric <= 130) ? Colors.successDark : Colors.warningDark,
        };
      case "blood_sugar":
        return {
          label: language === "hi" ? "ब्लड शुगर" : "Blood Sugar",
          icon: Droplets,
          color: Colors.warning,
          bgLight: "rgba(254, 243, 199, 0.8)",
          statusText: (measurement.value_numeric <= 130) ? "Normal" : "Elevated",
          statusColor: (measurement.value_numeric <= 130) ? Colors.successDark : Colors.warningDark,
        };
      case "heart_rate":
        return {
          label: language === "hi" ? "हार्ट रेट" : "Heart Rate",
          icon: Heart,
          color: "#EC4899",
          bgLight: "rgba(252, 231, 243, 0.8)",
          statusText: "Normal",
          statusColor: Colors.successDark,
        };
      case "oxygen_saturation":
        return {
          label: language === "hi" ? "ऑक्सीजन" : "SpO2 Level",
          icon: Wind,
          color: Colors.primaryDark,
          bgLight: "rgba(204, 251, 241, 0.8)",
          statusText: "98% Normal",
          statusColor: Colors.successDark,
        };
      default:
        return {
          label: language === "hi" ? "वाइटल" : "Vital Sign",
          icon: Activity,
          color: Colors.primaryDark,
          bgLight: "rgba(204, 251, 241, 0.8)",
          statusText: "Stable",
          statusColor: Colors.successDark,
        };
    }
  };

  const config = getVitalConfig();
  const IconComponent = config.icon;

  const getVitalDisplay = () => {
    if (measurement.vital_type === "blood_pressure" && measurement.value_secondary) {
      return `${Math.round(measurement.value_numeric)}/${Math.round(measurement.value_secondary)}`;
    }
    return `${measurement.value_numeric}`;
  };

  const formatFriendlyTime = (raw?: string) => {
    if (!raw) return language === "hi" ? "हाल ही में" : "Recent";
    if (raw === "Just now") return language === "hi" ? "अभी" : "Just now";
    const ts = Date.parse(raw);
    if (isNaN(ts)) return raw;
    const d = new Date(ts);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - d.getTime()) / (1000 * 60));
    if (diffMin < 2) return language === "hi" ? "अभी" : "Just now";
    if (diffMin < 60) return language === "hi" ? `${diffMin} मि पहले` : `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24 && d.getDate() === now.getDate()) {
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }
    if (diffHrs < 48) return language === "hi" ? "कल" : "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <View style={styles.card}>
      {/* Top Icon & Status Row */}
      <View style={styles.topRow}>
        <View style={[styles.iconBox, { backgroundColor: config.bgLight }]}>
          <IconComponent size={18} color={config.color} strokeWidth={2.5} />
        </View>
        <View style={[styles.statusChip, { backgroundColor: config.statusColor + "20" }]}>
          <Text style={[styles.statusChipText, { color: config.statusColor }]}>
            {config.statusText}
          </Text>
        </View>
      </View>

      <Text style={[styles.vitalLabel, seniorMode && styles.seniorVitalLabel]}>
        {config.label}
      </Text>

      {/* Main Measurement Value Display */}
      <View style={styles.valueRow}>
        <Text style={[styles.vitalValue, seniorMode && styles.seniorVitalValue]}>
          {getVitalDisplay()}
        </Text>
        <Text style={[styles.unitText, seniorMode && styles.seniorUnitText]}>
          {measurement.unit}
        </Text>
      </View>

      <View style={styles.timeRow}>
        <Clock size={11} color={Colors.textSubtle} />
        <Text style={styles.recordedTime}>{formatFriendlyTime(measurement.recorded_at)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.65)",
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.85)",
    minWidth: 140,
    flex: 1,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 0,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
  },
  statusChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
  },
  vitalLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weights.semibold,
  },
  seniorVitalLabel: {
    fontSize: Typography.seniorSizes.xs,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginTop: 2,
  },
  vitalValue: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  seniorVitalValue: {
    fontSize: Typography.seniorSizes.xxl,
  },
  unitText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.semibold,
  },
  seniorUnitText: {
    fontSize: Typography.seniorSizes.xs,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  recordedTime: {
    fontSize: 11,
    color: Colors.textSubtle,
  },
});

