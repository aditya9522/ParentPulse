// apps/mobile/src/services/speechRuntime.ts
import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo";
import { isExpoGo } from "./runtimeEnvironment";

type SpeechRecognitionModuleType = typeof import("expo-speech-recognition").ExpoSpeechRecognitionModule;

let cachedModule: SpeechRecognitionModuleType | null = null;

export function isSpeechRecognitionAvailable(): boolean {
  if (Platform.OS === "web" || isExpoGo) return false;
  try {
    const mod = requireOptionalNativeModule<{ start?: unknown }>("ExpoSpeechRecognition");
    return Boolean(mod && typeof mod.start === "function");
  } catch {
    return false;
  }
}

export async function loadSpeechRecognitionModule(): Promise<SpeechRecognitionModuleType | null> {
  if (!isSpeechRecognitionAvailable()) return null;
  if (cachedModule) return cachedModule;
  try {
    const speech = await import("expo-speech-recognition");
    cachedModule = speech.ExpoSpeechRecognitionModule;
    return cachedModule;
  } catch (error) {
    console.warn("Could not load ExpoSpeechRecognition module:", error);
    return null;
  }
}
