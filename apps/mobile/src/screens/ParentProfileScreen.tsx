// apps/mobile/src/screens/ParentProfileScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Linking,
  Platform,
  Image,
} from "react-native";
import { AppAlert as Alert } from "../services/appAlert";
import {
  User,
  ShieldAlert,
  Activity,
  Phone,
  MapPin,
  Stethoscope,
  Plus,
  Edit3,
  X,
  Check,
  AlertTriangle,
  FileText,
  Share2,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { Colors, Typography, Spacing, Shadows, BorderRadius, Gradients } from "../theme";
import { EmergencyContact, PrimaryDoctor } from "../types";
import { SwipeableBottomSheet } from "../components/SwipeableBottomSheet";

export const ParentProfileScreen: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const {
    activeParent,
    updateActiveParentProfile,
    parentList,
    setActiveParentId,
    seniorMode,
    language,
    setDoctorShareModalVisible,
    setSosModalVisible,
  } = useApp();

  const isHindi = language === "hi";

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [fullName, setFullName] = useState(activeParent.full_name);
  const [phone, setPhone] = useState(activeParent.phone_number);
  const [address, setAddress] = useState(activeParent.address);
  const [bloodGroup, setBloodGroup] = useState(activeParent.blood_group);
  const [allergiesText, setAllergiesText] = useState(activeParent.allergies.join(", "));
  const [conditionsText, setConditionsText] = useState(activeParent.chronic_conditions.join(", "));
  const [notes, setNotes] = useState(activeParent.notes || "");

  // Add Contact Modal State
  const [addContactModalVisible, setAddContactModalVisible] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactRelation, setContactRelation] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactPrimary, setContactPrimary] = useState(false);

  // Add Doctor Modal State
  const [addDocModalVisible, setAddDocModalVisible] = useState(false);
  const [docName, setDocName] = useState("");
  const [docSpecialty, setDocSpecialty] = useState("");
  const [docClinic, setDocClinic] = useState("");
  const [docPhone, setDocPhone] = useState("");

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(style);
      }
    } catch { }
  };

  const handleSaveProfile = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const updatedAllergies = allergiesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const updatedConditions = conditionsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    updateActiveParentProfile({
      full_name: fullName.trim(),
      phone_number: phone.trim(),
      address: address.trim(),
      blood_group: bloodGroup.trim(),
      allergies: updatedAllergies,
      chronic_conditions: updatedConditions,
      notes: notes.trim(),
    });

    setEditModalVisible(false);
    Alert.alert(
      isHindi ? "प्रोफ़ाइल अपडेट सफल" : "Profile Updated",
      isHindi ? "पैरेंट स्वास्थ्य प्रोफ़ाइल सुरक्षित रूप से अपडेट हो गई है।" : "Parent health profile updated and synced with care circle."
    );
  };

  const handleAddContact = () => {
    if (!contactName.trim() || !contactPhone.trim()) {
      Alert.alert(isHindi ? "विवरण आवश्यक है" : "Details Required", isHindi ? "कृपया नाम और फ़ोन नंबर दर्ज करें।" : "Please enter name and phone number.");
      return;
    }

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const newContact: EmergencyContact = {
      name: contactName.trim(),
      relationship: contactRelation.trim() || "Family",
      phone_number: contactPhone.trim(),
      is_primary: contactPrimary,
    };

    const updatedContacts = contactPrimary
      ? [
        newContact,
        ...activeParent.emergency_contacts.map((c) => ({ ...c, is_primary: false })),
      ]
      : [...activeParent.emergency_contacts, newContact];

    updateActiveParentProfile({ emergency_contacts: updatedContacts });
    setContactName("");
    setContactRelation("");
    setContactPhone("");
    setAddContactModalVisible(false);
  };

  const handleAddDoctor = () => {
    if (!docName.trim() || !docSpecialty.trim()) {
      Alert.alert(isHindi ? "विवरण आवश्यक है" : "Details Required", isHindi ? "कृपया डॉक्टर का नाम और विशेषता दर्ज करें।" : "Please enter doctor name and specialty.");
      return;
    }

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const newDoc: PrimaryDoctor = {
      name: docName.trim(),
      specialty: docSpecialty.trim(),
      hospital_or_clinic: docClinic.trim() || "Clinic",
      phone_number: docPhone.trim() || "+91 98000 00000",
    };

    updateActiveParentProfile({ primary_doctors: [...activeParent.primary_doctors, newDoc] });
    setDocName("");
    setDocSpecialty("");
    setDocClinic("");
    setDocPhone("");
    setAddDocModalVisible(false);
  };

  const calculateAge = (dob: string) => {
    try {
      const birthYear = new Date(dob).getFullYear();
      return 2026 - birthYear;
    } catch {
      return 72;
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          {onBack && (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                onBack();
              }}
              style={styles.backButton}
              activeOpacity={0.7}
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={20} color={Colors.primaryDark} />
            </TouchableOpacity>
          )}

          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, seniorMode && styles.seniorHeaderTitle]}>
              {isHindi ? "स्वास्थ्य प्रोफ़ाइल" : "Health Profile"}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isHindi ? "व्यापक मेडिकल रिकॉर्ड एवं डॉक्टर विवरण" : "Comprehensive Medical Record & Clinical History"}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => {
              triggerHaptic();
              setFullName(activeParent.full_name);
              setPhone(activeParent.phone_number);
              setAddress(activeParent.address);
              setBloodGroup(activeParent.blood_group);
              setAllergiesText(activeParent.allergies.join(", "));
              setConditionsText(activeParent.chronic_conditions.join(", "));
              setNotes(activeParent.notes || "");
              setEditModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Edit3 size={15} color={Colors.primaryDark} />
            <Text style={styles.editProfileBtnText}>{isHindi ? "संपादित करें" : "Edit"}</Text>
          </TouchableOpacity>
        </View>

        {/* Parent Switcher Carousel */}
        <View style={styles.switcherRow}>
          {parentList.map((p) => {
            const isSelected = p.id === activeParent.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.switchChip, isSelected && styles.switchChipActive]}
                onPress={() => {
                  triggerHaptic();
                  setActiveParentId(p.id);
                }}
              >
                <User size={13} color={isSelected ? Colors.primaryDark : Colors.textMuted} />
                <Text style={[styles.switchChipText, isSelected && styles.switchChipTextActive]}>
                  {p.full_name} ({p.gender === "male" ? (isHindi ? "पिताजी" : "Father") : (isHindi ? "माताजी" : "Mother")})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Parent Identity Card */}
        <LinearGradient
          colors={Gradients.primaryHero}
          style={[styles.heroCard, Shadows.cardElevated]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroAvatarBox}>
              <Image
                source={require("../../assets/parent_avatar.jpg")}
                style={styles.heroAvatarImg}
              />
            </View>

            <View style={styles.heroInfo}>
              <View style={styles.heroNameRow}>
                <Text style={styles.heroName}>{activeParent.full_name}</Text>
                <View style={styles.bloodBadge}>
                  <Text style={styles.bloodBadgeText}>{activeParent.blood_group}</Text>
                </View>
              </View>

              <Text style={styles.heroSubText}>
                {calculateAge(activeParent.date_of_birth)} {isHindi ? "वर्षीय" : "years"} •{" "}
                {activeParent.gender === "male" ? (isHindi ? "पुरुष" : "Male") : (isHindi ? "महिला" : "Female")} • DOB: {activeParent.date_of_birth}
              </Text>

              <View style={styles.heroContactRow}>
                <TouchableOpacity
                  style={styles.heroContactBtn}
                  onPress={() => Linking.openURL(`tel:${activeParent.phone_number.replace(/\s+/g, "")}`)}
                >
                  <Phone size={12} color="#FFFFFF" />
                  <Text style={styles.heroContactText}>{activeParent.phone_number}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.heroAddressRow}>
            <MapPin size={13} color="#D1FAE5" />
            <Text style={styles.heroAddressText} numberOfLines={2}>
              {activeParent.address}
            </Text>
          </View>
        </LinearGradient>

        {/* Severe Allergies Alert Banner */}
        {activeParent.allergies.length > 0 && (
          <View style={[styles.allergyBanner, Shadows.glowRed]}>
            <View style={styles.allergyIconBox}>
              <AlertTriangle size={20} color={Colors.emergencyDark} />
            </View>
            <View style={styles.allergyTextContent}>
              <Text style={styles.allergyTitle}>
                {isHindi ? "गंभीर एलर्जी चेतावनी" : "Medical Allergy Alerts"}
              </Text>
              <Text style={styles.allergyList}>
                {activeParent.allergies.join(" • ")}
              </Text>
            </View>
          </View>
        )}

        {/* Chronic Conditions & Health Status */}
        <View style={[styles.sectionCard, Shadows.card]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Activity size={18} color={Colors.secondary} />
              <Text style={styles.sectionTitle}>
                {isHindi ? "पुरानी बीमारियाँ व स्थितियाँ" : "Chronic Conditions"}
              </Text>
            </View>
          </View>

          <View style={styles.conditionsPillRow}>
            {activeParent.chronic_conditions.map((cond, idx) => (
              <View key={idx} style={styles.conditionPill}>
                <View style={styles.conditionDot} />
                <Text style={styles.conditionText}>{cond}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Surgical History & Hospitalizations */}
        <View style={[styles.sectionCard, Shadows.card]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <FileText size={18} color="#7C3AED" />
              <Text style={styles.sectionTitle}>
                {isHindi ? "पिछली सर्जरी व प्रक्रियाएं" : "Surgical History"}
              </Text>
            </View>
          </View>

          {activeParent.surgeries.length === 0 ? (
            <Text style={styles.emptyNote}>
              {isHindi ? "कोई सर्जरी दर्ज नहीं है।" : "No surgical procedures recorded."}
            </Text>
          ) : (
            activeParent.surgeries.map((s, idx) => (
              <View key={idx} style={styles.surgeryItem}>
                <View style={styles.surgeryIconBox}>
                  <Check size={14} color="#7C3AED" />
                </View>
                <View style={styles.surgeryInfo}>
                  <Text style={styles.surgeryName}>{s.name}</Text>
                  <Text style={styles.surgerySub}>
                    {s.date ? `Date: ${s.date}` : "Past"} {s.notes ? `• ${s.notes}` : ""}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Emergency Contacts Directory */}
        <View style={[styles.sectionCard, Shadows.card]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <ShieldAlert size={18} color={Colors.emergencyDark} />
              <Text style={styles.sectionTitle}>
                {isHindi ? "आपातकालीन संपर्क" : "Emergency Contacts"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.addSmallBtn}
              onPress={() => {
                triggerHaptic();
                setAddContactModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Plus size={13} color={Colors.primaryDark} />
              <Text style={styles.addSmallBtnText}>{isHindi ? "जोड़ें" : "Add"}</Text>
            </TouchableOpacity>
          </View>

          {activeParent.emergency_contacts.map((contact, idx) => (
            <View key={idx} style={styles.contactCard}>
              <View style={styles.contactMain}>
                <View style={styles.contactNameRow}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  {contact.is_primary && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.contactRelation}>{contact.relationship}</Text>
                <Text style={styles.contactPhone}>{contact.phone_number}</Text>
              </View>

              <TouchableOpacity
                style={styles.callCircleBtn}
                onPress={() => Linking.openURL(`tel:${contact.phone_number.replace(/\s+/g, "")}`)}
                activeOpacity={0.7}
              >
                <Phone size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Primary Care Doctors Directory */}
        <View style={[styles.sectionCard, Shadows.card]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Stethoscope size={18} color={Colors.primaryDark} />
              <Text style={styles.sectionTitle}>
                {isHindi ? "प्राथमिक चिकित्सक" : "Primary Doctors"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.addSmallBtn}
              onPress={() => {
                triggerHaptic();
                setAddDocModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Plus size={13} color={Colors.primaryDark} />
              <Text style={styles.addSmallBtnText}>{isHindi ? "जोड़ें" : "Add"}</Text>
            </TouchableOpacity>
          </View>

          {activeParent.primary_doctors.map((doc, idx) => (
            <View key={idx} style={styles.doctorItemCard}>
              <View style={styles.docAvatarCircle}>
                <Text style={styles.docAvatarInitials}>Dr</Text>
              </View>

              <View style={styles.doctorItemInfo}>
                <Text style={styles.docName}>{doc.name}</Text>
                <Text style={styles.docSpecialty}>{doc.specialty}</Text>
                <Text style={styles.docFacility}>{doc.hospital_or_clinic}</Text>
              </View>

              <TouchableOpacity
                style={styles.docCallBtn}
                onPress={() => Linking.openURL(`tel:${doc.phone_number.replace(/\s+/g, "")}`)}
                activeOpacity={0.7}
              >
                <Phone size={14} color={Colors.primaryDark} />
                <Text style={styles.docCallBtnText}>{isHindi ? "कॉल" : "Call"}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Clinical Summary & Quick Sharing Actions */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.shareSummaryBtn}
            onPress={() => setDoctorShareModalVisible(true)}
            activeOpacity={0.8}
          >
            <LinearGradient colors={Gradients.doctor} style={styles.btnGradient}>
              <Share2 size={16} color="#FFFFFF" />
              <Text style={styles.btnGradientText}>
                {isHindi ? "डॉक्टर रिपोर्ट साझा करें" : "Share Doctor Brief QR"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.emergencyCardBtn}
            onPress={() => setSosModalVisible(true)}
            activeOpacity={0.8}
          >
            <LinearGradient colors={Gradients.sos} style={styles.btnGradient}>
              <ShieldAlert size={16} color="#FFFFFF" />
              <Text style={styles.btnGradientText}>{isHindi ? "आपातकालीन कार्ड" : "Emergency SOS Card"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Health Profile Modal */}
      <SwipeableBottomSheet
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        maxHeight="92%"
      >
        <View style={styles.sheetInnerPadding}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isHindi ? "स्वास्थ्य प्रोफ़ाइल संपादित करें" : "Edit Parent Health Profile"}
            </Text>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}>
            <Text style={styles.inputLabel}>{isHindi ? "पूरा नाम" : "Full Name"}</Text>
            <TextInput style={styles.textInput} value={fullName} onChangeText={setFullName} />

            <Text style={styles.inputLabel}>{isHindi ? "फ़ोन नंबर" : "Phone Number"}</Text>
            <TextInput style={styles.textInput} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

            <Text style={styles.inputLabel}>{isHindi ? "रक्त समूह" : "Blood Group"}</Text>
            <TextInput style={styles.textInput} value={bloodGroup} onChangeText={setBloodGroup} />

            <Text style={styles.inputLabel}>{isHindi ? "घर का पता" : "Residential Address"}</Text>
            <TextInput
              style={[styles.textInput, { height: 60 }]}
              value={address}
              onChangeText={setAddress}
              multiline
            />

            <Text style={styles.inputLabel}>{isHindi ? "एलर्जी (अल्पविराम से अलग करें)" : "Allergies (comma-separated)"}</Text>
            <TextInput
              style={styles.textInput}
              value={allergiesText}
              onChangeText={setAllergiesText}
              placeholder="Penicillin, Sulfa drugs, Aspirin"
            />

            <Text style={styles.inputLabel}>{isHindi ? "पुरानी बीमारियाँ (अल्पविराम से अलग करें)" : "Chronic Conditions (comma-separated)"}</Text>
            <TextInput
              style={styles.textInput}
              value={conditionsText}
              onChangeText={setConditionsText}
              placeholder="Type 2 Diabetes, Hypertension, Osteoarthritis"
            />

            <Text style={styles.inputLabel}>{isHindi ? "महत्वपूर्ण मेडिकल नोट्स" : "Clinical Notes & Alerts"}</Text>
            <TextInput
              style={[styles.textInput, { height: 60 }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Add special medical instructions..."
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} activeOpacity={0.8}>
              <LinearGradient colors={Gradients.primary} style={styles.btnGradient}>
                <Text style={styles.btnGradientText}>{isHindi ? "प्रोफ़ाइल सहेजें" : "Save Health Profile"}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SwipeableBottomSheet>

      {/* Add Emergency Contact Modal */}
      <SwipeableBottomSheet
        visible={addContactModalVisible}
        onClose={() => setAddContactModalVisible(false)}
        maxHeight="92%"
      >
        <View style={styles.sheetInnerPadding}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isHindi ? "आपातकालीन संपर्क जोड़ें" : "Add Emergency Contact"}</Text>
            <TouchableOpacity onPress={() => setAddContactModalVisible(false)}>
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}>
            <Text style={styles.inputLabel}>{isHindi ? "नाम *" : "Full Name *"}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Emergency contact name"
              value={contactName}
              onChangeText={setContactName}
            />

            <Text style={styles.inputLabel}>{isHindi ? "रिश्ता *" : "Relationship *"}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Daughter (Bangalore), Son, Neighbor"
              value={contactRelation}
              onChangeText={setContactRelation}
            />

            <Text style={styles.inputLabel}>{isHindi ? "फ़ोन नंबर *" : "Phone Number *"}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="+91 98765 43210"
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setContactPrimary(!contactPrimary)}
            >
              <View style={[styles.checkboxBox, contactPrimary && styles.checkboxBoxChecked]}>
                {contactPrimary && <Check size={12} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxLabel}>
                {isHindi ? "प्राथमिक आपातकालीन संपर्क बनाएं" : "Set as Primary Emergency Contact"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleAddContact} activeOpacity={0.8}>
              <LinearGradient colors={Gradients.primary} style={styles.btnGradient}>
                <Text style={styles.btnGradientText}>{isHindi ? "संपर्क सहेजें" : "Save Emergency Contact"}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SwipeableBottomSheet>

      {/* Add Primary Doctor Modal */}
      <SwipeableBottomSheet
        visible={addDocModalVisible}
        onClose={() => setAddDocModalVisible(false)}
        maxHeight="92%"
      >
        <View style={styles.sheetInnerPadding}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isHindi ? "डॉक्टर विवरण जोड़ें" : "Add Primary Doctor"}</Text>
            <TouchableOpacity onPress={() => setAddDocModalVisible(false)}>
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}>
            <Text style={styles.inputLabel}>{isHindi ? "डॉक्टर का नाम *" : "Doctor Name *"}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Doctor's full name"
              value={docName}
              onChangeText={setDocName}
            />

            <Text style={styles.inputLabel}>{isHindi ? "विशेषज्ञता *" : "Specialty *"}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Cardiology, Endocrinology, Orthopedic"
              value={docSpecialty}
              onChangeText={setDocSpecialty}
            />

            <Text style={styles.inputLabel}>{isHindi ? "अस्पताल या क्लिनिक" : "Hospital or Clinic"}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Fortis Memorial Research Institute"
              value={docClinic}
              onChangeText={setDocClinic}
            />

            <Text style={styles.inputLabel}>{isHindi ? "क्लिनिक फ़ोन नंबर" : "Phone Number"}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="+91 98223 34455"
              value={docPhone}
              onChangeText={setDocPhone}
              keyboardType="phone-pad"
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleAddDoctor} activeOpacity={0.8}>
              <LinearGradient colors={Gradients.primary} style={styles.btnGradient}>
                <Text style={styles.btnGradientText}>{isHindi ? "डॉक्टर सहेजें" : "Save Doctor"}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SwipeableBottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  sheetInnerPadding: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Platform.OS === "ios" ? 34 : Spacing.lg,
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 12,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(13, 148, 136, 0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.18)",
  },
  backButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  seniorHeaderTitle: {
    fontSize: Typography.seniorSizes.lg,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textMuted,
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  editProfileBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  switcherRow: {
    flexDirection: "row",
    gap: 8,
  },
  switchChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  switchChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  switchChipText: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  switchChipTextActive: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  heroCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroAvatarBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  heroAvatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
  },
  heroAvatarText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: "#FFFFFF",
  },
  heroInfo: {
    flex: 1,
  },
  heroNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: "#FFFFFF",
  },
  bloodBadge: {
    backgroundColor: Colors.emergency,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  bloodBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: Typography.weights.extraBold,
  },
  heroSubText: {
    fontSize: Typography.sizes.xs,
    color: "#E2E8F0",
    marginTop: 2,
  },
  heroContactRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  heroContactBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  heroContactText: {
    color: "#FFFFFF",
    fontSize: Typography.sizes.xxs,
    fontWeight: Typography.weights.semibold,
  },
  heroAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  heroAddressText: {
    color: "#E2E8F0",
    fontSize: Typography.sizes.xxs,
    flex: 1,
  },
  allergyBanner: {
    backgroundColor: "#FEF2F2",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
  },
  allergyIconBox: {
    marginRight: 12,
  },
  allergyTextContent: {
    flex: 1,
  },
  allergyTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.extraBold,
    color: Colors.emergencyDark,
  },
  allergyList: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: "#991B1B",
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  addSmallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryLight,
  },
  addSmallBtnText: {
    fontSize: Typography.sizes.xxs,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  conditionsPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  conditionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.secondaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
  },
  conditionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryDark,
  },
  conditionText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.secondaryDark,
  },
  surgeryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  surgeryIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  surgeryInfo: {
    flex: 1,
  },
  surgeryName: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  surgerySub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  emptyNote: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    fontStyle: "italic",
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  contactMain: {
    flex: 1,
  },
  contactNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  contactName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  primaryBadge: {
    backgroundColor: Colors.emergencyLight,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: BorderRadius.xs,
  },
  primaryBadgeText: {
    fontSize: 9,
    fontWeight: Typography.weights.extraBold,
    color: Colors.emergencyDark,
  },
  contactRelation: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textMuted,
  },
  contactPhone: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  callCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.success,
    justifyContent: "center",
    alignItems: "center",
  },
  doctorItemCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  docAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  docAvatarInitials: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  doctorItemInfo: {
    flex: 1,
  },
  docName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  docSpecialty: {
    fontSize: Typography.sizes.xxs,
    color: Colors.secondaryDark,
    fontWeight: Typography.weights.semibold,
  },
  docFacility: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  docCallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryLight,
  },
  docCallBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  actionButtonsRow: {
    gap: 8,
    marginTop: 4,
  },
  shareSummaryBtn: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  emergencyCardBtn: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  btnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  btnGradientText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  dismissArea: {
    flex: 1,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Platform.OS === "ios" ? 34 : Spacing.lg,
    maxHeight: "88%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  inputLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxBoxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textPrimary,
  },
  saveBtn: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
});
