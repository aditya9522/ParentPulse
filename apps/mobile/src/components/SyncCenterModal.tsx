import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useApp } from "../context/AppContext";
import { QueuedMutation } from "../services/mutationQueue";
import { Colors, Shadows, Spacing } from "../theme";
import { SwipeableBottomSheet } from "./SwipeableBottomSheet";

const statePresentation = (item: QueuedMutation) => {
  if (item.state === "conflict") return { label: "Needs review", color: "#B54708", soft: "#FFFAEB", icon: "git-compare-outline" as const };
  if (item.state === "blocked") return { label: "Action required", color: "#B42318", soft: "#FEF3F2", icon: "alert-circle-outline" as const };
  if (item.state === "syncing") return { label: "Syncing", color: "#175CD3", soft: "#EFF8FF", icon: "sync-outline" as const };
  return { label: item.attempts > 0 ? "Retry scheduled" : "Waiting to sync", color: "#047857", soft: "#ECFDF5", icon: "cloud-upload-outline" as const };
};

const queuedTime = (value: string) => {
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
};

export const SyncCenterModal: React.FC = () => {
  const {
    syncQueue,
    syncBusy,
    syncCenterVisible,
    setSyncCenterVisible,
    retrySyncMutation,
    discardSyncMutation,
    syncNow,
  } = useApp();
  const attentionCount = syncQueue.filter((item) => item.state === "conflict" || item.state === "blocked").length;

  return (
    <SwipeableBottomSheet
      visible={syncCenterVisible}
      onClose={() => setSyncCenterVisible(false)}
      maxHeight="88%"
      containerStyle={styles.sheet}
      testID="sync-center"
    >
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="cloud-done-outline" size={24} color={Colors.primaryDark} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>SECURE SYNC CENTER</Text>
          <Text style={styles.title}>Your care changes</Text>
          <Text style={styles.subtitle}>
            {attentionCount > 0
              ? `${attentionCount} ${attentionCount === 1 ? "change needs" : "changes need"} your review.`
              : syncQueue.length > 0
                ? "Saved safely on this device and syncing in order."
                : "Everything is synchronized with ParentPulse."}
          </Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={() => setSyncCenterVisible(false)} accessibilityLabel="Close sync center">
          <Ionicons name="close" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.securityNote}>
        <Ionicons name="shield-checkmark-outline" size={17} color={Colors.primaryDark} />
        <Text style={styles.securityText}>Changes are isolated to this signed-in account and replayed with duplicate protection.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {syncQueue.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}><Ionicons name="checkmark" size={28} color="#047857" /></View>
            <Text style={styles.emptyTitle}>All changes are safely synced</Text>
            <Text style={styles.emptyCopy}>You can keep caring with confidence. There are no pending device changes.</Text>
          </View>
        ) : syncQueue.map((item) => {
          const presentation = statePresentation(item);
          const needsAction = item.state === "conflict" || item.state === "blocked";
          return (
            <View key={item.id} style={[styles.item, needsAction && styles.itemAttention]}>
              <View style={styles.itemTopRow}>
                <View style={[styles.stateIcon, { backgroundColor: presentation.soft }]}>
                  <Ionicons name={presentation.icon} size={20} color={presentation.color} />
                </View>
                <View style={styles.itemCopy}>
                  <Text style={styles.itemTitle}>{item.label}</Text>
                  <Text style={[styles.stateLabel, { color: presentation.color }]}>{presentation.label} · {queuedTime(item.createdAt)}</Text>
                </View>
              </View>

              {!!item.lastFailure && (
                <View style={styles.failureBox}>
                  <Text style={styles.failureText}>{item.lastFailure.message}</Text>
                  {!!item.lastFailure.requestId && <Text style={styles.requestId}>Support ID {item.lastFailure.requestId}</Text>}
                </View>
              )}

              {item.state === "conflict" && (
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.secondaryAction} onPress={() => void discardSyncMutation(item.id)}>
                    <Text style={styles.secondaryActionText}>Use server version</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryAction} onPress={() => void retrySyncMutation(item.id, true)}>
                    <Text style={styles.primaryActionText}>Keep my change</Text>
                  </TouchableOpacity>
                </View>
              )}
              {item.state === "blocked" && (
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.secondaryAction} onPress={() => void discardSyncMutation(item.id)}>
                    <Text style={styles.secondaryActionText}>Discard</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryAction} onPress={() => void retrySyncMutation(item.id)}>
                    <Text style={styles.primaryActionText}>Try again</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {syncQueue.length > 0 && (
        <TouchableOpacity disabled={syncBusy} style={[styles.syncButton, syncBusy && styles.disabled]} onPress={() => void syncNow()}>
          {syncBusy ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="sync" size={18} color="#FFFFFF" />}
          <Text style={styles.syncButtonText}>{syncBusy ? "Synchronizing…" : "Sync available changes"}</Text>
        </TouchableOpacity>
      )}
    </SwipeableBottomSheet>
  );
};

