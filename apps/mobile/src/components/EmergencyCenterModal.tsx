import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AlertOctagon, CheckCircle2, Droplet, MapPin, PhoneCall, Radio, ShieldAlert, User, X } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { apiClient } from "../api/client";
import { useApp } from "../context/AppContext";
import { BorderRadius, Colors, Shadows, Spacing, Typography } from "../theme";
import { SwipeableBottomSheet } from "./SwipeableBottomSheet";

export const EmergencyCenterModal: React.FC = () => {
  const { activeParent, userLocation, sosModalVisible, setSosModalVisible, seniorMode } = useApp();
  const [eventId, setEventId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [delivery, setDelivery] = useState<{ registered: number; accepted: number } | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!eventId || !sosModalVisible) { pulse.setValue(1); return; }
    const loop = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1.045, duration: 650, useNativeDriver: true }), Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true })]));
    loop.start();
    return () => loop.stop();
  }, [eventId, pulse, sosModalVisible]);

  const haptic = () => {
    if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const activate = async () => {
    haptic();
    setBusy(true);
    try {
      const result = await apiClient.createSosEvent({ parent_id: activeParent.id, latitude: userLocation?.latitude, longitude: userLocation?.longitude, message: "Emergency assistance requested from ParentPulse" });
      setEventId(result.id);
      setDelivery({ registered: result.recipients_registered, accepted: result.pushes_accepted });
      Alert.alert("Emergency event active", result.pushes_accepted > 0 ? `${result.pushes_accepted} registered device${result.pushes_accepted === 1 ? "" : "s"} accepted the alert. Call emergency services for immediate help.` : "The emergency event is recorded, but no remote device confirmed push delivery. Call emergency services now.");
    } catch (error) {
      Alert.alert("Couldn’t activate remote SOS", `${error instanceof Error ? error.message : "The service is unavailable."}\n\nCall 112 or 108 for immediate help.`);
    } finally {
      setBusy(false);
    }
  };

  const resolve = async () => {
    if (!eventId) return;
    setBusy(true);
    try {
      const result = await apiClient.resolveSosEvent(eventId);
      setEventId(null);
      setDelivery(null);
      Alert.alert("SOS resolved", `${result.acknowledgements} family acknowledgement${result.acknowledgements === 1 ? "" : "s"} recorded.`);
    } catch (error) {
      Alert.alert("Couldn’t resolve SOS", error instanceof Error ? error.message : "Try again shortly.");
    } finally {
      setBusy(false);
    }
  };

  const call = (phone: string) => void Linking.openURL(`tel:${phone.replace(/\s+/g, "")}`);

  return <SwipeableBottomSheet visible={sosModalVisible} onClose={() => setSosModalVisible(false)} maxHeight="92%" grabHandleColor="#CBD5E1" testID="emergency-sos-modal">
    <View style={styles.header}><View style={styles.headerPill}><Radio size={14} color="#FFFFFF" /><Text style={styles.headerPillText}>EMERGENCY CENTER</Text></View><TouchableOpacity style={styles.close} onPress={() => setSosModalVisible(false)}><X size={20} color={Colors.textMuted} /></TouchableOpacity></View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Animated.View style={{ transform: [{ scale: pulse }] }}><TouchableOpacity style={styles.sosTouch} onPress={() => void (eventId ? resolve() : activate())} disabled={busy} activeOpacity={0.9}><LinearGradient colors={eventId ? ["#7F1D1D", "#991B1B"] : ["#EF4444", "#B91C1C"]} style={styles.sosGradient}>{busy ? <ActivityIndicator size="large" color="#FFFFFF" /> : <><View style={styles.sosIcon}><AlertOctagon size={46} color="#FFFFFF" /></View><Text style={[styles.sosTitle, seniorMode && { fontSize: 22 }]}>{eventId ? "SOS ACTIVE — TAP TO RESOLVE" : "ACTIVATE FAMILY SOS"}</Text><Text style={styles.sosSubtitle}>{eventId ? "The emergency event remains active until resolved" : "Creates a durable event and alerts registered family devices"}</Text></>}</LinearGradient></TouchableOpacity></Animated.View>

      {eventId && <View style={styles.deliveryCard}><CheckCircle2 size={20} color={delivery?.accepted ? "#15803D" : "#B45309"} /><View style={styles.deliveryInfo}><Text style={styles.deliveryTitle}>{delivery?.accepted ? "Push request accepted" : "No confirmed push target"}</Text><Text style={styles.deliveryText}>{delivery?.accepted || 0} accepted · {delivery?.registered || 0} registered device tokens</Text><Text style={styles.eventId}>Event ···{eventId.slice(-8)}</Text></View></View>}

      <Text style={styles.sectionLabel}>CALL EMERGENCY SERVICES</Text>
      <View style={styles.callRow}><CallButton number="112" label="National emergency" onPress={() => call("112")} /><CallButton number="108" label="Ambulance" onPress={() => call("108")} /></View>

      <Text style={styles.sectionLabel}>PRIMARY FAMILY CONTACTS</Text>
      {activeParent.emergency_contacts.map((contact) => <TouchableOpacity key={`${contact.phone_number}-${contact.name}`} style={[styles.contactCard, Shadows.card]} onPress={() => call(contact.phone_number)}><View style={styles.contactIcon}><User size={18} color={Colors.primaryDark} /></View><View style={styles.contactInfo}><Text style={styles.contactName}>{contact.name}</Text><Text style={styles.contactRelation}>{contact.relationship} · {contact.phone_number}</Text></View><PhoneCall size={18} color={Colors.primaryDark} /></TouchableOpacity>)}

      <View style={styles.medicalCard}><View style={styles.medicalHeader}><ShieldAlert size={20} color="#B91C1C" /><Text style={styles.medicalTitle}>Emergency medical ID</Text></View><InfoRow icon={<Droplet size={15} color="#B91C1C" />} label="Blood group" value={activeParent.blood_group} /><InfoRow icon={<AlertOctagon size={15} color="#B91C1C" />} label="Allergies" value={activeParent.allergies.join(", ") || "None recorded"} /><InfoRow icon={<MapPin size={15} color="#B91C1C" />} label="Location" value={userLocation ? `${userLocation.latitude.toFixed(5)}, ${userLocation.longitude.toFixed(5)}` : activeParent.address || "Unavailable"} /></View>
      <Text style={styles.disclaimer}>Push acceptance is not proof that a person saw the alert. Always call local emergency services when immediate help is required.</Text>
    </ScrollView>
  </SwipeableBottomSheet>;
};

