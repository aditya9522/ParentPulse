import React, { useState } from "react";
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppAlert as Alert } from "../services/appAlert";
import { ArrowLeft, ArrowRight, BadgeCheck, Lock, Mail, ShieldCheck, User, X } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useApp } from "../context/AppContext";
import { apiClient } from "../api/client";
import { BorderRadius, Colors, Gradients, Spacing, Typography } from "../theme";
import { SwipeableBottomSheet } from "./SwipeableBottomSheet";
import { getFreshGoogleIdToken, isGoogleAuthConfigured } from "../services/googleAuth";

type AuthMode = "login" | "signup" | "forgot";

export const AuthModal: React.FC = () => {
  const { authModalVisible, setAuthModalVisible } = useApp();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loadingAction, setLoadingAction] = useState<"email" | "google" | null>(null);
  const isLoading = loadingAction !== null;

  const submit = async () => {
    if (!email.trim() || (mode !== "forgot" && !password)) {
      Alert.alert("Missing details", "Enter the required account details to continue.");
      return;
    }
    if (mode === "signup" && fullName.trim().length < 2) {
      Alert.alert("Name required", "Enter the account holder’s full name.");
      return;
    }
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoadingAction("email");
    try {
      if (mode === "forgot") {
        await apiClient.requestPasswordReset(email.trim());
        Alert.alert("Check your inbox", "If an account exists, a secure reset link has been sent.");
        setMode("login");
        return;
      }
      const result = mode === "signup"
        ? await apiClient.signUpWithEmail(email.trim(), password, fullName.trim())
        : await apiClient.loginWithEmail(email.trim(), password);
      await apiClient.setSession(result);
      setAuthModalVisible(false);
      Alert.alert(mode === "signup" ? "Account created" : "Welcome back", `Securely signed in as ${email.trim()}.`);
    } catch (error) {
      Alert.alert("Couldn’t continue", error instanceof Error ? error.message : "Check your connection and try again.");
    } finally {
      setLoadingAction(null);
    }
  };

  const continueWithGoogle = async () => {
    if (!isGoogleAuthConfigured) return;
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoadingAction("google");
    try {
      const idToken = await getFreshGoogleIdToken();
      const result = await apiClient.loginWithGoogle(idToken);
      await apiClient.setSession(result);
      setAuthModalVisible(false);
      Alert.alert("Welcome", "Your Google identity was securely verified.");
    } catch (error) {
      Alert.alert("Google sign-in couldn’t continue", error instanceof Error ? error.message : "Try again.");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <SwipeableBottomSheet visible={authModalVisible} onClose={() => setAuthModalVisible(false)} maxHeight="86%">
      <View style={styles.header}>
        {mode === "forgot" ? (
          <TouchableOpacity style={styles.iconButton} onPress={() => setMode("login")} accessibilityLabel="Back to sign in">
            <ArrowLeft size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        ) : <View style={styles.brandIcon}><ShieldCheck size={22} color="#FFFFFF" /></View>}
        <TouchableOpacity style={styles.iconButton} onPress={() => setAuthModalVisible(false)} accessibilityLabel="Close">
          <X size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>PRIVATE FAMILY CARE</Text>
        <Text style={styles.title}>{mode === "login" ? "Welcome back" : mode === "signup" ? "Create your care circle" : "Reset your password"}</Text>
        <Text style={styles.subtitle}>{mode === "forgot" ? "We’ll send a secure recovery link to your verified email." : "Encrypted access to shared medicines, records, appointments, and alerts."}</Text>

        {mode === "signup" && <Field icon={<User size={18} color={Colors.textMuted} />} label="Full name"><TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Your full name" placeholderTextColor={Colors.textMuted} autoComplete="name" /></Field>}
        <Field icon={<Mail size={18} color={Colors.textMuted} />} label="Email address"><TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="name@example.com" placeholderTextColor={Colors.textMuted} keyboardType="email-address" autoCapitalize="none" autoComplete="email" /></Field>
        {mode !== "forgot" && <Field icon={<Lock size={18} color={Colors.textMuted} />} label="Password"><TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="At least 6 characters" placeholderTextColor={Colors.textMuted} secureTextEntry autoComplete={mode === "signup" ? "new-password" : "current-password"} /></Field>}

        {mode === "login" && <TouchableOpacity style={styles.forgotButton} onPress={() => setMode("forgot")}><Text style={styles.forgotText}>Forgot password?</Text></TouchableOpacity>}
        <TouchableOpacity style={styles.primaryButton} onPress={submit} disabled={isLoading} activeOpacity={0.85}>
          <LinearGradient colors={Gradients.primary} style={styles.primaryGradient}>
            {loadingAction === "email" ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.primaryText}>{mode === "login" ? "Sign in securely" : mode === "signup" ? "Create account" : "Send reset link"}</Text><ArrowRight size={18} color="#FFFFFF" /></>}
          </LinearGradient>
        </TouchableOpacity>

        {mode !== "forgot" && isGoogleAuthConfigured && (
          <>
            <View style={styles.dividerRow}><View style={styles.dividerLine} /><Text style={styles.dividerText}>OR</Text><View style={styles.dividerLine} /></View>
            <TouchableOpacity style={styles.googleButton} onPress={() => void continueWithGoogle()} disabled={isLoading} activeOpacity={0.82}>
              {loadingAction === "google" ? <ActivityIndicator color={Colors.secondaryDark} /> : <BadgeCheck size={19} color={Colors.secondaryDark} />}
              <Text style={styles.googleButtonText}>{loadingAction === "google" ? "Verifying with Google…" : "Continue with Google"}</Text>
            </TouchableOpacity>
          </>
        )}

        {mode !== "forgot" && <View style={styles.switchRow}><Text style={styles.switchPrompt}>{mode === "login" ? "New to ParentPulse?" : "Already have an account?"}</Text><TouchableOpacity onPress={() => setMode(mode === "login" ? "signup" : "login")}><Text style={styles.switchAction}>{mode === "login" ? "Create account" : "Sign in"}</Text></TouchableOpacity></View>}
        <View style={styles.securityNote}><ShieldCheck size={16} color={Colors.primaryDark} /><Text style={styles.securityText}>Session keys stay in your device’s secure hardware-backed storage.</Text></View>
      </ScrollView>
    </SwipeableBottomSheet>
  );
};

