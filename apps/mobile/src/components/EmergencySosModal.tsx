// apps/mobile/src/components/EmergencySosModal.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  Platform,
  Animated,
} from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import {
  ShieldAlert,
  PhoneCall,
  MapPin,
  Activity,
  QrCode,
  AlertOctagon,
  X,
  Radio,
  Droplet,
  User,
} from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { Colors, Typography, Spacing, Shadows, Gradients } from "../theme";
import { SwipeableBottomSheet } from "./SwipeableBottomSheet";

export const EmergencySosModal: React.FC = () => {
  const { activeParent, sosModalVisible, setSosModalVisible, seniorMode, language } = useApp();
  const [sosActive, setSosActive] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isHindi = language === "hi";

  useEffect(() => {
    if (sosActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [sosActive]);

  const triggerHaptic = (type: "heavy" | "warning" = "heavy") => {
    try {
      if (Platform.OS !== "web") {
        if (type === "warning") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
      }
    } catch {
      // Graceful fallback
    }
  };

  const triggerSosBroadcast = () => {
    triggerHaptic("warning");
    setSosActive(true);
    Alert.alert(
      isHindi ? "🚨 SOS अलर्ट प्रसारित हुआ!" : "🚨 SOS Broadcast Sent!",
      isHindi
        ? `आपातकालीन सूचना और जीपीएस स्थान निम्नलिखित संपर्कों को भेजा गया:\n• प्रिया शर्मा (+91 98765 43210)\n• सुनीता शर्मा\n• स्थानीय केयरगिवर`
        : `Emergency notification and GPS location shared with:\n• Priya Sharma (+91 98765 43210)\n• Sunita Sharma\n• Local Caregiver`,
      [{ text: isHindi ? "ठीक है" : "OK" }]
    );
  };

  const callEmergency = (phone: string) => {
    triggerHaptic("heavy");
    Linking.openURL(`tel:${phone.replace(/\s+/g, "")}`);
  };

  return (
    <SwipeableBottomSheet
      visible={sosModalVisible}
      onClose={() => setSosModalVisible(false)}
      maxHeight="88%"
      grabHandleColor="#CBD5E1"
      testID="emergency-sos-modal"
    >
      {/* Top Emergency Action Header */}
      <View style={styles.topBar}>
        <View style={styles.topHeaderTitleRow}>
          <View style={styles.emergencyPill}>
            <Radio size={14} color="#FFFFFF" />
            <Text style={styles.emergencyPillText}>
              {isHindi ? "आपातकालीन केंद्र" : "EMERGENCY DISPATCH"}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic("heavy");
            setSosModalVisible(false);
          }}
          style={styles.closeBtn}
          activeOpacity={0.8}
        >
          <X size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Beacon Animated One-Tap SOS Button */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={styles.sosButtonTouch}
            onPress={triggerSosBroadcast}
            activeOpacity={0.9}
            accessibilityLabel="Press to broadcast SOS to family"
          >
            <LinearGradient
              colors={sosActive ? ["#7F1D1D", "#991B1B"] : Gradients.crimson}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bigSosGradient}
            >
              <View style={styles.sosIconContainer}>
                <AlertOctagon size={48} color="#FFFFFF" strokeWidth={2.2} />
              </View>
              <Text style={[styles.bigSosText, seniorMode && styles.seniorBigSosText]}>
                {sosActive
                  ? isHindi
                    ? "SOS सक्रिय - लाइव प्रसारण"
                    : "SOS ACTIVE - BROADCASTING"
                  : isHindi
                    ? "एक-टैप आपातकालीन SOS"
                    : "ONE-TAP FAMILY SOS"}
              </Text>
              <Text style={styles.sosSubtext}>
                {sosActive
                  ? isHindi
                    ? "लाइव स्थान और डिजिटल हेल्थ कार्ड सभी संपर्कों को भेजा गया"
                    : "Live GPS coordinates & medical ID sent to all family members"
                  : isHindi
                    ? "बच्चों और नजदीकी केयरगिवर को तुरंत जीपीएस अलर्ट भेजें"
                    : "Instantly alerts children & local caregivers with GPS beacon"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Dials Row: 108 Ambulance & 112 Police */}
        <View style={styles.quickDialGrid}>
          <TouchableOpacity
            style={[styles.quickDialCard, styles.ambulanceCard]}
            onPress={() => callEmergency("108")}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#DC2626", "#B91C1C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.quickDialGradient}
            >
              <PhoneCall size={20} color="#FFFFFF" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.dialTitle}>108 Ambulance</Text>
                <Text style={styles.dialSub}>{isHindi ? "राष्ट्रीय एम्बुलेंस" : "Emergency Medical"}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickDialCard, styles.policeCard]}
            onPress={() => callEmergency("112")}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#1E3A8A", "#1E40AF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.quickDialGradient}
            >
              <PhoneCall size={20} color="#FFFFFF" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.dialTitle}>112 Helpline</Text>
                <Text style={styles.dialSub}>{isHindi ? "राष्ट्रीय आपातकाल" : "All-India Emergency"}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Family Emergency Contacts */}
        <View style={styles.sectionHeaderRow}>
          <ShieldAlert size={18} color={Colors.primaryDark} />
          <Text style={[styles.sectionTitle, seniorMode && styles.seniorSectionTitle]}>
            {isHindi ? "परिवार के आपातकालीन संपर्क" : "Family Emergency Contacts"}
          </Text>
        </View>

        {activeParent.emergency_contacts.map((contact, i) => (
          <View key={i} style={[styles.contactRow, Shadows.card]}>
            <View style={styles.contactAvatarCircle}>
              <User size={18} color={Colors.primaryDark} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactRel}>
                {contact.relationship} {contact.is_primary && "• Primary Contact"}
              </Text>
              <Text style={styles.contactPhone}>{contact.phone_number}</Text>
            </View>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => callEmergency(contact.phone_number)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#16A34A", "#15803D"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.callBtnGradient}
              >
                <PhoneCall size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.callBtnText}>{isHindi ? "कॉल" : "CALL"}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ))}

        {/* Digital Emergency Health Card */}
        <View style={[styles.healthCard, Shadows.cardElevated]}>
          <View style={styles.cardHeader}>
            <View style={styles.badgeRow}>
              <Activity size={15} color="#DC2626" />
              <Text style={styles.cardBadge}>
                {isHindi ? "आधिकारिक डिजिटल स्वास्थ्य कार्ड" : "OFFICIAL DIGITAL HEALTH CARD"}
              </Text>
            </View>
            <View style={styles.bloodBadge}>
              <Droplet size={13} color="#DC2626" fill="#DC2626" />
              <Text style={styles.cardBlood}>{activeParent.blood_group}</Text>
            </View>
          </View>

          <Text style={styles.patientName}>{activeParent.full_name}</Text>
          <Text style={styles.patientMeta}>
            DOB: {activeParent.date_of_birth} • Phone: {activeParent.phone_number}
          </Text>
          <View style={styles.addressRow}>
            <MapPin size={13} color={Colors.textMuted} />
            <Text style={styles.patientAddress}>{activeParent.address}</Text>
          </View>

          <View style={styles.divider} />

          {/* Critical Allergies */}
          <View style={styles.critSection}>
            <Text style={styles.critTitle}>
              {isHindi ? "एलर्जी (दवा न दें):" : "ALLERGIES (DO NOT ADMINISTER):"}
            </Text>
            <View style={styles.allergyPill}>
              <Text style={styles.allergyText}>
                {activeParent.allergies.join(", ") || (isHindi ? "कोई नहीं" : "None Known")}
              </Text>
            </View>
          </View>

          {/* Chronic Conditions */}
          <View style={styles.critSection}>
            <Text style={styles.critTitle}>
              {isHindi ? "पुरानी बीमारियाँ:" : "CHRONIC CONDITIONS:"}
            </Text>
            <Text style={styles.critValue}>
              {activeParent.chronic_conditions.join(" • ") || "None"}
            </Text>
          </View>

          {/* Attending Physician */}
          <View style={styles.critSection}>
            <Text style={styles.critTitle}>
              {isHindi ? "प्राथमिक चिकित्सक:" : "ATTENDING PHYSICIAN:"}
            </Text>
            <Text style={styles.critValue}>
              {activeParent.primary_doctors[0]?.name} (
              {activeParent.primary_doctors[0]?.hospital_or_clinic}) •{" "}
              {activeParent.primary_doctors[0]?.phone_number}
            </Text>
          </View>

          {/* QR Code Presentation Box */}
          <View style={styles.qrContainer}>
            <View style={styles.qrMock}>
              <QrCode size={36} color={Colors.primaryDark} />
              <Text style={styles.qrText}>
                {isHindi ? "सत्यापित मेडिकल समरी हेतु स्कैन करें" : "SCAN FOR VERIFIED MEDICAL SUMMARY"}
              </Text>
              <Text style={styles.qrSub}>
                parentpulse.care/qr/{activeParent.id.slice(0, 8)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SwipeableBottomSheet>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  emergencyPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.emergency,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 6,
  },
  emergencyPillText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  sosButtonTouch: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: Spacing.lg,
    ...Shadows.glowRed,
  },
  bigSosGradient: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  sosIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  bigSosText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.8,
    textAlign: "center",
  },
  seniorBigSosText: {
    fontSize: 24,
  },
  sosSubtext: {
    color: "#FEE2E2",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  quickDialGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: Spacing.lg,
  },
  quickDialCard: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    ...Shadows.card,
  },
  ambulanceCard: {},
  policeCard: {},
  quickDialGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  dialTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  dialSub: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 1,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  seniorSectionTitle: {
    fontSize: 18,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: Spacing.md,
    borderRadius: 14,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contactAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  contactName: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  contactRel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  contactPhone: {
    fontSize: 13,
    color: Colors.primaryDark,
    fontWeight: "700",
    marginTop: 2,
  },
  callBtn: {
    borderRadius: 10,
    overflow: "hidden",
  },
  callBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  callBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
  },
  healthCard: {
    marginTop: Spacing.md,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardBadge: {
    color: "#991B1B",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  bloodBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardBlood: {
    fontSize: 13,
    fontWeight: "900",
    color: "#DC2626",
  },
  patientName: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  patientMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  patientAddress: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: Spacing.md,
  },
  critSection: {
    marginBottom: Spacing.sm,
  },
  critTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#DC2626",
    letterSpacing: 0.5,
  },
  allergyPill: {
    alignSelf: "flex-start",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginTop: 4,
  },
  allergyText: {
    color: "#B91C1C",
    fontWeight: "700",
    fontSize: 13,
  },
  critValue: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: 2,
  },
  qrContainer: {
    marginTop: Spacing.md,
    alignItems: "center",
  },
  qrMock: {
    backgroundColor: "#F8FAFC",
    padding: Spacing.md,
    borderRadius: 14,
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qrText: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginTop: 6,
  },
  qrSub: {
    fontSize: 11,
    color: Colors.primaryDark,
    marginTop: 2,
    fontWeight: "600",
  },
});
