import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Appointment, MedicineSchedule } from "../types";
import { apiClient } from "../api/client";

const IDS_KEY = "parentpulse.notification-ids.v1";
const CHANNEL_ID = "care-reminders";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const parseClock = (value: string): { hour: number; minute: number } | null => {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3]?.toUpperCase();
  if (minute > 59 || hour > (period ? 12 : 23)) return null;
  if (period === "AM" && hour === 12) hour = 0;
  if (period === "PM" && hour < 12) hour += 12;
  return { hour, minute };
};

export async function syncCareReminders(
  medicines: MedicineSchedule[],
  appointments: Appointment[],
  requestPermission = false,
): Promise<void> {
  const permission = await Notifications.getPermissionsAsync();
  const status = permission.status === "granted" || !requestPermission
    ? permission.status
    : (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Care reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 180, 120, 180],
      lightColor: "#0D9488",
    });
  }

  const previousIds: string[] = JSON.parse((await AsyncStorage.getItem(IDS_KEY)) || "[]");
  await Promise.all(previousIds.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)));
  const nextIds: string[] = [];

  for (const medicine of medicines.filter((item) => item.is_active)) {
    for (const time of medicine.schedule_times) {
      const clock = parseClock(time);
      if (!clock) continue;
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Time for ${medicine.name}`,
          body: `${medicine.dosage} · ${medicine.instructions.replaceAll("_", " ")}`,
          sound: "default",
          data: { type: "medicine", medicineId: medicine.id, parentId: medicine.parent_id },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, ...clock, channelId: CHANNEL_ID },
      });
      nextIds.push(id);
    }
  }

  const now = Date.now();
  for (const appointment of appointments.filter((item) => item.status === "upcoming")) {
    const appointmentAt = new Date(appointment.appointment_date).getTime();
    for (const leadMs of [24 * 60 * 60 * 1000, 2 * 60 * 60 * 1000]) {
      const reminderAt = appointmentAt - leadMs;
      if (!Number.isFinite(reminderAt) || reminderAt <= now) continue;
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: leadMs > 3 * 60 * 60 * 1000 ? "Appointment tomorrow" : "Appointment in 2 hours",
          body: `${appointment.doctor_name} · ${appointment.hospital_clinic_name}`,
          sound: "default",
          data: { type: "appointment", appointmentId: appointment.id, parentId: appointment.parent_id },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderAt, channelId: CHANNEL_ID },
      });
      nextIds.push(id);
    }
  }

  await AsyncStorage.setItem(IDS_KEY, JSON.stringify(nextIds));
}

export async function registerRemotePushDevice(): Promise<boolean> {
  if (Platform.OS !== "android" && Platform.OS !== "ios") return false;
  if (!apiClient.isAuthenticated()) return false;
  await Notifications.setNotificationCategoryAsync("sos-alert", [
    { identifier: "acknowledged", buttonTitle: "I’ve seen this", options: { opensAppToForeground: false } },
    { identifier: "responding", buttonTitle: "I’m responding", options: { opensAppToForeground: true } },
  ]);
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("emergency-alerts", {
      name: "Emergency alerts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 300, 150, 300, 150, 500],
      lightColor: "#DC2626",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
    });
  }
  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== "granted") return false;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return false;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await apiClient.registerPushDevice(token, Platform.OS);
  return true;
}