const Field: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => <View style={styles.fieldGroup}><Text style={styles.label}>{label}</Text><View style={styles.field}>{icon}{children}</View></View>;

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: Spacing.lg, paddingTop: 2 },
  brandIcon: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: Colors.primaryDark },
  iconButton: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.72)", borderWidth: 1, borderColor: Colors.border },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Platform.OS === "ios" ? 38 : 24 },
  eyebrow: { fontSize: 10, letterSpacing: 1.5, fontWeight: Typography.weights.extraBold, color: Colors.primaryDark, marginBottom: 6 },
  title: { fontSize: 29, lineHeight: 34, fontWeight: Typography.weights.extraBold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.sizes.sm, lineHeight: 21, color: Colors.textMuted, marginTop: 8, marginBottom: 18 },
  fieldGroup: { marginTop: 12 },
  label: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: Colors.textSecondary, marginBottom: 7 },
  field: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: "rgba(255,255,255,0.78)" },
  input: { flex: 1, fontSize: Typography.sizes.sm, color: Colors.textPrimary, paddingVertical: 13 },
  forgotButton: { alignSelf: "flex-end", paddingVertical: 10 },
  forgotText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: Colors.primaryDark },
  primaryButton: { borderRadius: BorderRadius.lg, overflow: "hidden", marginTop: 14 },
  primaryGradient: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  primaryText: { color: "#FFFFFF", fontSize: Typography.sizes.sm, fontWeight: Typography.weights.extraBold },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 17 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: Colors.borderStrong },
  dividerText: { color: Colors.textSubtle, fontSize: 9, fontWeight: Typography.weights.extraBold },
  googleButton: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 13, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: "#BAE6FD", backgroundColor: "#FFFFFF" },
  googleButtonText: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 18 },
  switchPrompt: { fontSize: Typography.sizes.xs, color: Colors.textMuted },
  switchAction: { fontSize: Typography.sizes.xs, color: Colors.primaryDark, fontWeight: Typography.weights.extraBold },
  securityNote: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 24, padding: 13, borderRadius: BorderRadius.md, backgroundColor: Colors.primaryFaint, borderWidth: 1, borderColor: Colors.primaryLight },
  securityText: { flex: 1, fontSize: 11, lineHeight: 16, color: Colors.textSecondary },
});
