import React from "react";
import { MapPin, ArrowUpRight } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { Colors, Spacing } from "../theme";
import type { NearbyMapCanvasProps } from "./NearbyMapCanvas.types";

export const NearbyMapFallback: React.FC<NearbyMapCanvasProps> = ({
  isHindi,
  unavailableReason,
  onOpenExternalMap,
}) => (
  <View style={styles.webMapFallback}>
    <MapPin size={30} color={Colors.primaryDark} />
    <Text style={styles.title}>
      {unavailableReason === "expo-go"
        ? (isHindi ? "पूरा मानचित्र दिखाने के लिए ParentPulse ऐप बनाएं" : "Build ParentPulse to use the interactive map")
        : unavailableReason === "native-error"
          ? (isHindi ? "मानचित्र इस डिवाइस पर शुरू नहीं हो सका" : "The map could not start on this device")
          : (isHindi ? "इस क्षेत्र का मानचित्र खोलें" : "Open this area in a map")}
    </Text>
    <Text style={styles.description}>
      {unavailableReason === "expo-go"
        ? (isHindi
          ? "Expo Go में MapLibre शामिल नहीं है। विकास बिल्ड बनाकर ParentPulse ऐप खोलें। आस-पास की सूची अभी भी नीचे उपलब्ध है।"
          : "Expo Go does not include MapLibre. Install the ParentPulse development build for the interactive map. Nearby results remain available below.")
        : unavailableReason === "native-error"
          ? (isHindi
            ? "ऐप का नया बिल्ड इंस्टॉल करें या मानचित्र को बाहर खोलें। आस-पास की सूची नीचे उपलब्ध है।"
            : "Install the latest ParentPulse build or open the external map. Nearby results remain available below.")
        : (isHindi ? "आस-पास के स्वास्थ्य केंद्रों की सूची नीचे उपलब्ध है।" : "Nearby healthcare results remain available in the list below.")}
    </Text>
    <TouchableOpacity style={styles.openButton} onPress={onOpenExternalMap} activeOpacity={0.85}>
      <ArrowUpRight size={15} color="#FFFFFF" />
      <Text style={styles.openButtonText}>{isHindi ? "OpenStreetMap में खोलें" : "Open OpenStreetMap"}</Text>
    </TouchableOpacity>
    <Text style={styles.attribution}>© OpenStreetMap contributors</Text>
  </View>
);

const styles = {
  webMapFallback: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: Spacing.xl,
    backgroundColor: "#E8F0E9",
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "800" as const,
    textAlign: "center" as const,
    marginTop: 12,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center" as const,
    marginTop: 6,
    maxWidth: 280,
  },
  openButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 7,
    backgroundColor: Colors.primaryDark,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 12,
  },
  openButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700" as const,
  },
  attribution: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 14,
  },
};
