import { Platform } from "react-native";
import { isExpoGo } from "./runtimeEnvironment";

type NotificationModule = typeof import("expo-notifications");

export const notificationsAvailable = !(
  Platform.OS === "android" && isExpoGo
);

let modulePromise: Promise<NotificationModule> | null = null;
let handlerConfigured = false;

export async function getNotifications(): Promise<NotificationModule | null> {
  if (!notificationsAvailable) return null;
  modulePromise ??= import("expo-notifications");
  const Notifications = await modulePromise;

  if (!handlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    handlerConfigured = true;
  }

  return Notifications;
}
