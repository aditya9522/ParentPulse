import AsyncStorage from "@react-native-async-storage/async-storage";
import { randomUUID } from "expo-crypto";

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
const ENCRYPTED_PREFIX = "aes-gcm-v1:";
const listeners = new Set<QueueListener>();
let drainPromise: Promise<QueueDrainResult> | null = null;
let storageTail: Promise<void> = Promise.resolve();

const safeParse = (value: string | null): QueuedMutation[] => {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as QueuedMutation[]) : [];
  } catch {
    return [];
  }
};

const readAll = async (): Promise<QueuedMutation[]> => {
  try {
    const stored = await AsyncStorage.getItem(QUEUE_KEY);
    if (!stored) return [];
    // If leftover encrypted payload from older build is present, clear it to avoid corruption
    if (stored.startsWith(ENCRYPTED_PREFIX)) {
      await AsyncStorage.removeItem(QUEUE_KEY);
      return [];
    }
    return safeParse(stored);
  } catch (error) {
    console.warn("Could not read mutation queue:", error);
    return [];
  }
};

const writeAll = async (items: QueuedMutation[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn("Could not write mutation queue:", error);
  }
  listeners.forEach((listener) => {
    try {
      listener(items);
    } catch (listenerError) {
      console.warn("Mutation queue listener error:", listenerError);
    }
  });
};

const mutateAll = async (
  transform: (items: QueuedMutation[]) => QueuedMutation[],
): Promise<QueuedMutation[]> => {
  let result: QueuedMutation[] = [];
  const operation = storageTail.then(async () => {
    const current = await readAll();
    result = transform(current);
    await writeAll(result);
  });
  storageTail = operation.catch(() => undefined);
  await operation;
  return result;
};

export async function initializeMutationQueue(): Promise<void> {
  try {
    const legacy = await AsyncStorage.getItem(LEGACY_QUEUE_KEY);
    if (legacy) {
      await AsyncStorage.removeItem(LEGACY_QUEUE_KEY);
    }
    const stored = await AsyncStorage.getItem(QUEUE_KEY);
    if (stored && stored.startsWith(ENCRYPTED_PREFIX)) {
      await AsyncStorage.removeItem(QUEUE_KEY);
    }
    const items = await readAll();
    listeners.forEach((listener) => {
      try {
        listener(items);
      } catch { }
    });
  } catch (error) {
    console.warn("Failed to initialize mutation queue:", error);
  }
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
      candidate.ownerUserId === item.ownerUserId &&
      candidate.resourceType === item.resourceType &&
      candidate.resourceId === item.resourceId;

    if (item.method === "DELETE") {
      const unsyncedCreate = items.find(
        (candidate) =>
          sameRecord(candidate) &&
          candidate.method === "POST" &&
          candidate.state === "pending" &&
          candidate.attempts === 0,
      );
      if (unsyncedCreate) return items.filter((candidate) => !sameRecord(candidate));
      items = items.filter(
        (candidate) =>
          !(sameRecord(candidate) && candidate.method === "PATCH" && candidate.state === "pending"),
      );
    }

    if (item.method === "PATCH") {
      const existingIndex = items.findLastIndex(
        (candidate) =>
          sameRecord(candidate) &&
          candidate.method === "PATCH" &&
          candidate.state === "pending" &&
          candidate.attempts === 0,
      );
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
        return items.map((candidate, index) => (index === existingIndex ? item : candidate));
      }
    }

    return [...items, item];
  });
  return item;
}

export async function retryQueuedMutation(id: string, overwrite = false): Promise<void> {
  await mutateAll((items) =>
    items.map((item) =>
      item.id === id
        ? {
          ...item,
          state: "pending",
          nextAttemptAt: undefined,
          lastFailure: undefined,
          conflictResolution: overwrite ? "overwrite" : undefined,
        }
        : item,
    ),
  );
}

export async function discardQueuedMutation(id: string): Promise<void> {
  await mutateAll((items) => items.filter((item) => item.id !== id));
}

const failureFrom = (error: unknown): MutationFailure => {
  const candidate = error as {
    message?: string;
    status?: number | null;
    code?: string;
    requestId?: string;
  };
  return {
    message: candidate?.message || "The change could not be synchronized.",
    status: typeof candidate?.status === "number" ? candidate.status : null,
    code: candidate?.code,
    requestId: candidate?.requestId,
    occurredAt: new Date().toISOString(),
  };
};

const backoffSeconds = (attempts: number): number =>
  Math.min(300, 2 ** Math.min(attempts, 7) * 5);

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
        .filter(
          (item) =>
            item.ownerUserId === ownerUserId &&
            (item.state === "blocked" || item.state === "conflict"),
        )
        .map(
          (item) => `${item.resourceType}:${item.resourceId || item.parentId || "collection"}`,
        ),
    );

    for (const original of items.filter((item) => item.ownerUserId === ownerUserId)) {
      const resourceKey = `${original.resourceType}:${original.resourceId || original.parentId || "collection"}`;
      if (
        blockedResources.has(resourceKey) ||
        original.state === "blocked" ||
        original.state === "conflict"
      )
        continue;
      if (original.nextAttemptAt && Date.parse(original.nextAttemptAt) > Date.now()) continue;

      items = await mutateAll((current) =>
        current.map((item) => (item.id === original.id ? { ...item, state: "syncing" } : item)),
      );
      try {
        const response = await execute({ ...original, state: "syncing" });
        const serverVersion =
          typeof response === "object" && response && "updated_at" in response
            ? String(response.updated_at)
            : undefined;
        items = await mutateAll((current) =>
          current
            .filter((item) => item.id !== original.id)
            .map((item) =>
              serverVersion &&
                item.ownerUserId === original.ownerUserId &&
                item.resourceType === original.resourceType &&
                item.resourceId === original.resourceId
                ? { ...item, expectedVersion: serverVersion }
                : item,
            ),
        );
        succeeded += 1;
      } catch (error) {
        const failure = failureFrom(error);
        const attempts = original.attempts + 1;
        const permanent =
          failure.status != null && [400, 403, 404, 409, 422].includes(failure.status);
        const state: MutationSyncState =
          failure.status === 409 ? "conflict" : permanent ? "blocked" : "pending";
        const nextAttemptAt =
          state === "pending"
            ? new Date(Date.now() + backoffSeconds(attempts) * 1000).toISOString()
            : undefined;
        items = await mutateAll((current) =>
          current.map((item) =>
            item.id === original.id
              ? {
                ...item,
                attempts,
                state,
                nextAttemptAt,
                lastFailure: failure,
              }
              : item,
          ),
        );
        blockedResources.add(resourceKey);
        if (
          failure.status == null ||
          failure.status === 401 ||
          failure.status === 429 ||
          failure.status >= 500
        )
          break;
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
