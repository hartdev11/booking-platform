"use client";

import { useEffect, useState } from "react";
import { useToastStore, type ToastVariant } from "@/stores/toastStore";
import { cn } from "@/lib/utils/cn";

const variantStyles: Record<ToastVariant, string> = {
  success: "bg-(--success)/90 text-white border-(--success)",
  error: "bg-(--error)/90 text-white border-(--error)",
  warning: "bg-(--warning)/90 text-zinc-900 border-(--warning)",
  info: "bg-(--info)/90 text-white border-(--info)",
};

function SingleToast({
  id,
  message,
  variant,
  onDismiss,
  isMobile,
}: {
  id: string;
  message: string;
  variant: ToastVariant;
  onDismiss: () => void;
  isMobile: boolean;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg",
        variantStyles[variant],
        isMobile ? "animate-[toast-in-mobile_0.3s_ease-out]" : "animate-[toast-in_0.3s_ease-out]"
      )}
    >
      {variant === "success" && (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {variant === "error" && (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {variant === "warning" && (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )}
      {variant === "info" && (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      <p className="flex-1 text-sm font-medium min-w-0">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 p-1 rounded-lg hover:bg-white/20 transition"
        aria-label="ปิด"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, remove } = useToastStore();
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const fn = () => setIsMobile(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  if (toasts.length === 0) return null;
  const style = isMobile
    ? { bottom: "calc(env(safe-area-inset-bottom) + 1rem)", left: "1rem", right: "1rem", alignItems: "center" as const }
    : { top: "1rem", right: "calc(env(safe-area-inset-right) + 1rem)", maxWidth: "380px", alignItems: "flex-end" as const };
  return (
    <div className="fixed z-100 pointer-events-none flex flex-col gap-2" style={style}>
      <div className="pointer-events-auto flex flex-col gap-2 w-full max-w-full">
        {toasts.map((t) => (
          <SingleToast
            key={t.id}
            id={t.id}
            message={t.message}
            variant={t.variant}
            onDismiss={() => remove(t.id)}
            isMobile={isMobile}
          />
        ))}
      </div>
    </div>
  );
}
