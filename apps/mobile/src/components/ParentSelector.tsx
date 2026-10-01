// apps/mobile/src/components/ParentSelector.tsx
import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { Colors, Typography, Spacing, Shadows, BorderRadius, createThemedStyles } from "../theme";

export const ParentSelector: React.FC = () => {
  const { activeParent, parentList, setActiveParentId, seniorMode, language, setActiveScreen, isDark, themeMode } = useApp();

  const tabBg = isDark
    ? "rgba(30, 41, 59, 0.75)"
    : themeMode === "amber"
    ? "rgba(255, 251, 245, 0.85)"
    : "rgba(255, 255, 255, 0.65)";
  const tabBorder = isDark
    ? "rgba(51, 65, 85, 0.7)"
    : themeMode === "amber"
    ? "rgba(253, 230, 138, 0.6)"
    : "rgba(255, 255, 255, 0.85)";
  const addBtnBg = isDark
    ? "rgba(30, 41, 59, 0.7)"
    : themeMode === "amber"
    ? "rgba(255, 251, 245, 0.85)"
    : "rgba(255, 255, 255, 0.8)";
  const addBtnBorder = isDark
    ? "rgba(20, 184, 166, 0.4)"
    : themeMode === "amber"
    ? "rgba(217, 119, 6, 0.4)"
    : "rgba(13, 148, 136, 0.4)";
  const alertBg = isDark
    ? "rgba(120, 53, 15, 0.25)"
    : themeMode === "amber"
    ? "rgba(254, 243, 199, 0.85)"
    : "rgba(254, 243, 199, 0.85)";
  const alertBorder = isDark
    ? "rgba(245, 158, 11, 0.3)"
    : themeMode === "amber"
    ? "rgba(253, 230, 138, 0.7)"
    : "rgba(255, 255, 255, 0.8)";
  const alertLabelColor = isDark ? "#FBBF24" : "#92400E";
  const alertTextColor = isDark ? "#FDE68A" : "#78350F";

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={[styles.sectionTitle, seniorMode && styles.seniorTitle]}>
          {language === "hi" ? "देखभाल किए जाने वाले माता-पिता" : "Cared Parent Profiles"}
        </Text>
        <View style={styles.secureBadge}>
          <Ionicons name="shield-checkmark" size={13} color={Colors.primaryDeep} />
          <Text style={styles.secureText}>{language === "hi" ? "सुरक्षित" : "Active"}</Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        {parentList.map((parent) => {
          const isSelected = parent.id === activeParent.id;
          const isFather = parent.gender === "male";
          return (
            <TouchableOpacity
              key={parent.id}
              style={[
                styles.parentTab,
                Shadows.card,
                { backgroundColor: tabBg, borderColor: tabBorder },
                isSelected && styles.parentTabActive,
              ]}
              onPress={() => setActiveParentId(parent.id)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              {isFather ? (
                <Image
                  source={require("../../assets/parent_avatar.jpg")}
                  style={[styles.avatarImage, isSelected && styles.avatarImageActive]}
                />
              ) : (
                <View style={[styles.avatarCircle, isSelected && styles.avatarCircleActive]}>
                  <Ionicons name="person" size={18} color={isSelected ? "#FFFFFF" : Colors.primaryDark} />
                </View>
              )}

              <View style={styles.tabTextContainer}>
                <Text style={[styles.tabName, isSelected && styles.tabNameActive]} numberOfLines={1}>
                  {parent.full_name.split(" ")[0]} {isFather ? "(Papa)" : "(Maa)"}
                </Text>
                <Text style={styles.tabRole}>
                  {isFather
                    ? (language === "hi" ? "पिताजी • 72 वर्ष" : "Father • Age 72")
                    : (language === "hi" ? "माताजी • 68 वर्ष" : "Mother • Age 68")}
                </Text>
              </View>

              {isSelected && (
                <Ionicons name="checkmark-circle" size={18} color={Colors.primaryDark} />
              )}
            </TouchableOpacity>
          );
        })}

        {/* Add Parent / Care Circle Onboarding Launcher */}
        <TouchableOpacity
          style={[styles.addParentBtn, { backgroundColor: addBtnBg, borderColor: addBtnBorder }]}
          onPress={() => setActiveScreen("onboarding")}
          activeOpacity={0.8}
          accessibilityLabel="Add New Parent Profile"
        >
          <View style={styles.addParentIconCircle}>
            <Ionicons name="add" size={16} color={Colors.primaryDark} />
          </View>
          <Text style={styles.addParentBtnText}>
            {language === "hi" ? "नया" : "Add"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Critical Health Alerts Ribbon */}
      <View style={[styles.alertRibbon, { backgroundColor: alertBg, borderColor: alertBorder }]}>
        <Ionicons name="warning" size={16} color={isDark ? "#FBBF24" : "#B45309"} style={{ marginRight: 6 }} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.alertLabel, { color: alertLabelColor }]}>
            {language === "hi" ? "महत्वपूर्ण स्वास्थ्य सूचना:" : "Critical Health Conditions & Allergies:"}
          </Text>
          <Text style={[styles.alertText, { color: alertTextColor }]} numberOfLines={2}>
            Allergies: {activeParent.allergies.join(", ") || "None"} •{" "}
            {activeParent.chronic_conditions.join(" • ")}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = createThemedStyles({
  container: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  seniorTitle: {
    fontSize: Typography.seniorSizes.xs,
  },
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  secureText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDeep,
  },
  tabRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  parentTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.65)",
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.85)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 0,
  },
  parentTabActive: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(204, 251, 241, 0.65)",
    ...Shadows.glowTeal,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: Spacing.xs,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  avatarImageActive: {
    borderColor: Colors.primary,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(241, 245, 249, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  avatarCircleActive: {
    backgroundColor: Colors.primary,
  },
  tabTextContainer: {
    flex: 1,
  },
  tabName: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  tabNameActive: {
    color: Colors.primaryDeep,
  },
  tabRole: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  alertRibbon: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: Spacing.sm,
    backgroundColor: "rgba(254, 243, 199, 0.85)",
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  alertLabel: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: "#92400E",
    marginBottom: 1,
  },
  alertText: {
    fontSize: 11,
    color: "#78350F",
    lineHeight: 15,
  },
  addParentBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderWidth: 1.2,
    borderColor: "rgba(13, 148, 136, 0.4)",
    borderStyle: "dashed" as const,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
  },
  addParentIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  addParentBtnText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
});

