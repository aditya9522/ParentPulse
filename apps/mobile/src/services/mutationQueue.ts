import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AESEncryptionKey,
  AESSealedData,
  aesDecryptAsync,
  aesEncryptAsync,
  randomUUID,
} from "expo-crypto";
import * as SecureStore from "expo-secure-store";

export type MutationSyncState = "pending" | "syncing" | "conflict" | "blocked";

export interface MutationFailure {
  message: string;
  status: number | null;
  code?: string;
  requestId?: string;
  occurredAt: string;
}

export interface MutationDescriptor {
  label: string;
  resourceType: string;
  resourceId?: string;
  parentId?: string;
  expectedVersion?: string;
}

export interface QueuedMutation extends MutationDescriptor {
  id: string;
  ownerUserId: string;
  endpoint: string;
  method: "POST" | "PATCH" | "DELETE";
  body?: unknown;
  createdAt: string;
  attempts: number;
  state: MutationSyncState;
  nextAttemptAt?: string;
  lastFailure?: MutationFailure;
  conflictResolution?: "overwrite";
}

export interface QueueDrainResult {
  succeeded: number;
  remaining: number;
  blocked: number;
}

type QueueListener = (items: QueuedMutation[]) => void;

const QUEUE_KEY = "parentpulse.mutation-queue.v2";
const LEGACY_QUEUE_KEY = "parentpulse.mutation-queue.v1";
const ENCRYPTION_KEY = "parentpulse.mutation-queue.encryption-key.v1";
const ENCRYPTED_PREFIX = "aes-gcm-v1:";
const listeners = new Set<QueueListener>();
let drainPromise: Promise<QueueDrainResult> | null = null;
let storageTail: Promise<void> = Promise.resolve();

const safeParse = (value: string | null): QueuedMutation[] => {
  if (!value) return [];
  const parsed: unknown = JSON.parse(value);
  return Array.isArray(parsed) ? parsed as QueuedMutation[] : [];
};

