import * as SecureStore from "expo-secure-store";

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
}

const SESSION_KEY = "parentpulse.auth.session.v1";

export const sessionStore = {
  async load(): Promise<StoredSession | null> {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredSession;
    } catch {
      await SecureStore.deleteItemAsync(SESSION_KEY);
      return null;
    }
  },

  async save(session: StoredSession): Promise<void> {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  },
};
