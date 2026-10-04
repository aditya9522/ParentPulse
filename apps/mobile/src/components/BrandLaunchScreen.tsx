import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, StatusBar, Text, View } from "react-native";
import { createThemedStyles } from "../theme";
import * as SplashScreen from "expo-splash-screen";
import Svg, { Path } from "react-native-svg";

interface BrandLaunchScreenProps {
  onFinished: () => void;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

export const BrandLaunchScreen: React.FC<BrandLaunchScreenProps> = ({ onFinished }) => {
  const entrance = useRef(new Animated.Value(0)).current;
  const launchProgress = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const entranceAnimation = Animated.spring(entrance, {
      toValue: 1,
      friction: 8,
      tension: 45,
      useNativeDriver: true,
    });
    const progressAnimation = Animated.timing(launchProgress, {
      toValue: 1,
      duration: 1850,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });

    entranceAnimation.start();
    progressAnimation.start();

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
      progressAnimation.stop();
    };
  }, [entrance, exit, launchProgress, onFinished]);

  return (
    <Animated.View
      style={[styles.container, { opacity: exit }]}
      onLayout={() => void SplashScreen.hideAsync().catch(() => undefined)}
      accessibilityLabel="ParentPulse is starting"
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

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
        <Image source={require("../../assets/icon.png")} style={styles.logo} resizeMode="contain" />
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
            <Path d="M1 17 H53 L62 17 L68 5 L76 28 L84 12 L91 17 H189" stroke="#CCFBF1" strokeWidth="3" strokeLinecap="round" fill="none" />
            <AnimatedPath
              d="M1 17 H53 L62 17 L68 5 L76 28 L84 12 L91 17 H189"
              stroke="#0D9488"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              strokeDasharray="220 220"
              strokeDashoffset={launchProgress.interpolate({ inputRange: [0, 1], outputRange: [220, 0] })}
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
              { width: launchProgress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) },
            ]}
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = createThemedStyles({
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
    backgroundColor: "#F8FAFC",
  },
  hero: { width: 206, height: 206, alignItems: "center", justifyContent: "center" },
  logo: {
    width: 148,
    height: 148,
    borderRadius: 34,
  },
  brandBlock: { alignItems: "center", marginTop: 25 },
  brand: {
    color: "#0F172A",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.1,
  },
  tagline: {
    marginTop: 8,
    color: "#475569",
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
    borderColor: "#99F6E4",
    backgroundColor: "#F0FDFA",
  },
  secureDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8, backgroundColor: "#0D9488" },
  trustText: { color: "#334155", fontSize: 8, fontWeight: "700", letterSpacing: 0.55 },
  loadingBlock: { position: "absolute", bottom: 58, alignItems: "center" },
  loadingText: { color: "#64748B", fontSize: 8, fontWeight: "800", letterSpacing: 1.5 },
  progressTrack: {
    width: 104,
    height: 3,
    marginTop: 11,
    borderRadius: 2,
    overflow: "hidden",
    backgroundColor: "#D1FAE5",
  },
  progressBar: {
    width: "100%",
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#0D9488",
  },
});