const CallButton = ({ number, label, onPress }: { number: string; label: string; onPress: () => void }) => <TouchableOpacity style={styles.callButton} onPress={onPress}><PhoneCall size={20} color="#FFFFFF" /><View><Text style={styles.callNumber}>{number}</Text><Text style={styles.callLabel}>{label}</Text></View></TouchableOpacity>;
const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => <View style={styles.infoRow}>{icon}<Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.lg, paddingBottom: 10 }, headerPill: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, backgroundColor: "#B91C1C" }, headerPillText: { fontSize: 9, color: "#FFFFFF", fontWeight: "900", letterSpacing: 1 }, close: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "rgba(255,255,255,.82)" }, content: { paddingHorizontal: Spacing.lg, paddingBottom: 38 }, sosTouch: { borderRadius: 25, overflow: "hidden" }, sosGradient: { minHeight: 210, alignItems: "center", justifyContent: "center", padding: 24 }, sosIcon: { width: 76, height: 76, borderRadius: 27, backgroundColor: "rgba(255,255,255,.15)", alignItems: "center", justifyContent: "center" }, sosTitle: { color: "#FFFFFF", fontSize: 19, textAlign: "center", fontWeight: "900", marginTop: 15 }, sosSubtitle: { color: "#FEE2E2", fontSize: 11, lineHeight: 16, textAlign: "center", marginTop: 6 }, deliveryCard: { flexDirection: "row", gap: 11, padding: 14, borderRadius: 18, marginTop: 12, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: Colors.border }, deliveryInfo: { flex: 1 }, deliveryTitle: { fontSize: 13, fontWeight: "900", color: Colors.textPrimary }, deliveryText: { fontSize: 10, color: Colors.textMuted, marginTop: 3 }, eventId: { fontSize: 9, color: Colors.textMuted, marginTop: 5 }, sectionLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1.2, color: Colors.textMuted, marginTop: 20, marginBottom: 8 }, callRow: { flexDirection: "row", gap: 9 }, callButton: { flex: 1, minHeight: 72, flexDirection: "row", alignItems: "center", gap: 10, padding: 13, borderRadius: 18, backgroundColor: "#B91C1C" }, callNumber: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" }, callLabel: { color: "#FEE2E2", fontSize: 8, marginTop: 2 }, contactCard: { flexDirection: "row", alignItems: "center", gap: 11, padding: 13, borderRadius: 18, marginBottom: 8, backgroundColor: "#FFFFFF" }, contactIcon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: Colors.primaryFaint }, contactInfo: { flex: 1 }, contactName: { fontSize: 13, fontWeight: "800", color: Colors.textPrimary }, contactRelation: { fontSize: 9, color: Colors.textMuted, marginTop: 3 }, medicalCard: { padding: 15, borderRadius: 20, backgroundColor: "#FFF7F7", borderWidth: 1, borderColor: "#FECACA", marginTop: 17 }, medicalHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 9 }, medicalTitle: { fontSize: 14, fontWeight: "900", color: "#991B1B" }, infoRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#FEE2E2" }, infoLabel: { width: 70, fontSize: 9, fontWeight: "700", color: Colors.textMuted }, infoValue: { flex: 1, textAlign: "right", fontSize: 10, fontWeight: "700", color: Colors.textPrimary }, disclaimer: { fontSize: 9, lineHeight: 14, color: Colors.textMuted, textAlign: "center", marginTop: 15 },
});