const getEncryptionKey = async (): Promise<AESEncryptionKey> => {
  const stored = await SecureStore.getItemAsync(ENCRYPTION_KEY);
  if (stored) return await AESEncryptionKey.import(stored, "base64") as AESEncryptionKey;
  const generated = await AESEncryptionKey.generate() as AESEncryptionKey;
  await SecureStore.setItemAsync(ENCRYPTION_KEY, await generated.encoded("base64"), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return generated;
};

const decryptQueue = async (stored: string | null): Promise<QueuedMutation[]> => {
  if (!stored) return [];
  if (!stored.startsWith(ENCRYPTED_PREFIX)) return safeParse(stored);
  const key = await getEncryptionKey();
  const sealed = AESSealedData.fromCombined(stored.slice(ENCRYPTED_PREFIX.length));
  const plaintext = await aesDecryptAsync(sealed, key);
  return safeParse(new TextDecoder().decode(plaintext as Uint8Array));
};

const encryptText = async (plaintext: string): Promise<string> => {
  const key = await getEncryptionKey();
  const sealed = await aesEncryptAsync(new TextEncoder().encode(plaintext), key);
  return `${ENCRYPTED_PREFIX}${await sealed.combined("base64")}`;
};

const encryptQueue = (items: QueuedMutation[]): Promise<string> => encryptText(JSON.stringify(items));

const readAll = async (): Promise<QueuedMutation[]> => {
  try {
    return await decryptQueue(await AsyncStorage.getItem(QUEUE_KEY));
  } catch {
    throw new Error("Secure offline changes could not be opened on this device.");
  }
};

const writeAll = async (items: QueuedMutation[]): Promise<void> => {
  await AsyncStorage.setItem(QUEUE_KEY, await encryptQueue(items));
  listeners.forEach((listener) => listener(items));
};

const mutateAll = async (
  transform: (items: QueuedMutation[]) => QueuedMutation[],
): Promise<QueuedMutation[]> => {
  let result: QueuedMutation[] = [];
  const operation = storageTail.then(async () => {
    result = transform(await readAll());
    await writeAll(result);
  });
  storageTail = operation.catch(() => undefined);
  await operation;
  return result;
};

export async function initializeMutationQueue(): Promise<void> {
  // V1 writes were not account-scoped. Quarantine them rather than risk
  // replaying private care changes into a different account.
  const legacy = await AsyncStorage.getItem(LEGACY_QUEUE_KEY);
  if (legacy) {
    await AsyncStorage.setItem(`${LEGACY_QUEUE_KEY}.quarantined`, await encryptText(legacy));
    await AsyncStorage.removeItem(LEGACY_QUEUE_KEY);
  }
  const stored = await AsyncStorage.getItem(QUEUE_KEY);
  const items = await decryptQueue(stored);
  if (stored && !stored.startsWith(ENCRYPTED_PREFIX)) await writeAll(items);
  listeners.forEach((listener) => listener(items));
}

export async function listQueuedMutations(ownerUserId: string): Promise<QueuedMutation[]> {
  return (await readAll()).filter((item) => item.ownerUserId === ownerUserId);
}

export function subscribeToMutationQueue(listener: QueueListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function enqueueMutation(
  input: Omit<QueuedMutation, "id" | "createdAt" | "attempts" | "state">,
): Promise<QueuedMutation> {
  let item: QueuedMutation = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    attempts: 0,
    state: "pending",
  };
  await mutateAll((items) => {
    const sameRecord = (candidate: QueuedMutation) =>
      candidate.ownerUserId === item.ownerUserId
      && candidate.resourceType === item.resourceType
      && candidate.resourceId === item.resourceId;

    if (item.method === "DELETE") {
      const unsyncedCreate = items.find((candidate) => sameRecord(candidate) && candidate.method === "POST" && candidate.state === "pending" && candidate.attempts === 0);
      if (unsyncedCreate) return items.filter((candidate) => !sameRecord(candidate));
      items = items.filter((candidate) => !(sameRecord(candidate) && candidate.method === "PATCH" && candidate.state === "pending"));
    }

    if (item.method === "PATCH") {
      const existingIndex = items.findLastIndex((candidate) => sameRecord(candidate) && candidate.method === "PATCH" && candidate.state === "pending" && candidate.attempts === 0);
      if (existingIndex >= 0) {
        const existing = items[existingIndex];
        item = {
          ...existing,
          label: item.label,
          body: {
            ...(typeof existing.body === "object" && existing.body ? existing.body : {}),
            ...(typeof item.body === "object" && item.body ? item.body : {}),
          },
        };
        return items.map((candidate, index) => index === existingIndex ? item : candidate);
      }
    }

    return [...items, item];
  });
  return item;
}

export async function retryQueuedMutation(id: string, overwrite = false): Promise<void> {
  await mutateAll((items) => items.map((item) => item.id === id ? {
    ...item,
    state: "pending",
    nextAttemptAt: undefined,
    lastFailure: undefined,
    conflictResolution: overwrite ? "overwrite" : undefined,
  } : item));
}

export async function discardQueuedMutation(id: string): Promise<void> {
  await mutateAll((items) => items.filter((item) => item.id !== id));
}

const failureFrom = (error: unknown): MutationFailure => {
  const candidate = error as { message?: string; status?: number | null; code?: string; requestId?: string };
  return {
    message: candidate?.message || "The change could not be synchronized.",
    status: typeof candidate?.status === "number" ? candidate.status : null,
    code: candidate?.code,
    requestId: candidate?.requestId,
    occurredAt: new Date().toISOString(),
  };
};

const backoffSeconds = (attempts: number): number => Math.min(300, 2 ** Math.min(attempts, 7) * 5);

export async function drainMutationQueue(
  ownerUserId: string,
  execute: (item: QueuedMutation) => Promise<unknown>,
): Promise<QueueDrainResult> {
  if (drainPromise) return drainPromise;
  drainPromise = (async () => {
    let items = await readAll();
    let succeeded = 0;
    const blockedResources = new Set(
      items
        .filter((item) => item.ownerUserId === ownerUserId && (item.state === "blocked" || item.state === "conflict"))
        .map((item) => `${item.resourceType}:${item.resourceId || item.parentId || "collection"}`),
    );

    for (const original of items.filter((item) => item.ownerUserId === ownerUserId)) {
      const resourceKey = `${original.resourceType}:${original.resourceId || original.parentId || "collection"}`;
      if (blockedResources.has(resourceKey) || original.state === "blocked" || original.state === "conflict") continue;
      if (original.nextAttemptAt && Date.parse(original.nextAttemptAt) > Date.now()) continue;

      items = await mutateAll((current) => current.map((item) => item.id === original.id ? { ...item, state: "syncing" } : item));
      try {
        const response = await execute({ ...original, state: "syncing" });
        const serverVersion = typeof response === "object" && response && "updated_at" in response
          ? String(response.updated_at)
          : undefined;
        items = await mutateAll((current) => current
          .filter((item) => item.id !== original.id)
          .map((item) => serverVersion
            && item.ownerUserId === original.ownerUserId
            && item.resourceType === original.resourceType
            && item.resourceId === original.resourceId
            ? { ...item, expectedVersion: serverVersion }
            : item));
        succeeded += 1;
      } catch (error) {
        const failure = failureFrom(error);
        const attempts = original.attempts + 1;
        const permanent = failure.status != null && [400, 403, 404, 409, 422].includes(failure.status);
        const state: MutationSyncState = failure.status === 409 ? "conflict" : permanent ? "blocked" : "pending";
        const nextAttemptAt = state === "pending"
          ? new Date(Date.now() + backoffSeconds(attempts) * 1000).toISOString()
          : undefined;
        items = await mutateAll((current) => current.map((item) => item.id === original.id ? {
          ...item,
          attempts,
          state,
          nextAttemptAt,
          lastFailure: failure,
        } : item));
        blockedResources.add(resourceKey);
        if (failure.status == null || failure.status === 401 || failure.status === 429 || failure.status >= 500) break;
      }
    }

    items = await readAll();
    const owned = items.filter((item) => item.ownerUserId === ownerUserId);
    return {
      succeeded,
      remaining: owned.length,
      blocked: owned.filter((item) => item.state === "blocked" || item.state === "conflict").length,
    };
  })().finally(() => {
    drainPromise = null;
  });
  return drainPromise;
}
