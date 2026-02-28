"use client";

import type { Booking } from "@/types";
import { formatThaiDate } from "@/lib/utils/formatThaiDate";
interface CancelConfirmSheetProps {
  open: boolean;
  booking: Booking | null;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function CancelConfirmSheet({
  open,
  booking,
  onClose,
  onConfirm,
  loading = false,
}: CancelConfirmSheetProps) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-40 transition-opacity duration-200"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="fixed left-0 right-0 bottom-0 z-50 rounded-t-3xl bg-zinc-900 border border-zinc-800 border-b-0 shadow-xl transition-transform duration-300 ease-out"
        style={{ animation: "cancel-sheet-in 0.3s ease-out" }}
      >
        <div className="p-6 pb-8 safe-area-pb">
          <div className="w-10 h-1 rounded-full bg-zinc-600 mx-auto mb-6" />
          <h3 className="text-lg font-semibold text-white mb-2">
            ยกเลิกการจอง?
          </h3>
          <p className="text-zinc-400 text-sm mb-4">
            การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </p>
          {booking && (
            <div className="rounded-xl bg-zinc-800/50 p-3 mb-6 text-sm">
              <p className="text-white font-medium">{booking.serviceName}</p>
              <p className="text-zinc-400">
                {formatThaiDate(booking.date)} · {booking.startTime}
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-zinc-600 py-3 text-white font-medium hover:bg-zinc-800/50 disabled:opacity-50 transition"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 rounded-xl bg-red-600 py-3 text-white font-medium hover:bg-red-500 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  กำลังยกเลิก...
                </>
              ) : (
                "ยืนยันยกเลิก"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
