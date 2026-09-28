import AsyncStorage from "@react-native-async-storage/async-storage";

export interface QueuedMutation {
  id: string;
  endpoint: string;
  method: "POST" | "PATCH" | "DELETE";
  body?: unknown;
  createdAt: string;
  attempts: number;
}

const QUEUE_KEY = "parentpulse.mutation-queue.v1";

const read = async (): Promise<QueuedMutation[]> => {
  try {
    return JSON.parse((await AsyncStorage.getItem(QUEUE_KEY)) || "[]");
  } catch {
    await AsyncStorage.removeItem(QUEUE_KEY);
    return [];
  }
};

const write = (items: QueuedMutation[]) => AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));

export async function enqueueMutation(input: Omit<QueuedMutation, "id" | "createdAt" | "attempts">): Promise<QueuedMutation> {
  const item: QueuedMutation = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  await write([...(await read()), item]);
  return item;
}

export async function drainMutationQueue(execute: (item: QueuedMutation) => Promise<void>): Promise<number> {
  const items = await read();
  const remaining: QueuedMutation[] = [];
  for (const item of items) {
    try {
      await execute(item);
    } catch {
      remaining.push({ ...item, attempts: item.attempts + 1 });
      // Preserve ordering: later writes may depend on this one.
      remaining.push(...items.slice(items.indexOf(item) + 1));
      break;
    }
  }
  await write(remaining);
  return remaining.length;
}
