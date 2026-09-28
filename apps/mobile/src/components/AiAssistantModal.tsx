// apps/mobile/src/components/AiAssistantModal.tsx
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Crypto from "expo-crypto";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  Sparkles,
  Send,
  Bot,
  FileCheck2,
  ShieldCheck,
  X,
  Lightbulb,
  Mic,
  Radio,
} from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { Colors, Spacing, Shadows } from "../theme";
import { apiClient } from "../api/client";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  citations?: string[];
}

export const AiAssistantModal: React.FC = () => {
  const {
    activeParent,
    aiAssistantModalVisible,
    setAiAssistantModalVisible,
    seniorMode,
    language,
  } = useApp();

  const isHindi = language === "hi";

  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m_0",
      sender: "ai",
      text: isHindi
        ? `à¤¨à¤®à¤¸à¥à¤¤à¥‡! à¤®à¥ˆà¤‚ à¤ªà¥ˆà¤°à¥‡à¤‚à¤Ÿà¤ªà¤²à¥à¤¸ AI à¤¸à¤¹à¤¾à¤¯à¤• à¤¹à¥‚à¤à¥¤ à¤®à¥ˆà¤‚ ${activeParent.full_name} à¤•à¥‡ à¤®à¥‡à¤¡à¤¿à¤•à¤² à¤°à¤¿à¤•à¥‰à¤°à¥à¤¡, à¤¦à¤µà¤¾à¤“à¤‚ à¤”à¤° à¤œà¤¾à¤‚à¤š à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿà¥‹à¤‚ à¤ªà¤° à¤†à¤§à¤¾à¤°à¤¿à¤¤ à¤ªà¥à¤°à¤¶à¥à¤¨à¥‹à¤‚ à¤•à¥‡ à¤‰à¤¤à¥à¤¤à¤° à¤¦à¥‡ à¤¸à¤•à¤¤à¤¾ à¤¹à¥‚à¤à¥¤`
        : `Hello! I am ParentPulse AI. I can answer questions grounded in ${activeParent.full_name}'s medical records, medicines, and consultation history.`,
    },
  ]);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(style);
      }
    } catch {
      // Graceful fallback
    }
  };

  const startVoiceRecording = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    setIsRecording(true);
  };

  const stopVoiceRecording = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setIsRecording(false);

    const spokenQuery = isHindi
      ? `${activeParent.full_name.split(" ")[0]} à¤•à¥€ à¤¸à¥à¤¬à¤¹ à¤•à¥€ à¤¦à¤µà¤¾à¤à¤‚ à¤•à¥Œà¤¨ à¤¸à¥€ à¤¹à¥ˆà¤‚?`
      : `What medicines does ${activeParent.full_name.split(" ")[0]} take in morning?`;
    handleSend(spokenQuery);
  };

  const quickQuestions = isHindi
    ? [
        `${activeParent.full_name.split(" ")[0]} à¤¸à¥à¤¬à¤¹ à¤•à¥Œà¤¨ à¤¸à¥€ à¤¦à¤µà¤¾à¤à¤‚ à¤²à¥‡à¤¤à¥‡ à¤¹à¥ˆà¤‚?`,
        `à¤¨à¤µà¥€à¤¨à¤¤à¤® à¤¬à¥à¤²à¤¡ à¤¶à¥à¤—à¤° à¤Ÿà¥‡à¤¸à¥à¤Ÿ à¤ªà¤°à¤¿à¤£à¤¾à¤® à¤¦à¤¿à¤–à¤¾à¤à¤‚à¥¤`,
        `à¤…à¤—à¤²à¤¾ à¤¡à¥‰à¤•à¥à¤Ÿà¤° à¤ªà¤°à¤¾à¤®à¤°à¥à¤¶ à¤•à¤¬ à¤¹à¥ˆ?`,
      ]
    : [
        `What medicines does ${activeParent.full_name.split(" ")[0]} take in morning?`,
        `Show latest blood test results.`,
        `When is the next cardiology appointment?`,
      ];

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim()) return;

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const userMsg: Message = { id: Crypto.randomUUID(), sender: "user", text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const res = await apiClient.askAiAssistant(activeParent.id, q);
      const aiMsg: Message = {
        id: Crypto.randomUUID(),
        sender: "ai",
        text: res.answer,
        citations: res.citations?.map((c) => c.title),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Crypto.randomUUID(),
          sender: "ai",
          text: error instanceof Error
            ? `I could not access the live health service: ${error.message}`
            : "I could not access the live health service. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const insets = useSafeAreaInsets();
  const topPadding = Platform.select({
    web: 12,
    ios: Math.max(insets.top, 16),
    android: (StatusBar.currentHeight || insets.top || 16) + 4,
    default: 12,
  });

  return (
    <Modal
      visible={aiAssistantModalVisible}
      animationType="slide"
      transparent={false}
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
      navigationBarTranslucent={true}
      hardwareAccelerated={true}
      onRequestClose={() => setAiAssistantModalVisible(false)}
    >
      <View style={[styles.fullScreenContainer, { paddingTop: topPadding, paddingBottom: insets.bottom }]}>
        <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
        {/* Top Gradient Header */}
        <LinearGradient
          colors={["#4F46E5", "#7C3AED"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.topBar}
        >
          <View style={styles.headerInfo}>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic();
                setAiAssistantModalVisible(false);
              }}
              style={styles.backBtn}
              activeOpacity={0.8}
              accessibilityLabel="Back"
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.sparkleCircle}>
              <Sparkles size={18} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>
                {isHindi ? "à¤ªà¥ˆà¤°à¥‡à¤‚à¤Ÿà¤ªà¤²à¥à¤¸ AI à¤¸à¤¹à¤¾à¤¯à¤•" : "ParentPulse AI Assistant"}
              </Text>
              <Text style={styles.headerSub}>
                {isHindi
                  ? `${activeParent.full_name} à¤•à¥‡ à¤°à¤¿à¤•à¥‰à¤°à¥à¤¡à¥à¤¸ à¤ªà¤° à¤†à¤§à¤¾à¤°à¤¿à¤¤`
                  : `Grounded in ${activeParent.full_name}'s Records`}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic();
              setAiAssistantModalVisible(false);
            }}
            style={styles.closeBtn}
            activeOpacity={0.8}
            accessibilityLabel="Close"
          >
            <X size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </LinearGradient>

        {/* Clinical Safety Disclaimer */}
        <View style={styles.disclaimerBar}>
          <ShieldCheck size={14} color="#1E40AF" style={{ marginTop: 1 }} />
          <Text style={styles.disclaimerText}>
            {isHindi
              ? "à¤ªà¥ˆà¤°à¥‡à¤‚à¤Ÿà¤ªà¤²à¥à¤¸ AI à¤•à¥‡à¤µà¤² à¤ªà¤¾à¤°à¤¿à¤µà¤¾à¤°à¤¿à¤• à¤¸à¥à¤µà¤¾à¤¸à¥à¤¥à¥à¤¯ à¤°à¤¿à¤•à¥‰à¤°à¥à¤¡ à¤•à¤¾ à¤¸à¤¾à¤°à¤¾à¤‚à¤¶ à¤ªà¥à¤°à¤¸à¥à¤¤à¥à¤¤ à¤•à¤°à¤¤à¤¾ à¤¹à¥ˆà¥¤ à¤¯à¤¹ à¤šà¤¿à¤•à¤¿à¤¤à¥à¤¸à¥€à¤¯ à¤¸à¤²à¤¾à¤¹ à¤¯à¤¾ à¤¦à¤µà¤¾ à¤•à¤¾ à¤µà¤¿à¤•à¤²à¥à¤ª à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤"
              : "ParentPulse AI summarizes verified family medical records. It does not replace professional clinical diagnosis or prescribe treatment."}
          </Text>
        </View>

        {/* Chat Thread and Input in KeyboardAvoidingView */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
          {/* Message Thread */}
          <ScrollView contentContainerStyle={styles.chatArea} showsVerticalScrollIndicator={false}>
          {messages.map((m) => (
            <View
              key={m.id}
              style={[
                styles.bubbleWrapper,
                m.sender === "user" ? styles.wrapperUser : styles.wrapperAi,
              ]}
            >
              {m.sender === "ai" && (
                <View style={styles.senderAvatar}>
                  <Bot size={15} color="#7C3AED" />
                </View>
              )}
              <View
                style={[
                  styles.bubble,
                  m.sender === "user" ? styles.bubbleUser : styles.bubbleAi,
                  seniorMode && styles.seniorBubble,
                ]}
              >
                <Text
                  style={[
                    styles.msgText,
                    m.sender === "user" ? styles.msgTextUser : styles.msgTextAi,
                    seniorMode && styles.seniorMsgText,
                  ]}
                >
                  {m.text}
                </Text>
                {m.citations && m.citations.length > 0 && (
                  <View style={styles.citationBox}>
                    <Text style={styles.citationLabel}>
                      {isHindi ? "à¤¸à¤¤à¥à¤¯à¤¾à¤ªà¤¿à¤¤ à¤¸à¥à¤°à¥‹à¤¤:" : "Grounded Medical Sources:"}
                    </Text>
                    <View style={styles.citationList}>
                      {m.citations.map((c, idx) => (
                        <View key={idx} style={styles.citationChip}>
                          <FileCheck2 size={11} color={Colors.primaryDark} />
                          <Text style={styles.citationItem}>{c}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
          ))}
          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#7C3AED" size="small" />
              <Text style={styles.loadingText}>
                {isHindi
                  ? "à¤¸à¤¤à¥à¤¯à¤¾à¤ªà¤¿à¤¤ à¤®à¥‡à¤¡à¤¿à¤•à¤² à¤°à¤¿à¤•à¥‰à¤°à¥à¤¡à¥à¤¸ à¤•à¤¾ à¤µà¤¿à¤¶à¥à¤²à¥‡à¤·à¤£ à¤•à¤¿à¤¯à¤¾ à¤œà¤¾ à¤°à¤¹à¤¾ à¤¹à¥ˆ..."
                  : "Retrieving verified records via Gemini..."}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Suggested Quick Prompt Chips */}
        <View style={styles.quickPromptContainer}>
          <View style={styles.quickPromptHeader}>
            <Lightbulb size={13} color="#7C3AED" />
            <Text style={styles.quickPromptTitle}>
              {isHindi ? "à¤¸à¥à¤à¤¾à¤ à¤—à¤ à¤ªà¥à¤°à¤¶à¥à¤¨" : "Suggested Prompts"}
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {quickQuestions.map((q, i) => (
              <TouchableOpacity
                key={i}
                style={styles.promptChip}
                onPress={() => handleSend(q)}
                activeOpacity={0.8}
              >
                <Text style={styles.promptText}>â€œ{q}â€</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Live Listening Banner if recording */}
        {isRecording && (
          <View style={styles.listeningBanner}>
            <View style={styles.recordingPulseDot} />
            <Text style={styles.listeningText}>
              {isHindi ? "à¤¸à¥à¤¨ à¤°à¤¹à¤¾ à¤¹à¥‚à¤... à¤¬à¥‹à¤²à¤¨à¥‡ à¤•à¥‡ à¤¬à¤¾à¤¦ à¤®à¤¾à¤‡à¤• à¤¦à¥‹à¤¬à¤¾à¤°à¤¾ à¤¦à¤¬à¤¾à¤à¤‚" : "Listening to question... Tap mic when finished"}
            </Text>
          </View>
        )}

        {/* Input Bar with Mic and Send Buttons */}
        <View style={styles.inputBar}>
          {/* Real Microphone Voice Button */}
          {false && (
          <TouchableOpacity
            style={[styles.micBtn, isRecording && styles.micBtnActive]}
            onPress={isRecording ? stopVoiceRecording : startVoiceRecording}
            activeOpacity={0.8}
          >
            {isRecording ? (
              <Radio size={18} color="#FFFFFF" />
            ) : (
              <Mic size={18} color={Colors.primaryDark} />
            )}
          </TouchableOpacity>
          )}

          <TextInput
            style={[styles.input, seniorMode && styles.seniorInput]}
            placeholder={
              isRecording
                ? (isHindi ? "à¤¬à¥‹à¤²à¤¿à¤..." : "Listening...")
                : (isHindi
                    ? `${activeParent.full_name.split(" ")[0]} à¤•à¥‡ à¤¬à¤¾à¤°à¥‡ à¤®à¥‡à¤‚ à¤ªà¥‚à¤›à¥‡à¤‚ à¤¯à¤¾ à¤¬à¥‹à¤²à¥‡à¤‚...`
                    : `Ask about ${activeParent.full_name.split(" ")[0]}'s records...`)
            }
            placeholderTextColor={isRecording ? "#EF4444" : Colors.textMuted}
            value={inputQuery}
            onChangeText={setInputQuery}
            onSubmitEditing={() => handleSend()}
          />

          <TouchableOpacity
            style={[styles.sendBtn, !inputQuery.trim() && styles.sendBtnDisabled]}
            disabled={!inputQuery.trim() || loading}
            onPress={() => handleSend()}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={inputQuery.trim() ? ["#4F46E5", "#7C3AED"] : ["#CBD5E1", "#94A3B8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sendGradient}
            >
              <Send size={16} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sparkleCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  disclaimerBar: {
    flexDirection: "row",
    backgroundColor: "rgba(239, 246, 255, 0.88)",
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#DBEAFE",
    gap: 6,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: "#1E40AF",
    lineHeight: 15,
  },
  chatArea: {
    padding: Spacing.lg,
    paddingBottom: 20,
  },
  bubbleWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  wrapperUser: {
    justifyContent: "flex-end",
  },
  wrapperAi: {
    justifyContent: "flex-start",
  },
  senderAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginTop: 4,
  },
  bubble: {
    padding: Spacing.md,
    borderRadius: 18,
    maxWidth: "85%",
  },
  seniorBubble: {
    padding: Spacing.lg,
  },
  bubbleUser: {
    backgroundColor: "#4F46E5",
    borderBottomRightRadius: 4,
  },
  bubbleAi: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.95)",
    ...Shadows.card,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 21,
  },
  seniorMsgText: {
    fontSize: 17,
    lineHeight: 25,
  },
  msgTextUser: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  msgTextAi: {
    color: Colors.textPrimary,
  },
  citationBox: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  citationLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.textMuted,
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  citationList: {
    gap: 4,
  },
  citationChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  citationItem: {
    fontSize: 11,
    color: Colors.primaryDark,
    fontWeight: "700",
  },
  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: Spacing.md,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#E9D5FF",
  },
  loadingText: {
    fontSize: 12,
    color: "#7C3AED",
    fontWeight: "600",
  },
  quickPromptContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  quickPromptHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  quickPromptTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#7C3AED",
  },
  promptChip: {
    backgroundColor: "rgba(245, 243, 255, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(221, 214, 254, 0.85)",
  },
  promptText: {
    fontSize: 12,
    color: "#6D28D9",
    fontWeight: "600",
  },
  inputBar: {
    flexDirection: "row",
    padding: Spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderTopWidth: 1,
    borderTopColor: "rgba(226, 232, 240, 0.8)",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(241, 245, 249, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.85)",
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  seniorInput: {
    fontSize: 16,
    paddingVertical: 12,
  },
  sendBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  sendGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(240, 253, 250, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(204, 251, 241, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  micBtnActive: {
    backgroundColor: "#EF4444",
    borderColor: "#DC2626",
    ...Shadows.glowTeal,
  },
  listeningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#FECACA",
    gap: 8,
  },
  recordingPulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
  },
  listeningText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
  },
});

