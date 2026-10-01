// apps/mobile/src/screens/TimelineScreen.tsx
import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import {
  Stethoscope,
  FlaskConical,
  Pill,
  Activity,
  Share2,
  Calendar,
  Building2,
  User,
  Paperclip,
  CheckCircle2,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useApp } from "../context/AppContext";
import { TimelineEvent } from "../types";
import { Colors, Typography, Spacing, Shadows, BorderRadius, Gradients, Glass } from "../theme";

export const TimelineScreen: React.FC = () => {
  const { activeParent, timeline, seniorMode, setDoctorShareModalVisible, language } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const filterOptions = [
    { id: "all", label: language === "hi" ? "सभी घटनाएँ" : "All Milestones" },
    { id: "doctor_visit", label: language === "hi" ? "डॉक्टर विज़िट" : "Doctor Visits" },
    { id: "lab_test", label: language === "hi" ? "लैब टेस्ट" : "Lab Tests" },
    { id: "medicine_started", label: language === "hi" ? "दवाइयां" : "Medications" },
    { id: "surgery", label: language === "hi" ? "सर्जरी व प्रक्रियाएं" : "Surgeries" },
  ];

  const filteredEvents = timeline.filter((e) => {
    if (selectedFilter === "all") return true;
    return e.event_type === selectedFilter;
  });

  const getEventConfig = (type: string) => {
    switch (type) {
      case "doctor_visit":
        return { icon: Stethoscope, color: Colors.secondaryDark, bg: Colors.secondaryLight, label: "Doctor Consultation" };
      case "lab_test":
        return { icon: FlaskConical, color: "#7C3AED", bg: "#EDE9FE", label: "Diagnostic Report" };
      case "medicine_started":
        return { icon: Pill, color: Colors.primaryDeep, bg: Colors.primaryLight, label: "Medication Change" };
      case "surgery":
        return { icon: Activity, color: Colors.emergencyDark, bg: Colors.emergencyLight, label: "Surgical Procedure" };
      default:
        return { icon: CheckCircle2, color: Colors.textSecondary, bg: Colors.surfaceAlt, label: "Clinical Event" };
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Clinical Export Banner */}
      <View style={styles.topCtaBar}>
        <View style={styles.ctaTextContainer}>
          <Text style={styles.ctaTitle}>
            {language === "hi" ? "डॉक्टर से परामर्श की तैयारी?" : "Preparing for a Doctor Visit?"}
          </Text>
          <Text style={styles.ctaSub}>
            {language === "hi"
              ? "1-टैप में 30-दिवसीय क्लिनिकल सारांश साझा करें"
              : "Generate an instant 30-day clinical timeline"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch { }
            setDoctorShareModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={Gradients.doctor}
            style={[styles.exportBtnGradient, Shadows.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Share2 size={14} color="#FFFFFF" />
            <Text style={styles.exportBtnText}>
              {language === "hi" ? "शेयर सारांश" : "Share Brief"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Horizontal Filter Pill Tabs */}
      <View style={styles.filterScroll}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.md, gap: 8 }}>
          {filterOptions.map((f) => {
            const isActive = selectedFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.pill, isActive && styles.pillActive]}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch { }
                  setSelectedFilter(f.id);
                }}
              >
                <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Chronological Stream */}
      <ScrollView contentContainerStyle={styles.timelineList} showsVerticalScrollIndicator={false}>
        <Text style={styles.streamHeader}>
          {language === "hi" ? "इतिहास: " : "Verified Health History for "}
          <Text style={{ fontWeight: "700", color: Colors.textPrimary }}>{activeParent.full_name}</Text>
        </Text>

        {filteredEvents.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconBox}>
              <Calendar size={36} color={Colors.primaryDark} />
            </View>
            <Text style={styles.emptyTitle}>
              {language === "hi" ? "कोई घटना या माइलस्टोन नहीं" : "No Health Milestones Recorded"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {language === "hi"
                ? `${activeParent.full_name} के लिए डॉक्टर परामर्श, जांच रिपोर्ट और दवा परिवर्तन यहाँ कालानुक्रमिक रूप से प्रदर्शित होंगे।`
                : `Doctor visits, clinical tests, surgical procedures, and prescription changes for ${activeParent.full_name} will automatically assemble into this clinical timeline.`}
            </Text>
          </View>
        ) : (
          filteredEvents.map((event, index) => {
            const isLast = index === filteredEvents.length - 1;
            const cfg = getEventConfig(event.event_type);
            const IconComp = cfg.icon;

            const parsedTs = Date.parse(event.event_date);
            const dateStr = isNaN(parsedTs)
              ? (event.event_date || "Recent")
              : new Date(parsedTs).toLocaleDateString(language === "hi" ? "hi-IN" : "en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

            return (
              <View key={event.id} style={styles.eventRow}>
                {/* Left Vertical Spine & Stem Node */}
                <View style={styles.leftCol}>
                  <View style={[styles.iconCircle, { backgroundColor: cfg.bg }, Shadows.subtle]}>
                    <IconComp size={18} color={cfg.color} strokeWidth={2.2} />
                  </View>
                  {!isLast && <View style={styles.verticalLine} />}
                </View>

                {/* Right Event Detail Card */}
                <View style={[styles.card, Shadows.card]}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.eventTypePill, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.eventTypeText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                    <View style={styles.dateRow}>
                      <Calendar size={12} color={Colors.textMuted} />
                      <Text style={styles.eventDate}>{dateStr}</Text>
                    </View>
                  </View>

                  <Text style={[styles.eventTitle, seniorMode && styles.seniorEventTitle]}>
                    {event.title}
                  </Text>

                  <Text style={styles.eventDesc}>{event.description}</Text>

                  {/* Metadata Tags */}
                  <View style={styles.metaRow}>
                    {event.doctor_name && (
                      <View style={styles.metaBadge}>
                        <User size={12} color={Colors.textSecondary} />
                        <Text style={styles.metaBadgeText}>{event.doctor_name}</Text>
                      </View>
                    )}
                    {event.facility_name && (
                      <View style={styles.metaBadge}>
                        <Building2 size={12} color={Colors.textSecondary} />
                        <Text style={styles.metaBadgeText}>{event.facility_name}</Text>
                      </View>
                    )}
                    {event.document_id && (
                      <View style={[styles.metaBadge, { backgroundColor: Colors.primaryLight + "60" }]}>
                        <Paperclip size={11} color={Colors.primaryDeep} />
                        <Text style={[styles.metaBadgeText, { color: Colors.primaryDeep }]}>Report Attached</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  topCtaBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(240, 253, 250, 0.75)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(204, 251, 241, 0.8)",
  },
  ctaTextContainer: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  ctaTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDeep,
  },
  ctaSub: {
    fontSize: 11,
    color: Colors.primaryDark,
    marginTop: 1,
  },
  exportBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  exportBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: Typography.weights.bold,
  },
  filterScroll: {
    paddingVertical: Spacing.sm,
  },
  pill: {
    backgroundColor: "rgba(255, 255, 255, 0.65)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.85)",
  },
  pillActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  pillText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: "#FFFFFF",
    fontWeight: Typography.weights.bold,
  },
  timelineList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 110,
  },
  streamHeader: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  eventRow: {
    flexDirection: "row",
    marginBottom: Spacing.md,
  },
  leftCol: {
    alignItems: "center",
    marginRight: Spacing.md,
    width: 40,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  verticalLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.borderStrong,
    marginTop: 4,
  },
  card: {
    ...Glass.card,
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  eventTypePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  eventTypeText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  eventDate: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: Typography.weights.semibold,
  },
  eventTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  seniorEventTitle: {
    fontSize: Typography.seniorSizes.sm,
  },
  eventDesc: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: Spacing.sm,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  metaBadgeText: {
    fontSize: 10,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    paddingHorizontal: Spacing.xl,
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    marginVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyIconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
});
