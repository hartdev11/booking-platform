"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function BottomSheet({
  open,
  onClose,
  children,
  title,
  className,
}: BottomSheetProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handlePointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    currentY.current = 0;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dy = e.clientY - startY.current;
    if (dy > 0) currentY.current = dy;
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    if (currentY.current > 80) onClose();
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        aria-hidden
        onClick={onClose}
      />
      <div
        className={cn(
          "fixed left-0 right-0 bottom-0 z-50 rounded-t-3xl bg-(--surface-secondary) border border-(--border-subtle) border-b-0 shadow-xl safe-area-bottom",
          "transition-transform duration-300 ease-out",
          className
        )}
        style={{
          animation: "cancel-sheet-in 0.3s ease-out",
          transform: isDragging ? `translateY(${currentY.current}px)` : undefined,
        }}
      >
        <div
          className="flex flex-col pt-3 pb-1"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="flex justify-center mb-2">
            <div className="w-10 h-1 rounded-full bg-(--border-default)" />
          </div>
          {title && (
            <h3 className="text-lg font-semibold text-(--text-primary) text-center px-4 pb-3">
              {title}
            </h3>
          )}
        </div>
        <div className="px-4 pb-6 overflow-y-auto max-h-[70vh]">
          {children}
        </div>
      </div>
    </>
  );
}
