// apps/mobile/src/components/AmbientBackground.tsx
import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export const AmbientBackground: React.FC = () => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Base Canvas */}
      <View style={styles.baseCanvas} />

      {/* Top Right Luminous Teal Glow Orb */}
      <View style={styles.topRightOrb}>
        <LinearGradient
          colors={["rgba(13, 148, 136, 0.16)", "rgba(13, 148, 136, 0.0)"]}
          style={styles.orbGradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      {/* Mid Left Violet Glow Orb */}
      <View style={styles.midLeftOrb}>
        <LinearGradient
          colors={["rgba(139, 92, 246, 0.12)", "rgba(139, 92, 246, 0.0)"]}
          style={styles.orbGradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      {/* Bottom Right Soft Sky Blue Glow Orb */}
      <View style={styles.bottomRightOrb}>
        <LinearGradient
          colors={["rgba(2, 132, 199, 0.14)", "rgba(2, 132, 199, 0.0)"]}
          style={styles.orbGradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      {/* Top Left Subtle Amber/Coral Warmth */}
      <View style={styles.topLeftOrb}>
        <LinearGradient
          colors={["rgba(245, 158, 11, 0.08)", "rgba(245, 158, 11, 0.0)"]}
          style={styles.orbGradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  baseCanvas: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#F8FAFC",
  },
  topRightOrb: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 320,
    height: 320,
    borderRadius: 160,
    overflow: "hidden",
  },
  midLeftOrb: {
    position: "absolute",
    top: height * 0.35,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    overflow: "hidden",
  },
  bottomRightOrb: {
    position: "absolute",
    bottom: 40,
    right: -80,
    width: 340,
    height: 340,
    borderRadius: 170,
    overflow: "hidden",
  },
  topLeftOrb: {
    position: "absolute",
    top: 60,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    overflow: "hidden",
  },
  orbGradient: {
    width: "100%",
    height: "100%",
  },
});
