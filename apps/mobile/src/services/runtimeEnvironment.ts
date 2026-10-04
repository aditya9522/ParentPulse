import Constants from "expo-constants";

// Safely detect Expo Go without crashing if ExecutionEnvironment enum is unavailable
// in older or different expo-constants builds running on Hermes.
function detectExpoGo(): boolean {
  try {
    // executionEnvironment is "storeClient" in Expo Go, "bare" in bare workflow/EAS
    const env: string | undefined = (Constants as any).executionEnvironment;
    if (typeof env === "string") {
      return env === "storeClient";
    }
    // Legacy: appOwnership === "expo" means Expo Go
    const ownership: string | undefined = (Constants as any).appOwnership;
    if (typeof ownership === "string") {
      return ownership === "expo";
    }
    return false;
  } catch {
    return false;
  }
}

export const isExpoGo = detectExpoGo();
