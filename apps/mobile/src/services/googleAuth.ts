import { Platform } from "react-native";
import { isExpoGo } from "./runtimeEnvironment";

const DEFAULT_GOOGLE_WEB_CLIENT_ID = "223764189423-hkom0u7r9bln715susj8g2orn1hqcdet.apps.googleusercontent.com";
const DEFAULT_GOOGLE_IOS_CLIENT_ID = "223764189423-n8f4lptdqi3h8crbj4dq2478k4le01a5.apps.googleusercontent.com";

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || DEFAULT_GOOGLE_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || DEFAULT_GOOGLE_IOS_CLIENT_ID;

export const isGoogleAuthConfigured = Boolean(webClientId && iosClientId);

export const getFreshGoogleIdToken = async (): Promise<string> => {
  if (!isGoogleAuthConfigured) {
    throw new Error("Google Sign-In is not configured for this build. Add valid Google OAuth client IDs to the app environment.");
  }

  if (!isExpoGo && Platform.OS !== "web") {
    try {
      const google = await import("react-native-nitro-google-signin");
      google.GoogleOneTapSignIn.configure({
        webClientId,
        iosClientId: iosClientId || undefined,
        scopes: [
          "https://www.googleapis.com/auth/userinfo.email",
          "https://www.googleapis.com/auth/userinfo.profile",
        ],
        autoSelectOnSignIn: false,
      });
      await google.GoogleOneTapSignIn.checkPlayServices(true);
      const result = await google.GoogleOneTapSignIn.presentExplicitSignIn();
      if (google.isCancelledResponse(result)) {
        throw new Error("Google verification was cancelled.");
      }
      if (google.isSuccessResponse(result) && result.data?.idToken) {
        return result.data.idToken;
      }
      throw new Error("Google Sign-In did not return an ID token.");
    } catch (err: any) {
      if (err?.message?.includes("cancelled")) {
        throw err;
      }
      const message = err?.message || "Google Sign-In is unavailable in this environment.";
      console.warn("Native Google Sign-In failed:", message);
      throw new Error(`Google Sign-In could not continue: ${message}`);
    }
  }

  throw new Error("Google Sign-In is only available in a configured native build. Use a production or development build with valid Google OAuth configuration.");
};

export const clearGoogleSession = async (): Promise<void> => {
  if (!isExpoGo && Platform.OS !== "web") {
    try {
      const google = await import("react-native-nitro-google-signin");
      await google.GoogleOneTapSignIn.signOut();
    } catch {
      // Local Google cleanup must never prevent the ParentPulse session from closing.
    }
  }
};
