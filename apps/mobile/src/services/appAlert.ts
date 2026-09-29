export type FeedbackTone = "success" | "error" | "warning" | "info";

export interface AppAlertButton {
  text?: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

export interface FeedbackEvent {
  id: number;
  title: string;
  message?: string;
  tone: FeedbackTone;
  buttons: AppAlertButton[];
  kind: "toast" | "dialog";
}

type FeedbackListener = (event: FeedbackEvent) => void;

const listeners = new Set<FeedbackListener>();
let eventSequence = 0;

const inferTone = (title: string): FeedbackTone => {
  const normalized = title.toLowerCase();
  if (/fail|couldn|invalid|error|unavailable|missing|required/.test(normalized)) return "error";
  if (/warning|check|permission|low|expired|system setting/.test(normalized)) return "warning";
  if (/success|created|saved|scheduled|sent|resolved|revoked|welcome|active/.test(normalized)) return "success";
  return "info";
};

export const AppAlert = {
  alert(
    title: string,
    message?: string,
    buttons: AppAlertButton[] = [],
  ): void {
    const event: FeedbackEvent = {
      id: ++eventSequence,
      title,
      message,
      tone: inferTone(title),
      buttons,
      kind: buttons.length > 0 ? "dialog" : "toast",
    };
    listeners.forEach((listener) => listener(event));
  },
};

export const subscribeToAppAlerts = (listener: FeedbackListener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
