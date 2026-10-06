// apps/mobile/src/screens/TimelineScreen.tsx
import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
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
  Plus,
  Trash2,
  Pencil,
  X,
  FileText,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as Crypto from "expo-crypto";
import { useApp } from "../context/AppContext";
import { TimelineEvent, TimelineEventType } from "../types";
import { Colors, Typography, Spacing, Shadows, BorderRadius, Gradients, Glass, createThemedStyles } from "../theme";
import { SwipeableBottomSheet } from "../components/SwipeableBottomSheet";
import { ConfirmationModal } from "../components/ConfirmationModal";

const formatDateToYMD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseYMDToDate = (ymdStr: string): Date => {
  if (!ymdStr) return new Date();
  const parts = ymdStr.split("-").map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date();
};

export const TimelineScreen: React.FC = () => {
  const {
    activeParent,
    timeline,
    addTimelineEvent,
    updateTimelineEvent,
    deleteTimelineEvent,
    documents,
    seniorMode,
    setDoctorShareModalVisible,
    language,
  } = useApp();

  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<TimelineEvent | null>(null);

  // Form State
  const [eventTitle, setEventTitle] = useState("");
  const [eventType, setEventType] = useState<TimelineEventType>("doctor_visit");
  const [eventDate, setEventDate] = useState(() => formatDateToYMD(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [doctorName, setDoctorName] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const isHindi = language === "hi";

  const filterOptions = [
    { id: "all", label: isHindi ? "सभी घटनाएँ" : "All Milestones" },
    { id: "doctor_visit", label: isHindi ? "डॉक्टर विज़िट" : "Doctor Visits" },
    { id: "lab_test", label: isHindi ? "लैब टेस्ट" : "Lab Tests" },
    { id: "medicine_started", label: isHindi ? "दवाइयां" : "Medications" },
    { id: "surgery", label: isHindi ? "सर्जरी व प्रक्रियाएं" : "Surgeries" },
  ];

  const eventTypeChoices: { type: TimelineEventType; label: string; hindiLabel: string }[] = [
    { type: "doctor_visit", label: "Doctor Visit", hindiLabel: "डॉक्टर परामर्श" },
    { type: "lab_test", label: "Lab Test", hindiLabel: "जाँच / लैब टेस्ट" },
    { type: "medicine_started", label: "Medication", hindiLabel: "दवा बदलाव" },
    { type: "surgery", label: "Surgery/Procedure", hindiLabel: "सर्जरी / प्रक्रिया" },
    { type: "diagnosis", label: "Diagnosis/Clinical", hindiLabel: "निदान / क्लिनिकल निष्कर्ष" },
  ];

  const filteredEvents = timeline.filter((e) => {
    if (selectedFilter === "all") return true;
    return e.event_type === selectedFilter;
  });

  const getEventConfig = (type: string) => {
    switch (type) {
      case "doctor_visit":
        return { icon: Stethoscope, color: Colors.secondaryDark, bg: Colors.secondaryLight, label: isHindi ? "डॉक्टर परामर्श" : "Doctor Consultation" };
      case "lab_test":
        return { icon: FlaskConical, color: "#7C3AED", bg: "#EDE9FE", label: isHindi ? "जाँच रिपोर्ट" : "Diagnostic Report" };
      case "medicine_started":
        return { icon: Pill, color: Colors.primaryDeep, bg: Colors.primaryLight, label: isHindi ? "दवा बदलाव" : "Medication Change" };
      case "surgery":
        return { icon: Activity, color: Colors.emergencyDark, bg: Colors.emergencyLight, label: isHindi ? "सर्जिकल प्रक्रिया" : "Surgical Procedure" };
      default:
        return { icon: CheckCircle2, color: Colors.textSecondary, bg: Colors.surfaceAlt, label: isHindi ? "क्लिनिकल माइलस्टोन" : "Clinical Event" };
    }
  };

  const handleOpenAddModal = () => {
    try {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setEditingEvent(null);
    setEventTitle("");
    setEventType("doctor_visit");
    setEventDate(formatDateToYMD(new Date()));
    setDoctorName(activeParent.primary_doctors[0]?.name || "");
    setFacilityName(activeParent.primary_doctors[0]?.hospital_or_clinic || "");
    setEventDesc("");
    setSelectedDocId(null);
    setAddModalVisible(true);
  };

  const handleEditMilestone = (event: TimelineEvent) => {
    try {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setEditingEvent(event);
    setEventTitle(event.title);
    setEventType(event.event_type);
    setEventDate(event.event_date ? event.event_date.slice(0, 10) : formatDateToYMD(new Date()));
    setDoctorName(event.doctor_name || "");
    setFacilityName(event.facility_name || "");
    setEventDesc(event.description || "");
    setSelectedDocId(event.document_id || null);
    setAddModalVisible(true);
  };

  const handleSaveMilestone = () => {
    if (!eventTitle.trim()) {
      Alert.alert(isHindi ? "शीर्षक आवश्यक है" : "Title Required", isHindi ? "कृपया घटना का शीर्षक दर्ज करें।" : "Please enter a title for this health milestone.");
      return;
    }

    try {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    if (editingEvent) {
      const updated: TimelineEvent = {
        ...editingEvent,
        title: eventTitle.trim(),
        event_type: eventType,
        event_date: eventDate || editingEvent.event_date,
        doctor_name: doctorName.trim() || undefined,
        facility_name: facilityName.trim() || undefined,
        description: eventDesc.trim() || (isHindi ? "क्लिनिकल माइलस्टोन दर्ज किया गया" : "Recorded clinical milestone"),
        document_id: selectedDocId || undefined,
      };
      updateTimelineEvent(updated);
      setEditingEvent(null);
    } else {
      const newMilestone: TimelineEvent = {
        id: Crypto.randomUUID(),
        parent_id: activeParent.id,
        title: eventTitle.trim(),
        event_type: eventType,
        event_date: eventDate || new Date().toISOString().slice(0, 10),
        doctor_name: doctorName.trim() || undefined,
        facility_name: facilityName.trim() || undefined,
        description: eventDesc.trim() || (isHindi ? "क्लिनिकल माइलस्टोन दर्ज किया गया" : "Recorded clinical milestone"),
        document_id: selectedDocId || undefined,
      };
      addTimelineEvent(newMilestone);
    }
    setAddModalVisible(false);
  };

  const confirmDeleteEvent = () => {
    if (eventToDelete) {
      deleteTimelineEvent(eventToDelete.id);
      setEventToDelete(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Clinical Export & Add Banner */}
      <View style={styles.topCtaBar}>
        <View style={styles.ctaTextContainer}>
          <Text style={styles.ctaTitle}>
            {isHindi ? "स्वास्थ्य इतिहास व माइलस्टोन" : "Clinical Timeline"}
          </Text>
          <Text style={styles.ctaSub}>
            {isHindi
              ? "दवाइयां, परामर्श और जांच रिपोर्ट का संपूर्ण रिकॉर्ड"
              : `${activeParent.full_name}'s chronological health milestones`}
          </Text>
        </View>

        <View style={styles.topBtnRow}>
          {/* Add Milestone Button */}
          <TouchableOpacity onPress={handleOpenAddModal} activeOpacity={0.8}>
            <LinearGradient
              colors={Gradients.primary}
              style={[styles.actionBtnGradient, Shadows.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Plus size={14} color="#FFFFFF" strokeWidth={2.6} />
              <Text style={styles.actionBtnText}>
                {isHindi ? "नया जोड़ें" : "Add Event"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Share Brief Button */}
          <TouchableOpacity
            onPress={() => {
              try {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              } catch {}
              setDoctorShareModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={Gradients.doctor}
              style={[styles.actionBtnGradient, Shadows.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Share2 size={13} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>
                {isHindi ? "शेयर" : "Share"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
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
          {isHindi ? "सत्यापित स्वास्थ्य इतिहास: " : "Verified Health History for "}
          <Text style={{ fontWeight: "700", color: Colors.textPrimary }}>{activeParent.full_name}</Text>
        </Text>

        {filteredEvents.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconBox}>
              <Calendar size={36} color={Colors.primaryDark} />
            </View>
            <Text style={styles.emptyTitle}>
              {isHindi ? "कोई घटना या माइलस्टोन नहीं" : "No Health Milestones Recorded"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isHindi
                ? `${activeParent.full_name} के लिए डॉक्टर परामर्श, जांच रिपोर्ट और दवा परिवर्तन यहाँ कालानुक्रमिक रूप से प्रदर्शित होंगे।`
                : `Doctor visits, clinical tests, surgical procedures, and prescription changes for ${activeParent.full_name} will automatically assemble into this clinical timeline.`}
            </Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={handleOpenAddModal} activeOpacity={0.8}>
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.emptyAddBtnText}>
                {isHindi ? "पहला माइलस्टोन जोड़ें" : "Add First Milestone"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredEvents.map((event, index) => {
            const isLast = index === filteredEvents.length - 1;
            const cfg = getEventConfig(event.event_type);
            const IconComp = cfg.icon;

            const parsedTs = Date.parse(event.event_date);
            const dateStr = isNaN(parsedTs)
              ? (event.event_date || "Recent")
              : new Date(parsedTs).toLocaleDateString(isHindi ? "hi-IN" : "en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

            const attachedDoc = event.document_id ? documents.find((d) => d.id === event.document_id) : null;

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
                <View style={[styles.card, Glass.card, Shadows.card]}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.eventTypePill, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.eventTypeText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                    <View style={styles.cardHeaderActions}>
                      <View style={styles.dateRow}>
                        <Calendar size={12} color={Colors.textMuted} />
                        <Text style={styles.eventDate}>{dateStr}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => handleEditMilestone(event)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel="Edit milestone"
                      >
                        <Pencil size={13} color={Colors.primaryDark} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => setEventToDelete(event)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel="Delete milestone"
                      >
                        <Trash2 size={13} color={Colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={[styles.eventTitle, seniorMode && styles.seniorEventTitle]}>
                    {event.title}
                  </Text>

                  {event.description ? (
                    <Text style={styles.eventDesc}>{event.description}</Text>
                  ) : null}

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
                      <View style={[styles.metaBadge, { backgroundColor: Colors.primaryLight }]}>
                        <Paperclip size={11} color={Colors.primaryDeep} />
                        <Text style={[styles.metaBadgeText, { color: Colors.primaryDeep, fontWeight: "700" }]}>
                          {attachedDoc ? attachedDoc.title : "Document Attached"}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add Health Milestone Bottom Sheet Modal */}
      <SwipeableBottomSheet
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        maxHeight="90%"
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {editingEvent
              ? (isHindi ? "माइलस्टोन संपादित करें" : "Edit Health Milestone")
              : (isHindi ? "नया स्वास्थ्य माइलस्टोन जोड़ें" : "Record Health Milestone")}
          </Text>
          <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.modalCloseBtn}>
            <X size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalForm} showsVerticalScrollIndicator={false}>
          {/* Milestone Title */}
          <Text style={styles.fieldLabel}>
            {isHindi ? "घटना / माइलस्टोन शीर्षक *" : "Event Title *"}
          </Text>
          <TextInput
            style={styles.input}
            value={eventTitle}
            onChangeText={setEventTitle}
            placeholder={isHindi ? "उदा. हृदय रोग विशेषज्ञ परामर्श" : "e.g. Cardiologist consultation"}
            placeholderTextColor={Colors.textMuted}
          />

          {/* Event Type Selector */}
          <Text style={styles.fieldLabel}>
            {isHindi ? "श्रेणी चुनें *" : "Event Category *"}
          </Text>
          <View style={styles.typeSelectorRow}>
            {eventTypeChoices.map((choice) => {
              const isSelected = eventType === choice.type;
              return (
                <TouchableOpacity
                  key={choice.type}
                  style={[styles.typeChoiceChip, isSelected && styles.typeChoiceChipSelected]}
                  onPress={() => setEventType(choice.type)}
                >
                  <Text style={[styles.typeChoiceText, isSelected && styles.typeChoiceTextSelected]}>
                    {isHindi ? choice.hindiLabel : choice.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Event Date with DatePicker */}
          <Text style={styles.fieldLabel}>
            {isHindi ? "घटना / परामर्श की तारीख" : "Event / Consultation Date"}
          </Text>
          <TouchableOpacity
            style={styles.datePickerTrigger}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={isHindi ? "तारीख चुनें" : "Select milestone date"}
          >
            <View style={styles.datePickerTriggerLeft}>
              <View style={styles.calendarIconCircle}>
                <Calendar size={16} color={Colors.primary} />
              </View>
              <Text style={styles.datePickerValueText}>
                {eventDate
                  ? parseYMDToDate(eventDate).toLocaleDateString(isHindi ? "hi-IN" : "en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : (isHindi ? "तारीख चुनें" : "Select date")}
              </Text>
            </View>
            <View style={styles.datePickerChangeBadge}>
              <Text style={styles.datePickerChangeHint}>
                {isHindi ? "बदलें" : "Change"}
              </Text>
            </View>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={parseYMDToDate(eventDate)}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === "ios");
                if (event.type === "dismissed") {
                  setShowDatePicker(false);
                  return;
                }
                if (selectedDate) {
                  setShowDatePicker(false);
                  setEventDate(formatDateToYMD(selectedDate));
                }
              }}
            />
          )}

          {/* Doctor Name */}
          <Text style={styles.fieldLabel}>
            {isHindi ? "डॉक्टर का नाम (वैकल्पिक)" : "Attending Doctor (Optional)"}
          </Text>
          <TextInput
            style={styles.input}
            value={doctorName}
            onChangeText={setDoctorName}
            placeholder={isHindi ? "डॉक्टर का नाम" : "e.g. Dr. Rajesh Sharma"}
            placeholderTextColor={Colors.textMuted}
          />

          {/* Facility / Clinic */}
          <Text style={styles.fieldLabel}>
            {isHindi ? "अस्पताल या क्लिनिक (वैकल्पिक)" : "Hospital / Clinic (Optional)"}
          </Text>
          <TextInput
            style={styles.input}
            value={facilityName}
            onChangeText={setFacilityName}
            placeholder={isHindi ? "अस्पताल या केंद्र का नाम" : "e.g. Apollo Hospital"}
            placeholderTextColor={Colors.textMuted}
          />

          {/* Notes / Description */}
          <Text style={styles.fieldLabel}>
            {isHindi ? "विवरण व क्लिनिकल नोट्स" : "Clinical Summary / Notes"}
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={eventDesc}
            onChangeText={setEventDesc}
            placeholder={isHindi ? "डॉक्टर की सलाह, निष्कर्ष या दवा निर्देश..." : "Diagnosis, advice given, follow-up timeline..."}
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
          />

          {/* Optional Document Attachment */}
          {documents.length > 0 && (
            <View style={styles.docAttachmentSection}>
              <Text style={styles.fieldLabel}>
                {isHindi ? "संलग्न मेडिकल दस्तावेज़ (वैकल्पिक)" : "Attach Medical Record (Optional)"}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <TouchableOpacity
                  style={[styles.docChip, selectedDocId === null && styles.docChipSelected]}
                  onPress={() => setSelectedDocId(null)}
                >
                  <Text style={[styles.docChipText, selectedDocId === null && styles.docChipTextSelected]}>
                    {isHindi ? "कोई नहीं" : "None"}
                  </Text>
                </TouchableOpacity>
                {documents.map((doc) => {
                  const isAttached = selectedDocId === doc.id;
                  return (
                    <TouchableOpacity
                      key={doc.id}
                      style={[styles.docChip, isAttached && styles.docChipSelected]}
                      onPress={() => setSelectedDocId(isAttached ? null : doc.id)}
                    >
                      <FileText size={12} color={isAttached ? Colors.primaryDark : Colors.textMuted} />
                      <Text
                        numberOfLines={1}
                        style={[styles.docChipText, isAttached && styles.docChipTextSelected]}
                      >
                        {doc.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Save Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSaveMilestone}
            activeOpacity={0.85}
          >
            <LinearGradient colors={Gradients.primary} style={styles.submitBtnGradient}>
              <CheckCircle2 size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>
                {editingEvent
                  ? (isHindi ? "अपडेट सहेजें" : "Update Milestone")
                  : (isHindi ? "माइलस्टोन सहेजें" : "Save Clinical Milestone")}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SwipeableBottomSheet>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={Boolean(eventToDelete)}
        title={isHindi ? "माइलस्टोन हटाएं?" : "Delete Health Milestone?"}
        message={
          eventToDelete
            ? (isHindi
                ? `क्या आप वाकई "${eventToDelete.title}" को स्वास्थ्य इतिहास से हटाना चाहते हैं?`
                : `Are you sure you want to remove "${eventToDelete.title}" from ${activeParent.full_name}'s clinical timeline?`)
            : ""
        }
        confirmText={isHindi ? "हटाएं" : "Delete"}
        cancelText={isHindi ? "रद्द करें" : "Cancel"}
        isDestructive
        onConfirm={confirmDeleteEvent}
        onCancel={() => setEventToDelete(null)}
      />
    </View>
  );
};

const styles = createThemedStyles({
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
    backgroundColor: Colors.surface,
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
  topBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: Typography.weights.bold,
  },
  cardHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editBtn: {
    padding: 3,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.primaryLight,
  },
  deleteBtn: {
    padding: 3,
  },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    marginTop: 16,
  },
  emptyAddBtnText: {
    color: "#FFFFFF",
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  modalForm: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  fieldLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 68,
    textAlignVertical: "top",
  },
  typeSelectorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChoiceChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  typeChoiceChipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  typeChoiceText: {
    fontSize: 11,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  typeChoiceTextSelected: {
    color: Colors.primaryDeep,
    fontWeight: Typography.weights.bold,
  },
  docAttachmentSection: {
    marginTop: 6,
  },
  docChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    maxWidth: 180,
  },
  docChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  docChipText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  docChipTextSelected: {
    color: Colors.primaryDeep,
    fontWeight: Typography.weights.bold,
  },
  submitBtn: {
    marginTop: 22,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  submitBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  datePickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 4,
  },
  datePickerTriggerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  calendarIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  datePickerValueText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  datePickerChangeBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  datePickerChangeHint: {
    fontSize: Typography.sizes.xxs,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
});
