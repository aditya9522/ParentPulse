import { Platform, Vibration } from "react-native";
import * as Haptics from "expo-haptics";
import { getNotifications } from "./notificationRuntime";

export interface VitalCriticality {
  isCritical: boolean;
  isWarning: boolean;
  title: string;
  detail: string;
}

let webAudioCtx: any = null;

function getWebAudioContext(): any {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  if (!webAudioCtx) {
    const AudioContextClass =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      webAudioCtx = new AudioContextClass();
    }
  }
  if (webAudioCtx && webAudioCtx.state === "suspended") {
    void webAudioCtx.resume();
  }
  return webAudioCtx;
}

function playSynthesizedTone(
  frequencies: number[],
  durationMs: number = 200,
  intervalMs: number = 100,
  type: OscillatorType = "sine",
  gainLevel: number = 0.25
) {
  try {
    const ctx = getWebAudioContext();
    if (!ctx) return;

    let startTime = ctx.currentTime;
    frequencies.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(gainLevel, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + durationMs / 1000);

      startTime += (durationMs + intervalMs) / 1000;
    });
  } catch {
    // Audio synthesis not available or blocked by autoplay policy
  }
}

let channelsConfigured = false;
async function configureCriticalChannels() {
  if (channelsConfigured || Platform.OS !== "android") return;
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return;

    await Notifications.setNotificationChannelAsync("critical-emergency-alerts", {
      name: "Critical Emergency SOS Alerts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500, 200, 500],
      lightColor: "#EF4444",
      sound: "default",
      enableLights: true,
      enableVibrate: true,
      bypassDnd: true,
    });

    await Notifications.setNotificationChannelAsync("critical-vital-alerts", {
      name: "Critical Vital Health Alerts",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 300, 150, 300],
      lightColor: "#F59E0B",
      sound: "default",
      enableLights: true,
      enableVibrate: true,
    });

    channelsConfigured = true;
  } catch {
    // Channel configuration error fallback
  }
}

/**
 * Triggers an authentic emergency SOS audio and sensory alert.
 * Uses high-priority Android alarm channel with sound, vibration patterns, and haptic warnings.
 */
export async function playEmergencySosAlert(parentName?: string) {
  // 1. Sensory Haptics & Vibration
  if (Platform.OS !== "web") {
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // SOS rhythm vibration: 3 short, 3 long, 3 short
      Vibration.vibrate([0, 250, 100, 250, 100, 250, 200, 550, 150, 550, 150, 550, 200, 250, 100, 250]);
    } catch {
      // Fallback
    }
  }

  // 2. Synthesized Alarm Tone for Web / In-App
  playSynthesizedTone([880, 660, 880, 660, 880], 180, 60, "sawtooth", 0.3);

  // 3. Native Audible Emergency Notification
  try {
    await configureCriticalChannels();
    const Notifications = await getNotifications();
    if (Notifications) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🚨 EMERGENCY SOS ACTIVATED",
          body: `Emergency broadcast initiated for ${parentName || "family member"}. Immediate medical assistance requested.`,
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 500, 200, 500, 200, 500],
        },
        trigger: {
          channelId: "critical-emergency-alerts",
        } as any,
      });
    }
  } catch {
    // Handled gracefully
  }
}

/**
 * Triggers an audible critical vital sign alert when physiological metrics enter danger zones.
 */
