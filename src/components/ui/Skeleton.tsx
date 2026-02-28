"use client";

import { cn } from "@/lib/utils/cn";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "card" | "avatar" | "button";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = "text",
  width,
  height,
}: SkeletonProps) {
  const style: React.CSSProperties = {};
  if (width != null) style.width = typeof width === "number" ? `${width}px` : width;
  if (height != null) style.height = typeof height === "number" ? `${height}px` : height;

  const variantClass = {
    text: "h-4 rounded",
    card: "rounded-2xl",
    avatar: "rounded-full",
    button: "rounded-xl h-12",
  }[variant];

  return (
    <div
      style={style}
      className={cn("animate-shimmer", variantClass, className)}
      aria-hidden
    />
  );
}

export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={i === lines - 1 && lines > 1 ? "w-2/3" : undefined}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-(--border-subtle) overflow-hidden", className)}>
      <Skeleton variant="card" className="aspect-4/3" />
      <div className="p-4 space-y-2">
        <Skeleton variant="text" className="h-5 w-3/4" />
        <Skeleton variant="text" className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonAvatar({ size = 12, className }: { size?: number; className?: string }) {
  return (
    <Skeleton
      variant="avatar"
      className={cn(className)}
      width={size * 4}
      height={size * 4}
    />
  );
}
