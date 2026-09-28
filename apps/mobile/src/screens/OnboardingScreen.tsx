// apps/mobile/src/screens/OnboardingScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "../context/AppContext";
import { Colors, Typography, Spacing, Shadows, BorderRadius, Glass } from "../theme";

interface OnboardingScreenProps {
  onComplete: () => void;
}

type OnboardingStep = 0 | 1 | 2 | 3 | 4 | 5;

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const CHRONIC_CONDITIONS = [
  "Hypertension",
  "Type 2 Diabetes",
  "Mild Osteoarthritis",
  "Hypothyroidism",
  "Cardiac History",
  "Asthma",
  "High Cholesterol",
];
const COMMON_ALLERGIES = ["Penicillin", "Sulfa drugs", "Aspirin", "Ibuprofen", "None"];

const WALKTHROUGH_SLIDES = [
  {
    id: "vitals",
    category: "REMOTE CARE & VITALS",
    categoryHi: "रिमोट केयर एवं वाइटल्स",
    title: "Monitor Vitals From Miles Away",
    titleHi: "मीलों दूर से भी रखें स्वास्थ्य पर नज़र",
    desc: "Real-time sync for resting BP, fasting glucose, and heart rate. Instant alert notifications when parent readings fluctuate outside safe thresholds.",
    descHi: "ब्लड प्रेशर, शुगर व पल्स की रियल-टाइम ट्रैकिंग। कोई भी रीडिंग असामान्य होने पर परिवार को तुरंत सूचना।",
    image: require("../../assets/walkthrough/walkthrough_care.jpg"),
    tags: ["Real-Time Sync", "WhatsApp Alerts", "Remote Care Circles"],
    icon: "pulse" as const,
  },
  {
    id: "meds",
    category: "SMART MEDICATION",
    categoryHi: "स्मार्ट दवा समय-सारणी",
    title: "Never Miss a Dose or Refill",
    titleHi: "दवा की सही खुराक, सही समय पर",
    desc: "Intelligent pill schedules with meal instructions (Before/After Food). Instant family dose confirmations and low-stock pharmacy refill reminders.",
    descHi: "भोजन से पहले या बाद की स्पष्ट जानकारी के साथ दवा अनुस्मारक। कम स्टॉक होने पर फार्मेसी रीफिल अलर्ट।",
    image: require("../../assets/walkthrough/walkthrough_meds.jpg"),
    tags: ["Dose Confirmation", "Pharmacy Refill Alarm", "Adherence Tracking"],
    icon: "medkit" as const,
  },
  {
    id: "maps",
    category: "EMERGENCY & LIVE MAPS",
    categoryHi: "आपातकालीन एसओएस एवं लाइव मैप",
    title: "Full-Screen Emergency SOS & GPS",
    titleHi: "आपातकालीन एसओएस एवं अस्पताल रडार",
    desc: "1-tap emergency siren instantly broadcasts live GPS beacons to all care circle members and navigates to the nearest verified 24/7 hospitals.",
    descHi: "एक टैप में सायरन व परिवार को लाइव लोकेशन ब्रॉडकास्ट। निकटतम 24/7 अस्पतालों व आईसीयू का सीधा रास्ता।",
    image: require("../../assets/walkthrough/walkthrough_maps.jpg"),
    tags: ["1-Tap Siren", "Live Hospital Radar", "GPS Beacon Broadcast"],
    icon: "navigate" as const,
  },
  {
    id: "doctor",
    category: "DOCTOR BRIEFS & QR PASS",
    categoryHi: "डिजिटल डॉक्टर ब्रीफ एवं क्यूआर",
    title: "Instant Doctor-Ready Briefs & QR",
    titleHi: "तुरंत तैयार डॉक्टर कंसल्टेशन ब्रीफ",
    desc: "Say goodbye to messy paper files. Generate clean, encrypted 48-hour consultation briefs with prescription OCR scanning and QR access.",
    descHi: "मोटी मेडिकल फाइलें ले जाने का झंझट खत्म। 48-घंटे के सुरक्षित डॉक्टर ब्रीफ और प्रिस्क्रिप्शन कैमरा स्कैनर।",
    image: require("../../assets/walkthrough/walkthrough_doctor.jpg"),
    tags: ["Encrypted 48-Hr QR", "Prescription OCR", "No Bulky Files"],
    icon: "qr-code" as const,
  },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { registerNewParentAndFamily, language, seniorMode, setLanguage } = useApp();

  const [step, setStep] = useState<OnboardingStep>(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Step 2 State: Family & User Role
  const [caregiverRole, setCaregiverRole] = useState("daughter");
  const [familyName, setFamilyName] = useState("");

  // Step 3 State: Parent Profile Form
  const [parentName, setParentName] = useState("");
  const [parentRelationship, setParentRelationship] = useState("");
  const [parentDob, setParentDob] = useState("");
  const [parentGender] = useState("other");
  const [bloodGroup, setBloodGroup] = useState("");
  const [preferredLang] = useState("en");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [primaryDoctor, setPrimaryDoctor] = useState("");
  const [emergencyContact] = useState("");

  // Step 4 State: Loading / Backend Sync
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState("Creating your Family Care Circle...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Toggle helpers
  const toggleCondition = (cond: string) => {
    if (selectedConditions.includes(cond)) {
      setSelectedConditions(selectedConditions.filter((c) => c !== cond));
    } else {
      setSelectedConditions([...selectedConditions, cond]);
    }
  };

  const toggleAllergy = (allg: string) => {
    if (allg === "None") {
      setSelectedAllergies(["None"]);
      return;
    }
    const filtered = selectedAllergies.filter((a) => a !== "None");
    if (filtered.includes(allg)) {
      setSelectedAllergies(filtered.filter((a) => a !== allg));
    } else {
      setSelectedAllergies([...filtered, allg]);
    }
  };

  // Submit to Backend API
  const handleCreateProfile = async () => {
    if (!familyName.trim() || !parentName.trim() || !parentDob.trim() || !address.trim() || !phoneNumber.trim()) {
      setErrorMessage("Complete the required family and parent details before continuing.");
      return;
    }
    setIsSyncing(true);
    setErrorMessage(null);
    setSyncStatus("Connecting to ParentPulse API...");

    try {
      setSyncStatus("Provisioning Family Circle & Medical Records...");

      const parentPayload = {
        full_name: parentName.trim(),
        date_of_birth: parentDob.trim(),
        gender: parentGender,
        blood_group: bloodGroup,
        preferred_language: preferredLang,
        address: address.trim(),
        phone_number: phoneNumber.trim(),
        allergies: selectedAllergies.filter((a) => a !== "None"),
        chronic_conditions: selectedConditions,
        disabilities: [],
        surgeries: [],
        emergency_contacts: emergencyContact.trim() ? [{
          name: emergencyContact.split("(")[0].trim(),
          relationship: caregiverRole,
          phone_number: emergencyContact.match(/\(([^)]+)\)/)?.[1]?.trim() || "",
          is_primary: true,
        }] : [],
        primary_doctors: primaryDoctor
          ? [
              {
                name: primaryDoctor.split("(")[0].trim(),
                specialty: "",
                hospital_or_clinic: primaryDoctor.includes("(")
                  ? primaryDoctor.replace(/.*\((.*?)\).*/, "$1")
                  : "",
                phone_number: "",
              },
            ]
          : [],
        notes: `Created via Interactive Onboarding by ${caregiverRole}`,
      };

      await registerNewParentAndFamily(familyName.trim(), parentPayload);

      setSyncStatus("Care Circle Provisioned Successfully!");
      setTimeout(() => {
        setIsSyncing(false);
        setStep(5); // Celebration state
      }, 700);
    } catch (err: any) {
      setErrorMessage(err instanceof Error ? err.message : "The care circle could not be created. Try again.");
      setIsSyncing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="pulse" size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.logoText}>ParentPulse</Text>
            <Text style={styles.logoSubText}>Distance Eldercare</Text>
          </View>
        </View>

        <View style={styles.topRightControls}>
          <TouchableOpacity
            style={styles.langToggleBtn}
            onPress={() => setLanguage(language === "en" ? "hi" : "en")}
            activeOpacity={0.7}
          >
            <Text style={styles.langToggleText}>
              {language === "en" ? "🇮🇳 हिंदी" : "🇬🇧 English"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipBtn}
            onPress={onComplete}
            activeOpacity={0.7}
          >
            <Text style={styles.skipBtnText}>{language === "hi" ? "छोड़ें" : "Skip"}</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.primaryDeep} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Dots Bar - Only show on steps 1-5 */}
      {step > 0 && (
        <View style={styles.progressRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                step === s && styles.progressDotActive,
                step > s && styles.progressDotCompleted,
              ]}
            />
          ))}
        </View>
      )}

      {/* STEP 0: App Opening & Welcome Splash Screen */}
      {step === 0 && (
        <ScrollView contentContainerStyle={styles.welcomeScrollContent} showsVerticalScrollIndicator={false}>
          {/* Welcome Visual Hero Card */}
          <View style={[styles.welcomeHeroCard, Shadows.cardElevated]}>
            <Image
              source={require("../../assets/walkthrough/welcome_hero.jpg")}
              style={styles.welcomeHeroImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(15, 23, 42, 0.85)"]}
              style={styles.welcomeHeroGradient}
            >
              <View style={styles.heroPillsRow}>
                <View style={styles.heroPill}>
                  <Ionicons name="heart" size={12} color="#F43F5E" />
                  <Text style={styles.heroPillText}>AI Eldercare</Text>
                </View>
                <View style={styles.heroPill}>
                  <Ionicons name="globe-outline" size={12} color="#06B6D4" />
                  <Text style={styles.heroPillText}>24/7 Family Sync</Text>
                </View>
                <View style={styles.heroPill}>
                  <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                  <Text style={styles.heroPillText}>Verified Doctors</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Welcome Text */}
          <View style={styles.welcomeTextWrap}>
            <View style={styles.tagBadge}>
              <Ionicons name="sparkles" size={13} color={Colors.primaryDeep} />
              <Text style={styles.tagBadgeText}>
                {language === "hi" ? "दूर रहकर भी अपनों का ख्याल" : "DISTANCE ELDERCARE PLATFORM"}
              </Text>
            </View>

            <Text style={[styles.welcomeTitle, seniorMode && styles.seniorTitle]}>
              {language === "hi" ? "दूर रहकर भी अपनों की\nसंपूर्ण देखभाल" : "Distance Eldercare,\nCloser Than Ever"}
            </Text>

            <Text style={[styles.welcomeDesc, seniorMode && styles.seniorDesc]}>
              {language === "hi"
                ? "बुजुर्ग माता-पिता, दूर रहने वाले बच्चों और डॉक्टरों को जोड़ने वाला भारत का पहला ऑल-इन-वन डिजिटल केयर हब।"
                : "A unified lifeline connecting elderly parents with remote children, verified doctors, and real-time medical vaults."}
            </Text>
          </View>

          {/* 3 Core Value Pillars */}
          <View style={styles.valuePillarsWrap}>
            <View style={styles.valuePillar}>
              <View style={[styles.pillarIconWrap, { backgroundColor: "#E0F2FE" }]}>
                <Ionicons name="pulse" size={18} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pillarTitle}>
                  {language === "hi" ? "दैनिक वाइटल्स व अलर्ट्स" : "Daily Vitals & Live Sync"}
                </Text>
                <Text style={styles.pillarDesc}>
                  {language === "hi" ? "बीपी, शुगर व पल्स की रियल-टाइम सिंक" : "Resting BP, fasting glucose & pulse rings"}
                </Text>
              </View>
            </View>

            <View style={styles.valuePillar}>
              <View style={[styles.pillarIconWrap, { backgroundColor: "#F0FDF4" }]}>
                <Ionicons name="medkit" size={18} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pillarTitle}>
                  {language === "hi" ? "स्मार्ट दवा समय-सारणी" : "Smart Medicine Schedules"}
                </Text>
                <Text style={styles.pillarDesc}>
                  {language === "hi" ? "खाने से पहले/बाद के निर्देश व रीफिल अलर्ट" : "Timed doses with meal instructions & refill alarms"}
                </Text>
              </View>
            </View>

            <View style={styles.valuePillar}>
              <View style={[styles.pillarIconWrap, { backgroundColor: "#FEF2F2" }]}>
                <Ionicons name="navigate" size={18} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pillarTitle}>
                  {language === "hi" ? "1-टैप एसओएस एवं अस्पताल मैप" : "1-Tap SOS & Full Maps"}
                </Text>
                <Text style={styles.pillarDesc}>
                  {language === "hi" ? "तत्काल सायरन, जीपीएस व निकटतम अस्पताल" : "Instant siren broadcast & nearest 24/7 ICUs"}
                </Text>
              </View>
            </View>
          </View>

          {/* Welcome Actions */}
          <TouchableOpacity
            style={[styles.primaryActionBtn, Shadows.glowTeal, { marginBottom: 12 }]}
            onPress={() => setStep(1)}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryActionBtnText}>
              {language === "hi" ? "वॉकथ्रू टूर शुरू करें" : "Start Walkthrough Tour"}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exploreDirectBtn}
            onPress={onComplete}
            activeOpacity={0.7}
          >
            <Text style={styles.exploreDirectText}>
              {language === "hi" ? "सीधे केयर हब में प्रवेश करें" : "Explore Care Hub Directly"}
            </Text>
            <Ionicons name="chevron-forward" size={15} color={Colors.textSecondary} />
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* STEP 1: Feature Hero Carousel with 4 Generated 3D Images */}
      {step === 1 && (
        <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
          {/* Category Pill & Step Counter */}
          <View style={styles.slideCategoryRow}>
            <View style={styles.slideCategoryPill}>
              <Ionicons name={WALKTHROUGH_SLIDES[currentSlideIndex].icon} size={14} color={Colors.primaryDark} />
              <Text style={styles.slideCategoryText}>
                {language === "hi"
                  ? WALKTHROUGH_SLIDES[currentSlideIndex].categoryHi
                  : WALKTHROUGH_SLIDES[currentSlideIndex].category}
              </Text>
            </View>
            <Text style={styles.slideStepCounter}>
              {currentSlideIndex + 1} / {WALKTHROUGH_SLIDES.length}
            </Text>
          </View>

          {/* Slide 3D Image Card */}
          <View style={[styles.slideImageCard, Shadows.cardElevated]}>
            <Image
              source={WALKTHROUGH_SLIDES[currentSlideIndex].image}
              style={styles.slideImage}
              resizeMode="cover"
            />
          </View>

          {/* Slide Title and Description */}
          <Text style={[styles.slideTitle, seniorMode && styles.seniorTitle]}>
            {language === "hi"
              ? WALKTHROUGH_SLIDES[currentSlideIndex].titleHi
              : WALKTHROUGH_SLIDES[currentSlideIndex].title}
          </Text>
          <Text style={[styles.slideDesc, seniorMode && styles.seniorDesc]}>
            {language === "hi"
              ? WALKTHROUGH_SLIDES[currentSlideIndex].descHi
              : WALKTHROUGH_SLIDES[currentSlideIndex].desc}
          </Text>

          {/* Slide Tags Chips */}
          <View style={styles.slideTagsRow}>
            {WALKTHROUGH_SLIDES[currentSlideIndex].tags.map((tag, tIdx) => (
              <View key={tIdx} style={styles.slideTag}>
                <Ionicons name="checkmark-circle" size={13} color={Colors.primary} />
                <Text style={styles.slideTagText}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* Slide Indicator Dots (Clickable) */}
          <View style={styles.slideDotsRow}>
            {WALKTHROUGH_SLIDES.map((_, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setCurrentSlideIndex(idx)}
                style={[
                  styles.slideDot,
                  currentSlideIndex === idx && styles.slideDotActive,
                ]}
                accessibilityLabel={`Slide ${idx + 1}`}
              />
            ))}
          </View>

          {/* Carousel Nav Buttons */}
          <View style={styles.carouselNavRow}>
            {currentSlideIndex > 0 ? (
              <TouchableOpacity
                style={styles.carouselBackBtn}
                onPress={() => setCurrentSlideIndex(currentSlideIndex - 1)}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={16} color={Colors.textSecondary} />
                <Text style={styles.carouselBackText}>{language === "hi" ? "पिछला" : "Prev"}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.carouselBackBtn}
                onPress={() => setStep(0)}
                activeOpacity={0.7}
              >
                <Ionicons name="home-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.carouselBackText}>{language === "hi" ? "स्वागत" : "Welcome"}</Text>
              </TouchableOpacity>
            )}

            {currentSlideIndex < WALKTHROUGH_SLIDES.length - 1 ? (
              <TouchableOpacity
                style={[styles.primaryActionBtn, styles.flexButton, Shadows.glowTeal]}
                onPress={() => setCurrentSlideIndex(currentSlideIndex + 1)}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryActionBtnText}>
                  {language === "hi" ? "अगला फ़ीचर" : "Next Feature"}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.primaryActionBtn, styles.flexButton, Shadows.glowTeal]}
                onPress={() => setStep(2)}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryActionBtnText}>
                  {language === "hi" ? "केयर सर्कल बनाएं" : "Set Up Care Circle"}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}

      {/* STEP 2: Role & Family Name */}
      {step === 2 && (
        <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.stepHeading, seniorMode && styles.seniorTitle]}>
            Tell us about your care circle
          </Text>
          <Text style={styles.stepSubheading}>
            Select your role to personalize notifications, reminders, and daily coordination.
          </Text>

          <Text style={styles.fieldLabel}>I am caring as a:</Text>
          <View style={styles.rolesGrid}>
            {[
              { id: "daughter", label: "Daughter", sub: "Remote Caregiver", icon: "woman" as const },
              { id: "son", label: "Son", sub: "Remote Caregiver", icon: "man" as const },
              { id: "caregiver", label: "In-Home Caregiver", sub: "Local / Nurse", icon: "heart" as const },
              { id: "self", label: "Parent (Self)", sub: "Managing My Health", icon: "person" as const },
            ].map((r) => {
              const isSelected = caregiverRole === r.id;
              return (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.roleCard, isSelected && styles.roleCardActive]}
                  onPress={() => setCaregiverRole(r.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.roleIconCircle, isSelected && styles.roleIconCircleActive]}>
                    <Ionicons
                      name={r.icon}
                      size={20}
                      color={isSelected ? "#FFFFFF" : Colors.primaryDark}
                    />
                  </View>
                  <Text style={[styles.roleCardLabel, isSelected && styles.roleCardLabelActive]}>
                    {r.label}
                  </Text>
                  <Text style={styles.roleCardSub}>{r.sub}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Family Care Circle Name:</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="people-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={familyName}
              onChangeText={setFamilyName}
              placeholder="e.g. Our family care"
              placeholderTextColor={Colors.textSubtle}
            />
          </View>

          {/* Quick Presets */}
          <View style={styles.presetChipsRow}>
            {["Our Family Care", "Parents Health Circle", "Family Care Hub"].map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.presetChip, familyName === p && styles.presetChipActive]}
                onPress={() => setFamilyName(p)}
              >
                <Text style={[styles.presetChipText, familyName === p && styles.presetChipTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
              <Ionicons name="arrow-back" size={18} color={Colors.textSecondary} />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryActionBtn, styles.flexButton, Shadows.glowTeal]}
              onPress={() => setStep(3)}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryActionBtnText}>Next: Parent Health</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* STEP 3: Parent Profile Details Form */}
      {step === 3 && (
        <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.stepHeading, seniorMode && styles.seniorTitle]}>
            Add Parent Health Profile
          </Text>
          <Text style={styles.stepSubheading}>
            Enter essential medical information for emergencies, medication tracking, and doctor visits.
          </Text>

          {/* Full Name & Relationship */}
          <Text style={styles.fieldLabel}>Parent Full Name:</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={parentName}
              onChangeText={setParentName}
              placeholder="Parent's full name"
              placeholderTextColor={Colors.textSubtle}
            />
          </View>

          <View style={styles.twoColRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Relationship:</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.textInput}
                  value={parentRelationship}
                  onChangeText={setParentRelationship}
                  placeholder="Father / Mother"
                  placeholderTextColor={Colors.textSubtle}
                />
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Date of Birth:</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.textInput}
                  value={parentDob}
                  onChangeText={setParentDob}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.textSubtle}
                />
              </View>
            </View>
          </View>

          {/* Blood Group Chips */}
          <Text style={styles.fieldLabel}>Blood Group:</Text>
          <View style={styles.chipsRow}>
            {BLOOD_GROUPS.map((bg) => (
              <TouchableOpacity
                key={bg}
                style={[styles.bloodChip, bloodGroup === bg && styles.bloodChipActive]}
                onPress={() => setBloodGroup(bg)}
              >
                <Text style={[styles.bloodChipText, bloodGroup === bg && styles.bloodChipTextActive]}>
                  {bg}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Chronic Conditions Multi-Select */}
          <Text style={styles.fieldLabel}>Known Chronic Conditions:</Text>
          <View style={styles.chipsWrap}>
            {CHRONIC_CONDITIONS.map((cond) => {
              const isSelected = selectedConditions.includes(cond);
              return (
                <TouchableOpacity
                  key={cond}
                  style={[styles.conditionChip, isSelected && styles.conditionChipActive]}
                  onPress={() => toggleCondition(cond)}
                >
                  <Ionicons
                    name={isSelected ? "checkmark-circle" : "add-circle-outline"}
                    size={14}
                    color={isSelected ? Colors.primaryDeep : Colors.textMuted}
                  />
                  <Text style={[styles.conditionChipText, isSelected && styles.conditionChipTextActive]}>
                    {cond}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Allergies Multi-Select */}
          <Text style={styles.fieldLabel}>Drug Allergies:</Text>
          <View style={styles.chipsWrap}>
            {COMMON_ALLERGIES.map((allg) => {
              const isSelected = selectedAllergies.includes(allg);
              return (
                <TouchableOpacity
                  key={allg}
                  style={[styles.allergyChip, isSelected && styles.allergyChipActive]}
                  onPress={() => toggleAllergy(allg)}
                >
                  <Ionicons
                    name={isSelected ? "alert-circle" : "shield-outline"}
                    size={14}
                    color={isSelected ? Colors.emergencyDark : Colors.textMuted}
                  />
                  <Text style={[styles.allergyChipText, isSelected && styles.allergyChipTextActive]}>
                    {allg}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* City / Address */}
          <Text style={styles.fieldLabel}>Home City & Address:</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="location-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={address}
              onChangeText={setAddress}
              placeholder="e.g. Sector 14, Gurugram, Haryana"
              placeholderTextColor={Colors.textSubtle}
            />
          </View>

          {/* Phone Number */}
          <Text style={styles.fieldLabel}>Parent Phone Number:</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="call-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="+91 98123 45678"
              keyboardType="phone-pad"
              placeholderTextColor={Colors.textSubtle}
            />
          </View>

          {/* Primary Doctor */}
          <Text style={styles.fieldLabel}>Primary Consulting Doctor:</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="medkit-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={primaryDoctor}
              onChangeText={setPrimaryDoctor}
              placeholder="Doctor name and clinic"
              placeholderTextColor={Colors.textSubtle}
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
              <Ionicons name="arrow-back" size={18} color={Colors.textSecondary} />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryActionBtn, styles.flexButton, Shadows.glowTeal]}
              onPress={handleCreateProfile}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryActionBtnText}>Create Care Circle</Text>
              <Ionicons name="cloud-upload" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* STEP 4: Live Backend API Provisioning Screen */}
      {isSyncing && (
        <View style={styles.syncOverlay}>
          <View style={[styles.syncCard, Glass.card, Shadows.cardElevated]}>
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginBottom: 16 }} />
            <Text style={styles.syncTitle}>Initializing Care Hub</Text>
            <Text style={styles.syncStatus}>{syncStatus}</Text>

            <View style={styles.syncStepsList}>
              <View style={styles.syncStepItem}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.syncStepText}>FastAPI Family Care API connected</Text>
              </View>
              <View style={styles.syncStepItem}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.syncStepText}>Parent medical profile configured</Text>
              </View>
              <View style={styles.syncStepItem}>
                <Ionicons name="sync" size={16} color={Colors.primary} />
                <Text style={styles.syncStepText}>Syncing emergency SOS & dose schedules</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* STEP 5: Interactive Celebration & Launch */}
      {step === 5 && !isSyncing && (
        <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
          <View style={styles.celebrationBox}>
            <View style={styles.celebrationImageBadgeWrap}>
              <Image
                source={require("../../assets/walkthrough/celebration_success.jpg")}
                style={styles.celebrationSuccessImage}
                resizeMode="cover"
              />
            </View>

            <Text style={[styles.celebrationTitle, seniorMode && styles.seniorTitle]}>
              🎉 Care Circle Ready!
            </Text>
            <Text style={styles.celebrationSub}>
              {familyName} has been configured. You can now coordinate medicines, vitals, and emergency briefs from anywhere in the world.
            </Text>
          </View>

          {/* Profile Summary Card */}
          <View style={[styles.summaryCard, Shadows.cardElevated]}>
            <View style={styles.summaryTopRow}>
              <View style={styles.summaryAvatar}>
                <Text style={styles.summaryAvatarText}>{parentName.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryParentName}>{parentName}</Text>
                <Text style={styles.summarySub}>{parentRelationship} • {address.split(",")[0]}</Text>
              </View>
              <View style={styles.summaryBloodPill}>
                <Text style={styles.summaryBloodText}>{bloodGroup}</Text>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryStatsRow}>
              <View style={styles.summaryStatItem}>
                <Ionicons name="medkit" size={16} color={Colors.primary} />
                <Text style={styles.summaryStatVal}>Active</Text>
                <Text style={styles.summaryStatLbl}>Med Schedule</Text>
              </View>

              <View style={styles.summaryStatItem}>
                <Ionicons name="pulse" size={16} color={Colors.secondary} />
                <Text style={styles.summaryStatVal}>120/80</Text>
                <Text style={styles.summaryStatLbl}>Resting BP</Text>
              </View>

              <View style={styles.summaryStatItem}>
                <Ionicons name="shield-checkmark" size={16} color={Colors.emergencyDark} />
                <Text style={styles.summaryStatVal}>Active</Text>
                <Text style={styles.summaryStatLbl}>SOS Vault</Text>
              </View>
            </View>
          </View>

          {errorMessage && (
            <View style={styles.infoBanner}>
              <Ionicons name="information-circle" size={18} color={Colors.secondary} />
              <Text style={styles.infoBannerText}>{errorMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.launchHubBtn, Shadows.glowTeal]}
            onPress={onComplete}
            activeOpacity={0.85}
          >
            <Text style={styles.launchHubBtnText}>Enter Care Hub</Text>
            <Ionicons name="rocket" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === "ios" ? 44 : 12,
    paddingBottom: 8,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoBadge: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryDark,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  logoSubText: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: Typography.weights.semibold,
  },
  topRightControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  langToggleBtn: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  langToggleText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  skipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
  },
  skipBtnText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDeep,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.borderStrong,
  },
  progressDotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  progressDotCompleted: {
    backgroundColor: Colors.success,
  },
  stepContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 40,
  },
  welcomeScrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 40,
  },
  welcomeHeroCard: {
    width: "100%",
    height: 240,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#0F172A",
    marginBottom: Spacing.md,
  },
  welcomeHeroImage: {
    width: "100%",
    height: "100%",
  },
  welcomeHeroGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  heroPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.full,
  },
  heroPillText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: "#FFFFFF",
  },
  welcomeTextWrap: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  tagBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    marginBottom: 8,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDeep,
    letterSpacing: 0.5,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 8,
  },
  welcomeDesc: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: Spacing.sm,
  },
  valuePillarsWrap: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: 12,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  valuePillar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pillarIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  pillarTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  pillarDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  exploreDirectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  exploreDirectText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  slideCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: Spacing.sm,
  },
  slideCategoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
  },
  slideCategoryText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
    letterSpacing: 0.5,
  },
  slideStepCounter: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
  },
  slideImageCard: {
    width: "100%",
    height: 220,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    backgroundColor: "#0F172A",
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  slideImage: {
    width: "100%",
    height: "100%",
  },
  slideTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    textAlign: "center",
    lineHeight: 28,
    marginTop: Spacing.sm,
    marginBottom: 6,
  },
  slideDesc: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  seniorTitle: {
    fontSize: Typography.seniorSizes.lg,
  },
  seniorDesc: {
    fontSize: Typography.seniorSizes.sm,
  },
  slideTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: Spacing.md,
  },
  slideTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  slideTagText: {
    fontSize: 11,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
  slideDotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: Spacing.lg,
  },
  slideDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.borderStrong,
  },
  slideDotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  carouselNavRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  carouselBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  carouselBackText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  featuresCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: 12,
    marginBottom: Spacing.xl,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  featureItemText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    flex: 1,
  },
  primaryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primaryDark,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
  },
  primaryActionBtnText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: "#FFFFFF",
  },
  stepHeading: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  stepSubheading: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginTop: 10,
    marginBottom: 6,
  },
  rolesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: Spacing.sm,
  },
  roleCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    ...Shadows.subtle,
  },
  roleCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFaint,
  },
  roleIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  roleIconCircleActive: {
    backgroundColor: Colors.primaryDark,
  },
  roleCardLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  roleCardLabelActive: {
    color: Colors.primaryDeep,
  },
  roleCardSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
  },
  presetChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: Spacing.lg,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  presetChipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  presetChipTextActive: {
    color: Colors.primaryDeep,
    fontWeight: Typography.weights.bold,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: Spacing.md,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backBtnText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  flexButton: {
    flex: 1,
  },
  twoColRow: {
    flexDirection: "row",
    gap: 10,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  bloodChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bloodChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  bloodChipText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  bloodChipTextActive: {
    color: Colors.primaryDeep,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  conditionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  conditionChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  conditionChipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  conditionChipTextActive: {
    color: Colors.primaryDeep,
    fontWeight: Typography.weights.bold,
  },
  allergyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  allergyChipActive: {
    backgroundColor: Colors.emergencyLight,
    borderColor: Colors.emergency,
  },
  allergyChipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  allergyChipTextActive: {
    color: Colors.emergencyDark,
    fontWeight: Typography.weights.bold,
  },
  syncOverlay: {
    ...(StyleSheet.absoluteFill as any),
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  syncCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: "center",
  },
  syncTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  syncStatus: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: 16,
  },
  syncStepsList: {
    width: "100%",
    gap: 10,
  },
  syncStepItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  syncStepText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  celebrationBox: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  celebrationImageBadgeWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
    borderWidth: 3,
    borderColor: "#10B981",
    ...Shadows.glowTeal,
    backgroundColor: "#FFFFFF",
  },
  celebrationSuccessImage: {
    width: "100%",
    height: "100%",
  },
  celebrationTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  celebrationSub: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryAvatarText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDeep,
  },
  summaryParentName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  summarySub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  summaryBloodPill: {
    backgroundColor: Colors.emergencyLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  summaryBloodText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.emergencyDark,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 12,
  },
  summaryStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryStatItem: {
    alignItems: "center",
    gap: 3,
  },
  summaryStatVal: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  summaryStatLbl: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.secondaryLight,
    padding: 10,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  infoBannerText: {
    fontSize: 11,
    color: Colors.secondaryDark,
    flex: 1,
  },
  launchHubBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primaryDark,
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
  },
  launchHubBtnText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: "#FFFFFF",
  },
});
