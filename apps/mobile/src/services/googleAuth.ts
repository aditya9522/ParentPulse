import { Platform } from "react-native";

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();

export const isGoogleAuthConfigured = Boolean(
  webClientId && iosClientId && Platform.OS !== "web",
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