const styles = StyleSheet.create({
  sheet: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  header: { flexDirection: "row", alignItems: "flex-start", paddingTop: 2, paddingBottom: 16 },
  headerIcon: { width: 50, height: 50, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "#E8F7F5" },
  headerCopy: { flex: 1, paddingHorizontal: 13 },
  eyebrow: { fontSize: 10, letterSpacing: 1.3, fontWeight: "900", color: Colors.primaryDark },
  title: { marginTop: 3, fontSize: 23, lineHeight: 28, fontWeight: "900", color: Colors.textPrimary },
  subtitle: { marginTop: 4, fontSize: 12, lineHeight: 18, color: Colors.textMuted },
  closeButton: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F5F9" },
  securityNote: { flexDirection: "row", gap: 9, padding: 12, borderRadius: 15, backgroundColor: "#F0FDFA", borderWidth: 1, borderColor: "#CCFBF1" },
  securityText: { flex: 1, color: "#115E59", fontSize: 11, lineHeight: 16, fontWeight: "700" },
  list: { gap: 11, paddingVertical: 14 },
  emptyState: { alignItems: "center", paddingVertical: 34, paddingHorizontal: 20 },
  emptyIcon: { width: 58, height: 58, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "#ECFDF5", marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: "900", color: Colors.textPrimary, textAlign: "center" },
  emptyCopy: { marginTop: 7, color: Colors.textMuted, fontSize: 12, lineHeight: 18, textAlign: "center" },
  item: { padding: 14, borderRadius: 19, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "rgba(255,255,255,0.96)", ...Shadows.subtle },
  itemAttention: { borderColor: "#FED7AA" },
  itemTopRow: { flexDirection: "row", alignItems: "center" },
  stateIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  itemCopy: { flex: 1, paddingLeft: 11 },
  itemTitle: { fontSize: 13, lineHeight: 18, fontWeight: "900", color: Colors.textPrimary },
  stateLabel: { marginTop: 2, fontSize: 10, fontWeight: "800" },
  failureBox: { marginTop: 11, padding: 11, borderRadius: 13, backgroundColor: "#F8FAFC" },
  failureText: { color: Colors.textSecondary, fontSize: 11, lineHeight: 16 },
  requestId: { marginTop: 5, color: Colors.textMuted, fontSize: 9, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 9, marginTop: 12 },
  secondaryAction: { flex: 1, minHeight: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F5F9" },
  secondaryActionText: { color: Colors.textSecondary, fontSize: 11, fontWeight: "800" },
  primaryAction: { flex: 1, minHeight: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: Colors.primaryDark },
  primaryActionText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
  syncButton: { minHeight: 50, borderRadius: 16, flexDirection: "row", gap: 9, alignItems: "center", justifyContent: "center", backgroundColor: Colors.primaryDark },
  syncButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  disabled: { opacity: 0.68 },
});
