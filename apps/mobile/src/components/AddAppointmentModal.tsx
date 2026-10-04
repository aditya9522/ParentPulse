// apps/mobile/src/components/AddAppointmentModal.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { AppAlert as Alert } from "../services/appAlert";
import { SwipeableBottomSheet } from "./SwipeableBottomSheet";
import * as Haptics from "expo-haptics";
import * as Crypto from "expo-crypto";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Calendar,
  Clock,
  Building2,
  User,
  CheckCircle2,
  X,
  BellRing,
} from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { Appointment } from "../types";
import { Colors, Typography, Spacing, Shadows, BorderRadius, Gradients, createThemedStyles } from "../theme";

interface AddAppointmentModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddAppointmentModal: React.FC<AddAppointmentModalProps> = ({ visible, onClose }) => {
  const { activeParent, addAppointment, seniorMode, language } = useApp();

  const isHindi = language === "hi";

  const [doctorName, setDoctorName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [dateStr, setDateStr] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [timeStr, setTimeStr] = useState("10:30 AM");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reason, setReason] = useState("");
  const [address, setAddress] = useState("");

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
    const timeMatch = timeStr.trim().match(/^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/i);
    const dateParts = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!doctorName.trim() || !specialty.trim() || !hospitalName.trim() || !dateParts || !timeMatch) {
      Alert.alert(
        isHindi ? "जानकारी भरें" : "Missing Information",
        isHindi
          ? "कृपया डॉक्टर का नाम और अस्पताल/क्लिनिक का नाम दर्ज करें।"
          : "Enter the doctor, specialty, clinic, date (YYYY-MM-DD), and time (HH:MM AM/PM)."
      );
      return;
    }

    const [, yearText, monthText, dayText] = dateParts;
    const [, hourText, minuteText, meridiem] = timeMatch;
    let hour = Number(hourText) % 12;
    if (meridiem.toUpperCase() === "PM") hour += 12;
    const appointmentAt = new Date(
      Number(yearText),
      Number(monthText) - 1,
      Number(dayText),
      hour,
      Number(minuteText),
    );
    if (
      appointmentAt.getFullYear() !== Number(yearText) ||
      appointmentAt.getMonth() !== Number(monthText) - 1 ||
      appointmentAt.getDate() !== Number(dayText) ||
      appointmentAt <= new Date()
    ) {
      Alert.alert("Invalid appointment", "Choose a valid future date and time.");
      return;
    }

    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);

    const newAppt: Appointment = {
      id: Crypto.randomUUID(),
      parent_id: activeParent.id,
      doctor_name: doctorName.startsWith("Dr.") ? doctorName : `Dr. ${doctorName}`,
      specialty: specialty.trim(),
      hospital_clinic_name: hospitalName.trim(),
      appointment_date: appointmentAt.toISOString(),
      status: "upcoming",
      reason: reason || undefined,
      address: address || undefined,
      latitude: activeParent.latitude,
      longitude: activeParent.longitude,
    };

    addAppointment(newAppt);
    onClose();

    Alert.alert(
      isHindi ? "✅ परामर्श निर्धारित हुआ!" : "✅ Appointment Scheduled!",
      isHindi
        ? `${activeParent.full_name} के लिए ${newAppt.doctor_name} के साथ परामर्श दर्ज हो गया है।`
        : `Appointment with ${newAppt.doctor_name} has been scheduled and reminders set.`
    );

    // Reset fields
    setDoctorName("");
    setSpecialty("");
    setHospitalName("");
    setDateStr("");
    setTimeStr("");
    setReason("");
    setAddress("");
  };

  const specialties = [
    "Cardiologist",
    "Endocrinologist",
    "Orthopedic",
    "Neurologist",
    "General Physician",
  ];

  return (
    <SwipeableBottomSheet
      visible={visible}
      onClose={onClose}
      maxHeight="92%"
      testID="add-appointment-modal"
    >
      <View style={styles.sheetBox}>

          {/* Top Bar */}
          <View style={styles.topRow}>
            <View style={styles.titleRow}>
              <View style={styles.iconCircle}>
                <Calendar size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.sheetTitle}>
                  {isHindi ? "डॉक्टर परामर्श बुक करें" : "Schedule Consultation"}
                </Text>
                <Text style={styles.sheetSub}>
                  {isHindi ? `${activeParent.full_name} के लिए` : `For ${activeParent.full_name}`}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <X size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}>
            {/* Doctor Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{isHindi ? "डॉक्टर का नाम" : "Doctor's Name"}</Text>
              <View style={styles.inputBox}>
                <User size={16} color={Colors.textMuted} />
                <TextInput
                  style={[styles.textInput, seniorMode && styles.seniorTextInput]}
                  placeholder={isHindi ? "डॉक्टर का नाम" : "Doctor's full name"}
                  placeholderTextColor={Colors.textMuted}
                  value={doctorName}
                  onChangeText={setDoctorName}
                />
              </View>
            </View>

            {/* Specialty Pills */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{isHindi ? "विशेषज्ञता (Specialty)" : "Specialty"}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {specialties.map((spec) => (
                  <TouchableOpacity
                    key={spec}
                    style={[styles.specPill, specialty === spec && styles.specPillActive]}
                    onPress={() => {
                      triggerHaptic();
                      setSpecialty(spec);
                    }}
                  >
                    <Text style={[styles.specPillText, specialty === spec && styles.specPillTextActive]}>
                      {spec}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Hospital / Clinic */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{isHindi ? "अस्पताल / क्लिनिक" : "Hospital / Clinic"}</Text>
              <View style={styles.inputBox}>
                <Building2 size={16} color={Colors.textMuted} />
                <TextInput
                  style={[styles.textInput, seniorMode && styles.seniorTextInput]}
                  placeholder={isHindi ? "उदा. फोर्टिस अस्पताल" : "e.g. Fortis Memorial Hospital"}
                  placeholderTextColor={Colors.textMuted}
                  value={hospitalName}
                  onChangeText={setHospitalName}
                />
              </View>
            </View>

            {/* Date & Time Row */}
            <View style={styles.twoColRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>{isHindi ? "परामर्श तिथि" : "Consultation Date"}</Text>
                <TouchableOpacity
                  style={styles.pickerBox}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.8}
                >
                  <Calendar size={16} color={Colors.primary} />
                  <Text style={styles.pickerBoxText}>{dateStr || "Select Date"}</Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={new Date(dateStr)}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onValueChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setDateStr(selectedDate.toISOString().slice(0, 10));
                      }
                    }}
                    onDismiss={() => setShowDatePicker(false)}
                  />
                )}
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>{isHindi ? "समय" : "Time"}</Text>
                <TouchableOpacity
                  style={styles.pickerBox}
                  onPress={() => setShowTimePicker(true)}
                  activeOpacity={0.8}
                >
                  <Clock size={16} color={Colors.secondary} />
                  <Text style={styles.pickerBoxText}>{timeStr || "Select Time"}</Text>
                </TouchableOpacity>

                {showTimePicker && (
                  <DateTimePicker
                    value={new Date()}
                    mode="time"
                    is24Hour={false}
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onValueChange={(event, selectedDate) => {
                      setShowTimePicker(false);
                      if (selectedDate) {
                        setTimeStr(formatTime(selectedDate));
                      }
                    }}
                    onDismiss={() => setShowTimePicker(false)}
                  />
                )}
              </View>
            </View>

            {/* Reason / Clinical Purpose */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{isHindi ? "परामर्श का कारण / नोट्स" : "Purpose / Notes"}</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={[styles.textInput, seniorMode && styles.seniorTextInput]}
                  placeholder={
                    isHindi
                      ? "उदा. बीपी एवं ईसीजी त्रैमासिक जांच"
                      : "e.g. Quarterly BP & ECG review, carry reports"
                  }
                  placeholderTextColor={Colors.textMuted}
                  value={reason}
                  onChangeText={setReason}
                />
              </View>
            </View>

            {/* Automatic Reminder Badge */}
            <View style={styles.reminderInfoBox}>
              <BellRing size={16} color="#0D9488" style={{ marginRight: 8 }} />
              <Text style={styles.reminderInfoText}>
                {isHindi
                  ? "परामर्श से 24 घंटे और 2 घंटे पहले केयरगिवर को एसएमएस/पुश नोटिफिकेशन भेजा जाएगा।"
                  : "Automatic 24-hour and 2-hour reminders will be dispatched to family caregivers."}
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitBtn} onPress={handleSave} activeOpacity={0.85}>
              <LinearGradient
                colors={Gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                <CheckCircle2 size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>
                  {isHindi ? "परामर्श सुरक्षित करें" : "Confirm Appointment"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
        </ScrollView>
      </View>
    </SwipeableBottomSheet>
  );
};

const styles = createThemedStyles({
  sheetBox: {
    backgroundColor: "transparent",
    paddingHorizontal: Spacing.xl,
    paddingTop: 4,
    paddingBottom: Platform.OS === "ios" ? 40 : 25,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  sheetSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formContent: {
    paddingBottom: 60,
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  pickerBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 46,
    gap: 10,
  },
  pickerBoxText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.medium,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 46,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  seniorTextInput: {
    fontSize: 16,
  },
  twoColRow: {
    flexDirection: "row",
    gap: 12,
  },
  specPill: {
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  specPillActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  specPillText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.semibold,
  },
  specPillTextActive: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  reminderInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDFA",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#CCFBF1",
    marginTop: 4,
  },
  reminderInfoText: {
    flex: 1,
    fontSize: 11,
    color: Colors.primaryDark,
    lineHeight: 16,
  },
  submitBtn: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginTop: Spacing.sm,
    ...Shadows.card,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: Typography.weights.bold,
  },
});
