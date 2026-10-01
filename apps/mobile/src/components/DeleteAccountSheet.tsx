import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AlertTriangle, BadgeCheck, LockKeyhole, Trash2 } from "lucide-react-native";

import { apiClient, AuthMethod, DeletionImpact } from "../api/client";
import { AppAlert } from "../services/appAlert";
import { getFreshGoogleIdToken, isGoogleAuthConfigured } from "../services/googleAuth";
import { BorderRadius, Colors, Shadows, Spacing, Typography, createThemedStyles } from "../theme";
import { SwipeableBottomSheet } from "./SwipeableBottomSheet";

interface DeleteAccountSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const DeleteAccountSheet: React.FC<DeleteAccountSheetProps> = ({ visible, onClose }) => {
  const [impact, setImpact] = useState<DeletionImpact | null>(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [authMethods, setAuthMethods] = useState<AuthMethod[]>([]);
  const [authMethod, setAuthMethod] = useState<AuthMethod>("password");

  const closeSheet = () => {
    setPassword("");
    setConfirmation("");
    setImpact(null);
    setAuthMethods([]);
    onClose();
  };

  useEffect(() => {
    if (!visible) return;
    let active = true;
    const loadImpact = async () => {
      setLoading(true);
      try {
        const [impactResult, methods] = await Promise.all([
          apiClient.getDeletionImpact(),
          apiClient.getAuthMethods(),
        ]);
        if (active) {
          setImpact(impactResult);
          setAuthMethods(methods);
          setAuthMethod(methods.includes("password") ? "password" : (methods[0] ?? "password"));
        }
      } catch {
        if (active) {
          AppAlert.alert("Could not review account impact", "Check your connection and try again before deleting your account.");
          onClose();
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadImpact();
    return () => { active = false; };
  }, [onClose, visible]);

  const canDelete = Boolean(
    impact &&
    confirmation.trim() === impact.confirmation_phrase &&
    (authMethod === "google" ? isGoogleAuthConfigured : password) &&
    !deleting
  );

  const handleDelete = async () => {
    if (!impact || !canDelete) return;
    setDeleting(true);
    try {
      if (authMethod === "google") {
        const googleIdToken = await getFreshGoogleIdToken();
        await apiClient.deleteAccount({
          credential_type: "google",
          google_id_token: googleIdToken,
          confirmation: confirmation.trim(),
        });
      } else {
        await apiClient.deleteAccount({
          credential_type: "password",
          password,
          confirmation: confirmation.trim(),
        });
      }
      await apiClient.signOut();
    } catch (error) {
      AppAlert.alert(
        "Account deletion failed",
        error instanceof Error ? error.message : "Your account was not deleted. Please try again.",
      );
      setDeleting(false);
    }
  };

  return (
    <SwipeableBottomSheet visible={visible} onClose={closeSheet} maxHeight="94%" grabHandleColor={Colors.emergency}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.iconWrap}>
            <Trash2 size={24} color={Colors.emergencyDark} />
          </View>
          <Text style={styles.title}>Permanently delete account</Text>
          <Text style={styles.subtitle}>
            This action removes your access, private preferences, device registrations, and every care circle you own.
          </Text>

          {loading || !impact ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={Colors.emergency} />
              <Text style={styles.loadingText}>Reviewing securely linked records…</Text>
            </View>
          ) : (
            <>
              <View style={[styles.impactCard, Shadows.subtle]}>
                <View style={styles.impactHeader}>
                  <AlertTriangle size={18} color={Colors.warningDark} />
                  <Text style={styles.impactTitle}>Deletion impact</Text>
                </View>
                <Text style={styles.impactLine}>{impact.owned_care_circles} owned care circles</Text>
                <Text style={styles.impactLine}>{impact.parent_profiles_removed} parent profiles</Text>
                <Text style={styles.impactLine}>{impact.medical_documents_removed} medical document records</Text>
                {impact.shared_care_circles > 0 && (
                  <Text style={styles.retentionNote}>
                    Records in {impact.shared_care_circles} shared circles remain with those families; your membership and personal identity are removed.
                  </Text>
                )}
              </View>

              {authMethods.length > 1 && (
                <View style={styles.methodRow}>
                  {authMethods.map((method) => (
                    <TouchableOpacity
                      key={method}
                      style={[styles.methodChip, authMethod === method && styles.methodChipActive]}
                      onPress={() => setAuthMethod(method)}
                    >
                      <Text style={[styles.methodChipText, authMethod === method && styles.methodChipTextActive]}>
                        {method === "google" ? "Google account" : "Password"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {authMethod === "password" ? (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Current password</Text>
                  <View style={styles.inputWrap}>
                    <LockKeyhole size={17} color={Colors.textMuted} />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder="Verify it’s you"
                      placeholderTextColor={Colors.textSubtle}
                      style={styles.input}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.googleVerificationCard}>
                  <BadgeCheck size={20} color={Colors.secondaryDark} />
                  <View style={styles.googleVerificationText}>
                    <Text style={styles.label}>Google verification required</Text>
                    <Text style={styles.verificationNote}>
                      {isGoogleAuthConfigured
                        ? "Google will ask you to choose the account linked to ParentPulse when you delete."
                        : "Google verification is not configured in this build. Install a credential-enabled development or store build."}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Type this exact phrase to continue</Text>
                <Text style={styles.phrase}>{impact.confirmation_phrase}</Text>
                <TextInput
                  value={confirmation}
                  onChangeText={setConfirmation}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  placeholder="Confirmation phrase"
                  placeholderTextColor={Colors.textSubtle}
                  style={[styles.inputWrap, styles.confirmInput]}
                />
              </View>

              <TouchableOpacity
                style={[styles.deleteButton, !canDelete && styles.deleteButtonDisabled]}
                disabled={!canDelete}
                onPress={() => void handleDelete()}
                activeOpacity={0.82}
              >
                {deleting ? <ActivityIndicator color="#FFFFFF" /> : <Trash2 size={18} color="#FFFFFF" />}
                <Text style={styles.deleteButtonText}>
                  {deleting ? "Verifying and deleting…" : authMethod === "google" ? "Verify with Google and delete" : "Delete my account"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={closeSheet} disabled={deleting}>
                <Text style={styles.cancelText}>Keep my account</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SwipeableBottomSheet>
  );
};

const styles = createThemedStyles({
  content: { paddingHorizontal: Spacing.xl, paddingBottom: 34, alignItems: "stretch" },
  iconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: Colors.emergencyLight, alignItems: "center", justifyContent: "center", alignSelf: "center", marginTop: 4 },
  title: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.extraBold, color: Colors.textPrimary, textAlign: "center", marginTop: 12 },
  subtitle: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, lineHeight: 20, textAlign: "center", marginTop: 7 },
  loadingWrap: { minHeight: 180, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { color: Colors.textMuted, fontSize: Typography.sizes.sm },
  impactCard: { backgroundColor: "#FFFBEB", borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: "#FDE68A", padding: Spacing.lg, marginTop: Spacing.xl },
  impactHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  impactTitle: { color: "#92400E", fontWeight: Typography.weights.bold, fontSize: Typography.sizes.md },
  impactLine: { color: "#78350F", fontSize: Typography.sizes.sm, lineHeight: 22 },
  retentionNote: { color: "#92400E", fontSize: Typography.sizes.xs, lineHeight: 18, marginTop: 8 },
  fieldGroup: { marginTop: Spacing.xl },
  methodRow: { flexDirection: "row", gap: 8, marginTop: Spacing.xl },
  methodChip: { flex: 1, minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border },
  methodChipActive: { backgroundColor: Colors.primaryFaint, borderColor: Colors.primary },
  methodChipText: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold },
  methodChipTextActive: { color: Colors.primaryDark },
  googleVerificationCard: { flexDirection: "row", alignItems: "flex-start", gap: 11, marginTop: Spacing.xl, padding: Spacing.lg, borderRadius: BorderRadius.lg, backgroundColor: Colors.secondaryLight, borderWidth: 1, borderColor: "#BAE6FD" },
  googleVerificationText: { flex: 1 },
  verificationNote: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, lineHeight: 18 },
  label: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, marginBottom: 8 },
  phrase: { color: Colors.emergencyDark, fontSize: Typography.sizes.xs, fontWeight: Typography.weights.extraBold, letterSpacing: 0.5, marginBottom: 8 },
  inputWrap: { minHeight: 52, borderWidth: 1.2, borderColor: Colors.borderStrong, borderRadius: BorderRadius.md, backgroundColor: "rgba(255,255,255,0.9)", flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.md, gap: 9 },
  input: { flex: 1, color: Colors.textPrimary, fontSize: Typography.sizes.md, paddingVertical: 12 },
  confirmInput: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, paddingHorizontal: Spacing.md },
  deleteButton: { minHeight: 54, borderRadius: BorderRadius.md, backgroundColor: Colors.emergencyDark, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, marginTop: Spacing.xxl },
  deleteButtonDisabled: { opacity: 0.42 },
  deleteButtonText: { color: "#FFFFFF", fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold },
  cancelButton: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 6 },
  cancelText: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
});
