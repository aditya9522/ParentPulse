// apps/mobile/src/screens/MedicinesScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import {
  Pill,
  Calendar,
  AlertTriangle,
  Clock,
  Sun,
  CloudSun,
  Sunset,
  Moon,
  CheckCircle2,
  Package,
  PhoneCall,
  ChevronRight,
  Sparkles,
  Info,
  Plus,
} from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { MedicineCard } from "../components/MedicineCard";
import { AddMedicineModal } from "../components/AddMedicineModal";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { MedicineSchedule } from "../types";
import { Colors, Typography, Spacing, Shadows, Gradients, Glass } from "../theme";

type TimeSlot = "all" | "morning" | "afternoon" | "evening" | "night";

export const MedicinesScreen: React.FC = () => {
  const { activeParent, medicines, deleteMedicine, seniorMode, language } = useApp();
  const [activeTab, setActiveTab] = useState<"today" | "all" | "refills">("today");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot>("all");
  const [addMedicineModalVisible, setAddMedicineModalVisible] = useState(false);
  const [medToDelete, setMedToDelete] = useState<MedicineSchedule | null>(null);

  const isHindi = language === "hi";

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(style);
      }
    } catch {
      // Graceful fallback
    }
  };

  const refillMedicines = medicines.filter(
    (m) => m.current_inventory <= m.refill_alert_threshold
  );

  const handleOrderRefill = (medicineName: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      isHindi ? "रिफिल आवश्यक" : "Refill needed",
      isHindi
        ? `${medicineName} का स्टॉक कम है। वास्तविक फार्मेसी चुनने के लिए Nearby टैब खोलें।`
        : `${medicineName} is low in stock. Open Nearby to choose a real pharmacy and contact it directly.`
    );
  };

  // Filter medicines by time slot if on Today's Schedule
  const filteredTodayMedicines = medicines.filter((m) => {
    if (selectedTimeSlot === "all") return true;
    return m.schedule_times.some((t) => {
      const lower = t.toLowerCase();
      if (selectedTimeSlot === "morning") return lower.includes("8") || lower.includes("9") || lower.includes("morning") || lower.includes("breakfast");
      if (selectedTimeSlot === "afternoon") return lower.includes("1") || lower.includes("2") || lower.includes("afternoon") || lower.includes("lunch");
      if (selectedTimeSlot === "evening") return lower.includes("6") || lower.includes("7") || lower.includes("evening") || lower.includes("dinner");
      if (selectedTimeSlot === "night") return lower.includes("9") || lower.includes("10") || lower.includes("night") || lower.includes("bed");
      return true;
    });
  });

  const timeSlots: { id: TimeSlot; label: string; hindiLabel: string; icon: any }[] = [
    { id: "all", label: "All Day", hindiLabel: "à¤ªà¥‚à¤°à¤¾ à¤¦à¤¿à¤¨", icon: Clock },
    { id: "morning", label: "Morning", hindiLabel: "à¤¸à¥à¤¬à¤¹", icon: Sun },
    { id: "afternoon", label: "Afternoon", hindiLabel: "à¤¦à¥‹à¤ªà¤¹à¤°", icon: CloudSun },
    { id: "evening", label: "Evening", hindiLabel: "à¤¶à¤¾à¤®", icon: Sunset },
    { id: "night", label: "Night", hindiLabel: "à¤°à¤¾à¤¤", icon: Moon },
  ];

  return (
    <View style={styles.container}>
      {/* Refill Alert Banner if low inventory */}
      {refillMedicines.length > 0 && (
        <View style={styles.alertBannerWrapper}>
          <LinearGradient
            colors={["#FEF2F2", "#FEE2E2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.alertBanner}
          >
            <View style={styles.alertIconCircle}>
              <AlertTriangle size={18} color={Colors.emergency} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>
                {isHindi ? "à¤¦à¤µà¤¾ à¤°à¤¿à¤«à¤¿à¤² à¤†à¤µà¤¶à¥à¤¯à¤•!" : "Prescription Refill Required!"}
              </Text>
              <Text style={styles.alertSub} numberOfLines={1}>
                {refillMedicines.map((m) => m.name).join(", ")} {isHindi ? "à¤•à¤¾ à¤¸à¥à¤Ÿà¥‰à¤• à¤•à¤® à¤¹à¥ˆà¥¤" : "running low."}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.orderBtn}
              onPress={() => handleOrderRefill(refillMedicines[0].name)}
              activeOpacity={0.8}
            >
              <Package size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.orderBtnText}>{isHindi ? "à¤°à¤¿à¤«à¤¿à¤²" : "Refill"}</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {/* Modern Tab Selector */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "today" && styles.tabActive]}
            onPress={() => {
              triggerHaptic();
              setActiveTab("today");
            }}
            activeOpacity={0.85}
          >
            <Calendar
              size={15}
              color={activeTab === "today" ? Colors.primaryDark : Colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === "today" && styles.tabTextActive]}>
              {isHindi ? "à¤†à¤œ à¤•à¤¾ à¤¸à¤®à¤¯" : "Today"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "all" && styles.tabActive]}
            onPress={() => {
              triggerHaptic();
              setActiveTab("all");
            }}
            activeOpacity={0.85}
          >
            <Pill
              size={15}
              color={activeTab === "all" ? Colors.primaryDark : Colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === "all" && styles.tabTextActive]}>
              {isHindi ? `à¤¸à¤­à¥€ (${medicines.length})` : `All (${medicines.length})`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "refills" && styles.tabActive,
              refillMedicines.length > 0 && styles.tabWarningBorder,
            ]}
            onPress={() => {
              triggerHaptic();
              setActiveTab("refills");
            }}
            activeOpacity={0.85}
          >
            <AlertTriangle
              size={15}
              color={refillMedicines.length > 0 ? Colors.emergency : Colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "refills" && styles.tabTextActive,
                refillMedicines.length > 0 && { color: Colors.emergency },
              ]}
            >
              {isHindi ? `à¤°à¤¿à¤«à¤¿à¤² (${refillMedicines.length})` : `Refills (${refillMedicines.length})`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Header Row with Add Medication Button */}
        <View style={styles.actionHeaderRow}>
          <Text style={[styles.sectionSubtitle, seniorMode && styles.seniorSubtitle]}>
            {activeTab === "today"
              ? (isHindi ? "à¤¦à¥ˆà¤¨à¤¿à¤• à¤–à¥à¤°à¤¾à¤• à¤…à¤¨à¥à¤ªà¤¾à¤²à¤¨" : "Daily Dosage Checklist")
              : activeTab === "all"
              ? (isHindi ? `à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤¦à¤µà¤¾à¤à¤‚ (${medicines.length})` : `Active Regimen (${medicines.length})`)
              : (isHindi ? "à¤•à¤® à¤‡à¤¨à¥à¤µà¥‡à¤‚à¤Ÿà¤°à¥€ à¤…à¤²à¤°à¥à¤Ÿ" : "Low Inventory Thresholds")}
          </Text>
          <TouchableOpacity
            style={styles.addMedButton}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
              setAddMedicineModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.addMedButtonText}>
              {isHindi ? "à¤¦à¤µà¤¾ à¤œà¥‹à¤¡à¤¼à¥‡à¤‚" : "Add Medicine"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Time of Day Sub-filter for Today's schedule */}
      {activeTab === "today" && (
        <View style={styles.timeFilterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timeFilterScroll}
          >
            {timeSlots.map((slot) => {
              const IconComponent = slot.icon;
              const isSelected = selectedTimeSlot === slot.id;
              return (
                <TouchableOpacity
                  key={slot.id}
                  style={[styles.timeChip, isSelected && styles.timeChipActive]}
                  onPress={() => {
                    triggerHaptic();
                    setSelectedTimeSlot(slot.id);
                  }}
                  activeOpacity={0.8}
                >
                  <IconComponent
                    size={14}
                    color={isSelected ? Colors.primaryDark : Colors.textSecondary}
                  />
                  <Text style={[styles.timeChipText, isSelected && styles.timeChipTextActive]}>
                    {isHindi ? slot.hindiLabel : slot.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Content List */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {activeTab === "refills" ? (
          refillMedicines.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <CheckCircle2 size={36} color={Colors.success} />
              </View>
              <Text style={styles.emptyTitle}>
                {isHindi ? "à¤¸à¤­à¥€ à¤¦à¤µà¤¾à¤“à¤‚ à¤•à¤¾ à¤ªà¤°à¥à¤¯à¤¾à¤ªà¥à¤¤ à¤¸à¥à¤Ÿà¥‰à¤• à¤¹à¥ˆ" : "All Inventories Fully Stocked"}
              </Text>
              <Text style={styles.emptySub}>
                {isHindi
                  ? "à¤•à¤¿à¤¸à¥€ à¤­à¥€ à¤¦à¤µà¤¾ à¤•à¥‡ à¤²à¤¿à¤ à¤¤à¥à¤°à¤‚à¤¤ à¤°à¤¿à¤«à¤¿à¤² à¤•à¥€ à¤†à¤µà¤¶à¥à¤¯à¤•à¤¤à¤¾ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤"
                  : "No medicines are below their safety threshold."}
              </Text>
            </View>
          ) : (
            refillMedicines.map((med) => {
              const stockPercent = Math.min(
                100,
                Math.round((med.current_inventory / (med.refill_alert_threshold * 3)) * 100)
              );
              return (
                <View key={med.id} style={[styles.refillCard, Shadows.cardElevated]}>
                  <View style={styles.refillTop}>
                    <View style={styles.medNameRow}>
                      <View style={styles.pillIconBox}>
                        <Pill size={18} color={Colors.emergency} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.refillMedName, seniorMode && styles.seniorMedName]}>
                          {med.name} {med.dosage}
                        </Text>
                        <Text style={styles.refillDoctor}>
                          {isHindi ? "à¤šà¤¿à¤•à¤¿à¤¤à¥à¤¸à¤•" : "Prescribed by"}: {med.prescribing_doctor}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.criticalPill}>
                      <Text style={styles.criticalText}>
                        {med.current_inventory} {isHindi ? "à¤¬à¤šà¥‡ à¤¹à¥ˆà¤‚" : "LEFT"}
                      </Text>
                    </View>
                  </View>

                  {/* Visual Inventory Bar */}
                  <View style={styles.inventoryTrack}>
                    <View
                      style={[
                        styles.inventoryBar,
                        {
                          width: `${Math.max(10, stockPercent)}%`,
                          backgroundColor:
                            stockPercent < 25 ? Colors.emergency : Colors.warning,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.inventoryLabels}>
                    <Text style={styles.inventorySub}>
                      {isHindi ? "à¤¦à¥ˆà¤¨à¤¿à¤• à¤–à¥à¤°à¤¾à¤•" : "Daily dose"}: {med.schedule_times.length}x daily
                    </Text>
                    <Text style={styles.inventorySub}>
                      ~{Math.round(med.current_inventory / (med.schedule_times.length || 1))} {isHindi ? "à¤¦à¤¿à¤¨ à¤¬à¤¾à¤•à¥€" : "days left"}
                    </Text>
                  </View>

                  <Text style={styles.refillReason}>
                    <Text style={{ fontWeight: "700" }}>{isHindi ? "à¤•à¤¾à¤°à¤£" : "Condition"}:</Text> {med.reason}
                  </Text>

                  {/* Refill Action Button */}
                  <TouchableOpacity
                    style={styles.actionRefillBtn}
                    onPress={() => handleOrderRefill(med.name)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={Gradients.teal}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.actionRefillGradient}
                    >
                      <PhoneCall size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.actionRefillText}>
                        {isHindi
                          ? "à¤…à¤ªà¥‹à¤²à¥‹ à¤«à¤¼à¤¾à¤°à¥à¤®à¥‡à¤¸à¥€ à¤¸à¥‡ à¤¤à¥à¤°à¤‚à¤¤ à¤°à¤¿à¤«à¤¿à¤² à¤‘à¤°à¥à¤¡à¤° à¤•à¤°à¥‡à¤‚"
                          : "Review nearby refill options"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              );
            })
          )
        ) : (
          (activeTab === "today" ? filteredTodayMedicines : medicines).map((med) => (
            <MedicineCard
              key={med.id}
              medicine={med}
              onDelete={(m) => setMedToDelete(m)}
            />
          ))
        )}

      </ScrollView>

      {/* Confirmation Modal for Discontinuing/Deleting Medicine */}
      <ConfirmationModal
        visible={!!medToDelete}
        title={isHindi ? "à¤¦à¤µà¤¾ à¤¶à¥‡à¤¡à¥à¤¯à¥‚à¤² à¤¹à¤Ÿà¤¾à¤à¤‚?" : "Discontinue Medication?"}
        message={
          isHindi
            ? `à¤•à¥à¤¯à¤¾ à¤†à¤ª à¤¨à¤¿à¤¶à¥à¤šà¤¿à¤¤ à¤¹à¥ˆà¤‚ à¤•à¤¿ à¤†à¤ª ${medToDelete?.name} (${medToDelete?.dosage}) à¤•à¥‹ à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤¦à¤µà¤¾ à¤¸à¥‚à¤šà¥€ à¤¸à¥‡ à¤¹à¤Ÿà¤¾à¤¨à¤¾ à¤šà¤¾à¤¹à¤¤à¥‡ à¤¹à¥ˆà¤‚?`
            : `Are you sure you want to remove ${medToDelete?.name} (${medToDelete?.dosage}) from the active schedule? Daily dosage alerts will be cancelled.`
        }
        confirmText={isHindi ? "à¤¹à¤Ÿà¤¾à¤à¤‚" : "Remove"}
        cancelText={isHindi ? "à¤°à¤¦à¥à¤¦ à¤•à¤°à¥‡à¤‚" : "Cancel"}
        isDestructive={true}
        iconType="danger"
        onConfirm={() => {
          if (medToDelete) {
            deleteMedicine(medToDelete.id);
            setMedToDelete(null);
          }
        }}
        onCancel={() => setMedToDelete(null)}
      />

      {/* Add Medication Modal */}
      <AddMedicineModal
        visible={addMedicineModalVisible}
        onClose={() => setAddMedicineModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  alertBannerWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  alertBanner: {
    ...Glass.card,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: 14,
    backgroundColor: "rgba(254, 242, 242, 0.8)",
    borderColor: "rgba(254, 202, 202, 0.85)",
  },
  alertIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#991B1B",
  },
  alertSub: {
    fontSize: 11,
    color: "#B91C1C",
    marginTop: 1,
  },
  orderBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.emergency,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  orderBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  tabsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
    padding: 3,
    borderRadius: 12,
    gap: 4,
  },
  actionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
    paddingHorizontal: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  seniorSubtitle: {
    fontSize: 15,
  },
  addMedButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  addMedButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
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
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 1)",
    ...Shadows.card,
  },
  tabWarningBorder: {
    borderColor: Colors.emergencyLight,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primaryDark,
    fontWeight: "700",
  },
  timeFilterContainer: {
    paddingVertical: Spacing.xs,
  },
  timeFilterScroll: {
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.65)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.85)",
    gap: 5,
  },
  timeChipActive: {
    backgroundColor: "rgba(204, 251, 241, 0.85)",
    borderColor: Colors.primary,
  },
  timeChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  timeChipTextActive: {
    color: Colors.primaryDark,
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 110,
  },
  refillCard: {
    ...Glass.card,
    padding: Spacing.lg,
    borderRadius: 16,
    marginBottom: Spacing.md,
  },
  refillTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  medNameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    paddingRight: Spacing.sm,
    gap: 10,
  },
  pillIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  refillMedName: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  seniorMedName: {
    fontSize: 20,
  },
  refillDoctor: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  criticalPill: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  criticalText: {
    color: Colors.emergency,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  inventoryTrack: {
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 6,
    marginBottom: 4,
  },
  inventoryBar: {
    height: "100%",
    borderRadius: 3,
  },
  inventoryLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  inventorySub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  refillReason: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  actionRefillBtn: {
    borderRadius: 12,
    overflow: "hidden",
    ...Shadows.glowTeal,
  },
  actionRefillGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  actionRefillText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    maxWidth: 260,
  },
  adherenceCard: {
    marginTop: Spacing.sm,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  adherenceGradient: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
  },
  adherenceTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#166534",
  },
  adherenceDesc: {
    fontSize: 12,
    color: "#15803D",
    marginTop: 2,
    lineHeight: 17,
  },
});

