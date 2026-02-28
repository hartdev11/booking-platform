import { create } from "zustand";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  createdAt: number;
}

const AUTO_DISMISS_MS = 4000;

interface ToastStore {
  toasts: ToastItem[];
  add: (message: string, variant: ToastVariant) => void;
  remove: (id: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

let dismissTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

function scheduleDismiss(id: string, remove: (id: string) => void) {
  const t = setTimeout(() => {
    remove(id);
    dismissTimers.delete(id);
  }, AUTO_DISMISS_MS);
  dismissTimers.set(id, t);
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  add: (message, variant) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const item: ToastItem = { id, message, variant, createdAt: Date.now() };
    set((s) => ({ toasts: [...s.toasts, item] }));
    scheduleDismiss(id, get().remove);
  },
  remove: (id) => {
    const t = dismissTimers.get(id);
    if (t) clearTimeout(t);
    dismissTimers.delete(id);
    set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
  },
  success: (message) => get().add(message, "success"),
  error: (message) => get().add(message, "error"),
  warning: (message) => get().add(message, "warning"),
  info: (message) => get().add(message, "info"),
}));
