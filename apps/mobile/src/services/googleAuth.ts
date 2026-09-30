import { Platform } from "react-native";
import { isExpoGo } from "./runtimeEnvironment";

const DEFAULT_GOOGLE_WEB_CLIENT_ID = "223764189423-hkom0u7r9bln715susj8g2orn1hqcdet.apps.googleusercontent.com";
const DEFAULT_GOOGLE_IOS_CLIENT_ID = "223764189423-n8f4lptdqi3h8crbj4dq2478k4le01a5.apps.googleusercontent.com";

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || DEFAULT_GOOGLE_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || DEFAULT_GOOGLE_IOS_CLIENT_ID;

export const isGoogleAuthConfigured = Boolean(
  webClientId &&
  Platform.OS !== "web" &&
  !isExpoGo,
);

export const getFreshGoogleIdToken = async (): Promise<string> => {
  if (!isGoogleAuthConfigured || !webClientId) {
    throw new Error("Google sign-in is not configured for this build.");
  }

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
  if (!google.isSuccessResponse(result) || !result.data.idToken) {
    throw new Error("Google did not return a verifiable identity token.");
  }
  return result.data.idToken;
};

export const clearGoogleSession = async (): Promise<void> => {
  if (!isGoogleAuthConfigured) return;
  try {
    const google = await import("react-native-nitro-google-signin");
    await google.GoogleOneTapSignIn.signOut();
  } catch {
    // Local Google cleanup must never prevent the ParentPulse session from closing.
  }
};
