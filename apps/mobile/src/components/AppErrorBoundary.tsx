import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BorderRadius, Colors, Spacing, Typography, createThemedStyles } from "../theme";

interface Props {
  children: React.ReactNode;
  onRetry: () => void;
}

interface State {
  error: Error | null;
}

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ParentPulse render failure", error, info.componentStack);
  }

  private retry = () => {
    this.setState({ error: null });
    this.props.onRetry();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.screen}>
        <View style={styles.icon}><Ionicons name="pulse" size={30} color="#FFFFFF" /></View>
        <Text style={styles.eyebrow}>SECURE RECOVERY</Text>
        <Text style={styles.title}>ParentPulse needs a quick restart</Text>
        <Text style={styles.copy}>Your account and saved care data are safe. Retry the app session to reconnect.</Text>
        {__DEV__ && <Text style={styles.debug} numberOfLines={4}>{this.state.error.message}</Text>}
        <TouchableOpacity style={styles.button} onPress={this.retry}>
          <Ionicons name="refresh" size={18} color="#FFFFFF" />
          <Text style={styles.buttonText}>Retry securely</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = createThemedStyles({
  screen: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl, backgroundColor: "#F4FBFA" },
  icon: { width: 64, height: 64, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: Colors.primaryDark },
  eyebrow: { marginTop: 20, color: Colors.primaryDark, fontSize: 9, fontWeight: Typography.weights.extraBold, letterSpacing: 1.5 },
  title: { marginTop: 8, maxWidth: 320, textAlign: "center", color: Colors.textPrimary, fontSize: 25, lineHeight: 31, fontWeight: Typography.weights.extraBold },
  copy: { marginTop: 10, maxWidth: 330, textAlign: "center", color: Colors.textMuted, fontSize: 12.5, lineHeight: 19 },
  debug: { marginTop: 14, maxWidth: 350, color: Colors.emergencyDark, fontSize: 10, textAlign: "center" },
  button: { marginTop: 22, minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 24, borderRadius: BorderRadius.lg, backgroundColor: Colors.primaryDark },
  buttonText: { color: "#FFFFFF", fontSize: 13, fontWeight: Typography.weights.extraBold },
});
