import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, StatusBar, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import Svg, { Path } from "react-native-svg";

interface BrandLaunchScreenProps {
  onFinished: () => void;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

export const BrandLaunchScreen: React.FC<BrandLaunchScreenProps> = ({ onFinished }) => {
  const entrance = useRef(new Animated.Value(0)).current;
  const orbit = useRef(new Animated.Value(0)).current;
  const heartbeat = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const entranceAnimation = Animated.spring(entrance, {
      toValue: 1,
      friction: 8,
      tension: 45,
      useNativeDriver: true,
    });
    const orbitAnimation = Animated.loop(
      Animated.timing(orbit, {
        toValue: 1,
        duration: 4200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const heartbeatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(heartbeat, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        Animated.delay(250),
        Animated.timing(heartbeat, { toValue: 0, duration: 1, useNativeDriver: false }),
      ]),
    );

    entranceAnimation.start();
    orbitAnimation.start();
    heartbeatAnimation.start();

    const finishTimer = setTimeout(() => {
      Animated.timing(exit, {
        toValue: 0,
        duration: 360,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onFinished();
      });
    }, 2200);

    return () => {
      clearTimeout(finishTimer);
      entranceAnimation.stop();
      orbitAnimation.stop();
      heartbeatAnimation.stop();
    };
  }, [entrance, exit, heartbeat, onFinished, orbit]);

  const orbitRotation = orbit.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <Animated.View
      style={[styles.container, { opacity: exit }]}
      onLayout={() => void SplashScreen.hideAsync().catch(() => undefined)}
      accessibilityLabel="ParentPulse is starting"
    >
      <StatusBar barStyle="light-content" backgroundColor="#043F3B" />
      <LinearGradient colors={["#032E2C", "#075E57", "#0F766E"]} style={StyleSheet.absoluteFill} />
      <View style={styles.topGlow} />
      <View style={styles.bottomGlow} />
      <View style={styles.textureRingLarge} />
      <View style={styles.textureRingSmall} />

      <Animated.View
        style={[
          styles.hero,
          {
            opacity: entrance,
            transform: [
              { scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] }) },
              { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
            ],
          },
        ]}
      >
        <Animated.View style={[styles.orbit, { transform: [{ rotate: orbitRotation }] }]}> 
          <View style={styles.tealDot} />
          <View style={styles.coralDot} />
        </Animated.View>
        <View style={styles.logoHalo}>
          <LinearGradient colors={["rgba(255,255,255,0.32)", "rgba(255,255,255,0.08)"]} style={styles.haloGradient}>
            <View style={styles.logoCard}>
              <Image source={require("../../assets/icon.png")} style={styles.logo} resizeMode="contain" />
            </View>
          </LinearGradient>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.brandBlock,
          {
            opacity: entrance,
            transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          },
        ]}
      >
        <Text style={styles.brand}>ParentPulse</Text>
        <Text style={styles.tagline}>DISTANCE ELDERCARE, BEAUTIFULLY CONNECTED</Text>
        <View style={styles.waveFrame}>
          <Svg width="190" height="32" viewBox="0 0 190 32">
            <Path d="M1 17 H53 L62 17 L68 5 L76 28 L84 12 L91 17 H189" stroke="rgba(255,255,255,0.18)" strokeWidth="2" fill="none" />
            <AnimatedPath
              d="M1 17 H53 L62 17 L68 5 L76 28 L84 12 L91 17 H189"
              stroke="#85F3E6"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              strokeDasharray="220 220"
              strokeDashoffset={heartbeat.interpolate({ inputRange: [0, 1], outputRange: [220, 0] })}
            />
          </Svg>
        </View>
        <View style={styles.trustPill}>
          <View style={styles.secureDot} />
          <Text style={styles.trustText}>PRIVATE CARE CIRCLE  •  SECURE HEALTH SYNC</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.loadingBlock, { opacity: entrance }]}> 
        <Text style={styles.loadingText}>PREPARING YOUR CARE HUB</Text>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressBar,
              { transform: [{ scaleX: entrance.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) }] },
            ]}
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100000,
    elevation: 100000,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#043F3B",
  },
  topGlow: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    top: -190,
    right: -140,
    backgroundColor: "rgba(71, 215, 195, 0.14)",
  },
  bottomGlow: {
    position: "absolute",
    width: 330,
    height: 330,
    borderRadius: 165,
    bottom: -190,
    left: -150,
    backgroundColor: "rgba(255, 130, 91, 0.12)",
  },
  textureRingLarge: {
    position: "absolute",
    width: 480,
    height: 480,
    borderRadius: 240,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.045)",
  },
  textureRingSmall: {
    position: "absolute",
    width: 390,
    height: 390,
    borderRadius: 195,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  hero: { width: 206, height: 206, alignItems: "center", justifyContent: "center" },
  orbit: {
    position: "absolute",
    width: 198,
    height: 198,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(197,255,247,0.25)",
  },
  tealDot: {
    position: "absolute",
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#85F3E6",
    top: 20,
    right: 25,
    shadowColor: "#85F3E6",
    shadowOpacity: 0.9,
    shadowRadius: 7,
  },
  coralDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF9472",
    bottom: 27,
    left: 19,
    shadowColor: "#FF9472",
    shadowOpacity: 0.9,
    shadowRadius: 7,
  },
  logoHalo: {
    width: 158,
    height: 158,
    borderRadius: 52,
    shadowColor: "#001B19",
    shadowOpacity: 0.5,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 16 },
    elevation: 18,
  },
  haloGradient: { flex: 1, borderRadius: 52, padding: 4 },
  logoCard: {
    flex: 1,
    borderRadius: 48,
    padding: 7,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  logo: { width: "100%", height: "100%", borderRadius: 41 },
  brandBlock: { alignItems: "center", marginTop: 25 },
  brand: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.1,
  },
  tagline: {
    marginTop: 8,
    color: "#BDEAE4",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.35,
  },
  waveFrame: { height: 34, marginTop: 12, alignItems: "center" },
  trustPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  secureDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8, backgroundColor: "#85F3E6" },
  trustText: { color: "rgba(255,255,255,0.8)", fontSize: 8, fontWeight: "700", letterSpacing: 0.55 },
  loadingBlock: { position: "absolute", bottom: 58, alignItems: "center" },
  loadingText: { color: "rgba(255,255,255,0.58)", fontSize: 8, fontWeight: "800", letterSpacing: 1.5 },
  progressTrack: {
    width: 104,
    height: 3,
    marginTop: 11,
    borderRadius: 2,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  progressBar: {
    width: "100%",
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#85F3E6",
  },
});
