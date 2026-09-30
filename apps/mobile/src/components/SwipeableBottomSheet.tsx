// apps/mobile/src/components/SwipeableBottomSheet.tsx
import React, { useRef, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  PanResponder,
  StyleProp,
  ViewStyle,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

interface SwipeableBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: string | number;
  containerStyle?: StyleProp<ViewStyle>;
  grabHandleColor?: string;
  testID?: string;
}

export const SwipeableBottomSheet: React.FC<SwipeableBottomSheetProps> = ({
  visible,
  onClose,
  children,
  maxHeight = "90%",
  containerStyle,
  grabHandleColor = "#94A3B8",
  testID,
}) => {
  const translateY = useRef(new Animated.Value(900)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const isDismissing = useRef(false);

  useEffect(() => {
    if (visible) {
      isDismissing.current = false;
      translateY.stopAnimation();
      backdropOpacity.stopAnimation();
      translateY.setValue(900);
      backdropOpacity.setValue(0);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 280,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      translateY.setValue(900);
      backdropOpacity.setValue(0);
    }
  }, [backdropOpacity, translateY, visible]);

  const triggerHaptic = useCallback(() => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {}
  }, []);

  const dismiss = useCallback(() => {
    if (isDismissing.current) return;
    isDismissing.current = true;
    triggerHaptic();
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 900,
        duration: 240,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      translateY.setValue(900);
      isDismissing.current = false;
    });
  }, [backdropOpacity, onClose, translateY, triggerHaptic]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Detect intentional downward swipe
        return gestureState.dy > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        return gestureState.dy > 12 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 55 || gestureState.vy > 0.4) {
          dismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            friction: 7,
            tension: 50,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={dismiss}
      testID={testID}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <View style={styles.modalBackdrop}>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.backdropTint, { opacity: backdropOpacity }]}
        />
        {/* Top Dismissable Backdrop Area */}
        <TouchableOpacity
          style={styles.dismissArea}
          activeOpacity={1}
          onPress={() => {
            dismiss();
          }}
          accessibilityLabel="Close bottom sheet"
        />

        {/* Animated Curved Bottom Sheet Container */}
        <Animated.View
          style={[
            styles.halfSheetContainer,
            { maxHeight: maxHeight as any, transform: [{ translateY }] },
            containerStyle,
          ]}
        >
          {Platform.OS !== "web" && (
            <BlurView
              intensity={78}
              tint="light"
              blurMethod={Platform.OS === "android" ? "none" : undefined}
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
            />
          )}
          {/* Top Swiping Zone with Grab Handle (Supports Dragging Down to Close) */}
          <View {...panResponder.panHandlers} style={styles.swipeDragZone}>
            <View style={[styles.grabHandle, { backgroundColor: grabHandleColor }]} />
          </View>

          {children}
        </Animated.View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoider: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdropTint: {
    backgroundColor: "rgba(15, 23, 42, 0.58)",
  },
  dismissArea: {
    flex: 1,
  },
  halfSheetContainer: {
    backgroundColor: "rgba(248, 250, 252, 0.94)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 20,
  },
  swipeDragZone: {
    width: "100%",
    minHeight: 30,
    paddingTop: 8,
    paddingBottom: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(241, 245, 249, 0.6)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(226, 232, 240, 0.8)",
  },
  grabHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
  },
});