export async function playCriticalVitalAlert(
  vitalLabel: string,
  valueStr: string,
  alertMessage: string
) {
  // 1. Sensory feedback
  if (Platform.OS !== "web") {
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Vibration.vibrate([0, 350, 150, 350]);
    } catch {
      // Fallback
    }
  }

  // 2. Tri-tone medical alert chime (IEC 60601-1-8 standard: C5, E5, G5)
  playSynthesizedTone([523, 659, 784], 220, 70, "sine", 0.25);

  // 3. High-priority notification
  try {
    await configureCriticalChannels();
    const Notifications = await getNotifications();
    if (Notifications) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⚠️ Critical Vital Alert: ${vitalLabel}`,
          body: `${vitalLabel} reading (${valueStr}) is out of safe range: ${alertMessage}`,
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          channelId: "critical-vital-alerts",
        } as any,
      });
    }
  } catch {
    // Handled gracefully
  }
}

/**
 * Evaluates whether a recorded vital measurement is in a critical or warning medical zone.
 */
export function evaluateVitalCriticality(
  vitalType: string,
  primaryValue: number,
  secondaryValue?: number | null
): VitalCriticality {
  const norm = vitalType.toLowerCase().replace(/\s+/g, "_");

  // Blood Pressure (Systolic / Diastolic)
  if (norm.includes("blood_pressure") || norm === "bp") {
    const systolic = primaryValue;
    const diastolic = secondaryValue ?? 80;
    if (systolic >= 180 || diastolic >= 120) {
      return {
        isCritical: true,
        isWarning: false,
        title: "Hypertensive Crisis",
        detail: "Systolic >= 180 or Diastolic >= 120 mmHg. High risk of stroke or cardiac event. Seek immediate medical attention.",
      };
    }
    if (systolic <= 85 || diastolic <= 50) {
      return {
        isCritical: true,
        isWarning: false,
        title: "Severe Hypotension",
        detail: "Blood pressure is dangerously low (< 85/50 mmHg). Risk of fainting, dizziness, or shock.",
      };
    }
    if (systolic >= 140 || diastolic >= 90) {
      return {
        isCritical: false,
        isWarning: true,
        title: "Stage 2 Hypertension",
        detail: "Blood pressure is elevated above standard target range. Monitor closely and notify attending physician.",
      };
    }
  }

  // Blood Glucose (mg/dL)
  if (norm.includes("sugar") || norm.includes("glucose")) {
    if (primaryValue <= 55) {
      return {
        isCritical: true,
        isWarning: false,
        title: "Severe Hypoglycemia",
        detail: "Blood glucose <= 55 mg/dL. Immediate fast-acting carbohydrates (juice/glucose) needed to prevent loss of consciousness.",
      };
    }
    if (primaryValue >= 320) {
      return {
        isCritical: true,
        isWarning: false,
        title: "Severe Hyperglycemia",
        detail: "Blood glucose >= 320 mg/dL. Risk of diabetic ketoacidosis or hyperosmolar state. Contact doctor urgently.",
      };
    }
    if (primaryValue <= 70 || primaryValue >= 220) {
      return {
        isCritical: false,
        isWarning: true,
        title: "Abnormal Blood Glucose",
        detail: "Reading is outside recommended glycemic target range.",
      };
    }
  }

  // Oxygen Saturation / SpO2 (%)
  if (norm.includes("oxygen") || norm.includes("spo2")) {
    if (primaryValue <= 89) {
      return {
        isCritical: true,
        isWarning: false,
        title: "Severe Hypoxia",
        detail: "Oxygen saturation <= 89%. Patient requires supplemental oxygen or urgent clinical assessment.",
      };
    }
    if (primaryValue <= 93) {
      return {
        isCritical: false,
        isWarning: true,
        title: "Low Oxygen Saturation",
        detail: "SpO2 is below standard 95% threshold. Monitor respiratory rate and ventilation.",
      };
    }
  }

  // Heart Rate / Pulse (bpm)
  if (norm.includes("pulse") || norm.includes("heart_rate")) {
    if (primaryValue >= 145) {
      return {
        isCritical: true,
        isWarning: false,
        title: "Severe Tachycardia",
        detail: "Resting pulse >= 145 bpm. Potential cardiac arrhythmia or acute distress.",
      };
    }
    if (primaryValue <= 45) {
      return {
        isCritical: true,
        isWarning: false,
        title: "Severe Bradycardia",
        detail: "Resting pulse <= 45 bpm. Dangerously low heart rate if not an athletic baseline.",
      };
    }
    if (primaryValue >= 105 || primaryValue <= 55) {
      return {
        isCritical: false,
        isWarning: true,
        title: "Elevated / Low Pulse",
        detail: "Pulse is outside typical resting baseline (60-100 bpm).",
      };
    }
  }

  // Body Temperature (°C or °F)
  if (norm.includes("temp")) {
    const isFahrenheit = primaryValue > 60;
    const tempF = isFahrenheit ? primaryValue : (primaryValue * 9) / 5 + 32;
    if (tempF >= 103.5) {
      return {
        isCritical: true,
        isWarning: false,
        title: "High Grade Fever",
        detail: `Body temperature is ${tempF.toFixed(1)}°F (>= 103.5°F). Immediate antipyretic care or physician consult required.`,
      };
    }
    if (tempF <= 95.0) {
      return {
        isCritical: true,
        isWarning: false,
        title: "Hypothermia",
        detail: `Body temperature is ${tempF.toFixed(1)}°F (<= 95.0°F). Warm the patient immediately.`,
      };
    }
    if (tempF >= 100.4) {
      return {
        isCritical: false,
        isWarning: true,
        title: "Fever Detected",
        detail: `Body temperature is elevated (${tempF.toFixed(1)}°F). Keep hydrated and monitor.`,
      };
    }
  }

  return {
    isCritical: false,
    isWarning: false,
    title: "",
    detail: "",
  };
}
