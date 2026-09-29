const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
const shareBaseUrl = process.env.EXPO_PUBLIC_SHARE_BASE_URL?.trim();
const isProductionBuild = process.env.EAS_BUILD_PROFILE === "production";

const isGoogleClientId = (value) =>
  typeof value === "string" &&
  /^[0-9]+-[a-z0-9-]+\.apps\.googleusercontent\.com$/i.test(value) &&
  !value.toLowerCase().includes("replace_me");

if (isProductionBuild) {
  const missing = [];
  if (!apiUrl) missing.push("EXPO_PUBLIC_API_URL");
  if (!googleWebClientId) missing.push("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID");
  if (!googleIosClientId) missing.push("EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID");
  if (!googleMapsApiKey) missing.push("EXPO_PUBLIC_GOOGLE_MAPS_API_KEY");
  if (!shareBaseUrl) missing.push("EXPO_PUBLIC_SHARE_BASE_URL");
  if (missing.length) {
    throw new Error(
      `Production build configuration is incomplete: ${missing.join(", ")}. ` +
      "Configure these values in the EAS production environment.",
    );
  }
  if (!apiUrl.startsWith("https://")) {
    throw new Error("EXPO_PUBLIC_API_URL must use HTTPS in production builds.");
  }
  if (!shareBaseUrl.startsWith("https://")) {
    throw new Error("EXPO_PUBLIC_SHARE_BASE_URL must use HTTPS in production builds.");
  }
}

if (Boolean(googleWebClientId) !== Boolean(googleIosClientId)) {
  throw new Error(
    "Google authentication requires both EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID and EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID.",
  );
}

if (googleWebClientId && !isGoogleClientId(googleWebClientId)) {
  throw new Error("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not a valid Google OAuth client ID.");
}

if (googleIosClientId && !isGoogleClientId(googleIosClientId)) {
  throw new Error("EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID is not a valid Google OAuth client ID.");
}

const expo = {
  name: "Parent Pulse",
  slug: "parentpulse",
  scheme: "parentpulse",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.parentpulse.app",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    googleServicesFile: "./google-services.json",
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/android-icon-foreground-native.png",
      monochromeImage: "./assets/android-icon-monochrome-native.png",
    },
    predictiveBackGestureEnabled: false,
    package: "com.parentpulse.app",
  },
  web: { favicon: "./assets/favicon.png" },
  plugins: [
    "expo-secure-store",
    ["expo-notifications", { icon: "./assets/notification-icon-android.png", color: "#0D9488", defaultChannel: "care-reminders" }],
    "expo-sharing",
    [
      "expo-speech-recognition",
      {
        microphonePermission: "Allow ParentPulse to use the microphone only while you dictate a health question.",
        speechRecognitionPermission: "Allow ParentPulse to convert your spoken question into text for your review.",
        androidSpeechServicePackages: ["com.google.android.googlequicksearchbox"],
      },
    ],
  ],
  extra: { eas: { projectId: "6a6e447c-14f9-4f77-8e93-eabb445c82aa" } },
  owner: "aditya010p",
};

if (googleWebClientId && googleIosClientId) {
  const iosUrlScheme = `com.googleusercontent.apps.${googleIosClientId.slice(0, -".apps.googleusercontent.com".length)}`;
  expo.plugins.push(
    ["react-native-nitro-google-signin", { iosUrlScheme }],
    ["expo-build-properties", { ios: { enableSceneSupport: true } }],
  );
}

module.exports = { expo };
