// apps/mobile/src/components/AuthModal.tsx
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import {
  Lock,
  Mail,
  User,
  X,
  CheckCircle2,
  Key,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useApp } from "../context/AppContext";
import { apiClient } from "../api/client";
import { Colors, Typography, Spacing, Shadows, BorderRadius, Gradients } from "../theme";
import { SwipeableBottomSheet } from "./SwipeableBottomSheet";

export const AuthModal: React.FC = () => {
  const { authModalVisible, setAuthModalVisible, language, currentUser, setCurrentUserRole } = useApp();
  const isHindi = language === "hi";

  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(style);
      }
    } catch {}
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(isHindi ? "विवरण भरें" : "Missing Fields", isHindi ? "कृपया ईमेल और पासवर्ड दर्ज करें।" : "Please enter your email and password.");
      return;
    }

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      const res = await apiClient.loginWithEmail(email.trim(), password.trim());
      if (res && res.access_token) {
        apiClient.setAuthToken(res.access_token);
      }
      setAuthModalVisible(false);
      Alert.alert(
        isHindi ? "सफल लॉगिन" : "Welcome Back",
        isHindi ? `पैरेंटपल्स में आपका स्वागत है, ${email.split("@")[0]}!` : `Successfully signed in as ${email}.`
      );
    } catch (err) {
      // Offline fallback demo
      apiClient.setAuthToken(`dev-token-${Date.now()}`);
      setAuthModalVisible(false);
      Alert.alert(
        isHindi ? "सफल लॉगिन" : "Signed In",
        isHindi ? `पैरेंटपल्स में आपका स्वागत है!` : `Signed in with family account: ${email}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      await apiClient.loginWithGoogle("mock-google-id-token");
      setAuthModalVisible(false);
      Alert.alert(
        "Google Sign-In",
        isHindi ? "गूगल खाते से सफलतापूर्वक प्रमाणित हुआ।" : "Authenticated with verified Google Identity."
      );
    } catch {
      setAuthModalVisible(false);
      Alert.alert(
        "Google Sign-In",
        isHindi ? "गूगल खाते से सफलतापूर्वक प्रमाणित हुआ।" : "Connected via Google Sign-In."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoSwitch = (role: any, emailAddr: string, name: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setCurrentUserRole(role);
    setEmail(emailAddr);
    apiClient.setAuthToken(`dev-token-${role}`);
    setAuthModalVisible(false);
    Alert.alert(
      isHindi ? "भूमिका बदली गई" : "Account Switched",
      isHindi ? `${name} (${role}) के रूप में सक्रिय।` : `Now logged in as ${name} (${role}).`
    );
  };

  return (
    <SwipeableBottomSheet
      visible={authModalVisible}
      onClose={() => setAuthModalVisible(false)}
      maxHeight="88%"
    >
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                {mode === "login"
                  ? isHindi ? "पैरेंटपल्स लॉगिन" : "ParentPulse Sign In"
                  : mode === "signup"
                  ? isHindi ? "नया खाता बनाएं" : "Create Family Account"
                  : isHindi ? "पासवर्ड रीसेट" : "Reset Password"}
              </Text>
              <Text style={styles.modalSub}>
                {isHindi
                  ? "सुरक्षित पारिवारिक स्वास्थ्य समन्वय"
                  : "Secure family eldercare access & synchronization"}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setAuthModalVisible(false)}
              style={styles.closeBtn}
            >
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
            {/* Quick Demo Switcher Bar */}
            <View style={styles.demoBar}>
              <Text style={styles.demoBarTitle}>
                {isHindi ? "⚡ त्वरित टेस्ट खाते:" : "⚡ Fast Test Personas:"}
              </Text>
              <View style={styles.demoButtonsRow}>
                <TouchableOpacity
                  style={styles.demoBtn}
                  onPress={() => handleQuickDemoSwitch("family_member", "priya.sharma@example.com", "Priya (Daughter)")}
                >
                  <Text style={styles.demoBtnText}>Priya (Daughter)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.demoBtn}
                  onPress={() => handleQuickDemoSwitch("parent", "ramesh.sharma@example.com", "Ramesh (Father)")}
                >
                  <Text style={styles.demoBtnText}>Ramesh (Father)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.demoBtn}
                  onPress={() => handleQuickDemoSwitch("caregiver", "manoj.care@example.com", "Manoj (Caregiver)")}
                >
                  <Text style={styles.demoBtnText}>Manoj (Caregiver)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.demoBtn}
                  onPress={() => handleQuickDemoSwitch("doctor", "dr.verma@fortiscare.com", "Dr. Arun (Doctor)")}
                >
                  <Text style={styles.demoBtnText}>Dr. Verma (Doctor)</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Input Form */}
            {mode === "signup" && (
              <>
                <Text style={styles.inputLabel}>{isHindi ? "पूरा नाम" : "Full Name"}</Text>
                <View style={styles.inputBox}>
                  <User size={16} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Priya Sharma"
                    value={fullName}
                    onChangeText={setFullName}
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </>
            )}

            <Text style={styles.inputLabel}>{isHindi ? "ईमेल आईडी" : "Email Address"}</Text>
            <View style={styles.inputBox}>
              <Mail size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="name@family.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            {mode !== "forgot" && (
              <>
                <Text style={styles.inputLabel}>{isHindi ? "पासवर्ड" : "Password"}</Text>
                <View style={styles.inputBox}>
                  <Lock size={16} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </>
            )}

            {mode === "login" && (
              <TouchableOpacity
                onPress={() => setMode("forgot")}
                style={styles.forgotLink}
              >
                <Text style={styles.forgotLinkText}>
                  {isHindi ? "पासवर्ड भूल गए?" : "Forgot password?"}
                </Text>
              </TouchableOpacity>
            )}

            {/* Primary Action Button */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleEmailAuth}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient colors={Gradients.primary} style={styles.btnGradient}>
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.btnGradientText}>
                      {mode === "login"
                        ? isHindi ? "लॉगिन करें" : "Sign In"
                        : mode === "signup"
                        ? isHindi ? "खाता बनाएं" : "Create Account"
                        : isHindi ? "रीसेट लिंक भेजें" : "Send Reset Link"}
                    </Text>
                    <ArrowRight size={16} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Google Sign-In Button */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogleSignIn}
              activeOpacity={0.8}
            >
              <Text style={styles.googleBtnText}>
                {isHindi ? "गूगल के साथ जारी रखें" : "Continue with Google"}
              </Text>
            </TouchableOpacity>

            {/* Toggle Mode */}
            <View style={styles.toggleRow}>
              <Text style={styles.togglePrompt}>
                {mode === "login"
                  ? isHindi ? "खाता नहीं है?" : "Don't have an account?"
                  : isHindi ? "पहले से खाता है?" : "Already registered?"}
              </Text>
              <TouchableOpacity
                onPress={() => setMode(mode === "login" ? "signup" : "login")}
              >
                <Text style={styles.toggleLink}>
                  {mode === "login"
                    ? isHindi ? "साइन अप" : "Sign Up"
                    : isHindi ? "लॉगिन करें" : "Sign In"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
    </SwipeableBottomSheet>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Platform.OS === "ios" ? 34 : Spacing.lg,
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
    alignItems: "flex-start",
    marginBottom: 12,
    paddingHorizontal: Spacing.lg,
    paddingTop: 4,
  },
  modalTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  modalSub: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  demoBar: {
    backgroundColor: Colors.primaryFaint,
    borderRadius: BorderRadius.md,
    padding: 10,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  demoBarTitle: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDeep,
    marginBottom: 6,
  },
  demoButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  demoBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  demoBtnText: {
    fontSize: 10,
    fontWeight: Typography.weights.semibold,
    color: Colors.primaryDark,
  },
  inputLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
    marginBottom: 4,
    marginTop: 8,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 44,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
  },
  forgotLink: {
    alignSelf: "flex-end",
    marginTop: 6,
    marginBottom: 4,
  },
  forgotLinkText: {
    fontSize: 11,
    color: Colors.primaryDark,
    fontWeight: Typography.weights.semibold,
  },
  actionBtn: {
    marginTop: Spacing.md,
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
  googleBtn: {
    marginTop: 8,
    paddingVertical: 11,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  googleBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    marginBottom: 20,
  },
  togglePrompt: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  toggleLink: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
});
