"use client";

import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

const defaultIcon = (
  <svg
    className="w-16 h-16 text-(--text-muted) opacity-60"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
    />
  </svg>
);

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon = defaultIcon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6",
        className
      )}
    >
      <div className="mb-4 flex items-center justify-center">{icon}</div>
      <h3 className="text-base font-semibold text-(--text-primary) mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-(--text-secondary) mb-6 max-w-xs">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="rounded-xl bg-(--brand-primary) px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 btn-haptic transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
