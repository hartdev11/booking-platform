"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useBookingFlowStore } from "@/stores/bookingFlowStore";
import { useUpcomingBookings, usePastBookings } from "@/hooks/useCustomerBookings";
import { useToastStore } from "@/stores/toastStore";
import { BookingCard } from "@/components/customer/BookingCard";
import { CancelConfirmSheet } from "@/components/customer/CancelConfirmSheet";
import { PageTransition } from "@/components/ui/PageTransition";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Booking } from "@/types";
import { cn } from "@/lib/utils/cn";

type Tab = "upcoming" | "past";

export default function BookingStatusPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;
  const { lineProfile } = useBookingFlowStore();
  const lineUserId = lineProfile?.userId ?? null;
  const [tab, setTab] = useState<Tab>("upcoming");
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const { bookings: upcomingBookings, loading: upcomingLoading, error: upcomingError } = useUpcomingBookings(tenantId, lineUserId);
  const { bookings: pastBookings, loading: pastLoading, error: pastError } = usePastBookings(tenantId, lineUserId);

  const handleCancelClick = (booking: Booking) => {
    setCancelError(null);
    setCancelTarget(booking);
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget || !lineUserId) return;
    setCancelError(null);
    setCancelLoading(true);
    try {
      const res = await fetch(
        `/api/customer/${tenantId}/bookings/${cancelTarget.id}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lineUserId }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "เกิดข้อผิดพลาด";
        setCancelError(msg);
        useToastStore.getState().error(msg);
        return;
      }
      setCancelTarget(null);
      useToastStore.getState().success("ยกเลิกการจองแล้ว");
    } catch {
      const msg = "เกิดข้อผิดพลาด กรุณาลองใหม่";
      setCancelError(msg);
      useToastStore.getState().error(msg);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleCloseSheet = () => {
    if (!cancelLoading) {
      setCancelTarget(null);
      setCancelError(null);
    }
  };

  if (!lineUserId) {
    return (
      <div className="flex flex-col min-h-full p-6">
        <Link
          href={`/booking/${tenantId}`}
          className="text-zinc-400 hover:text-white text-sm mb-6"
        >
          ← กลับ
        </Link>
        <p className="text-zinc-400 text-center">กรุณาเข้าสู่ระบบเพื่อดูการจอง</p>
      </div>
    );
  }

  return (
    <PageTransition className="flex flex-col min-h-full p-6 pb-8 safe-area-bottom">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/booking/${tenantId}`}
          className="text-zinc-400 hover:text-white text-sm"
        >
          ← กลับ
        </Link>
      </div>

      <h1 className="text-xl font-semibold text-white mb-6">การจองของฉัน</h1>

      <div className="flex rounded-xl bg-zinc-800/50 p-1 mb-6">
        <button
          type="button"
          onClick={() => setTab("upcoming")}
          className={cn(
            "flex-1 rounded-lg py-2.5 text-sm font-medium transition",
            tab === "upcoming"
              ? "bg-zinc-700 text-white"
              : "text-zinc-400 hover:text-white"
          )}
        >
          การจองที่จะมาถึง
        </button>
        <button
          type="button"
          onClick={() => setTab("past")}
          className={cn(
            "flex-1 rounded-lg py-2.5 text-sm font-medium transition",
            tab === "past"
              ? "bg-zinc-700 text-white"
              : "text-zinc-400 hover:text-white"
          )}
        >
          ประวัติการจอง
        </button>
      </div>

      {tab === "upcoming" && (
        <>
          {upcomingError && (
            <p className="text-red-400 text-sm mb-4">{upcomingError.message}</p>
          )}
          {upcomingLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-(--border-subtle) bg-(--surface-tertiary) p-4 space-y-3"
                >
                  <Skeleton variant="text" className="w-24 h-5" />
                  <Skeleton variant="text" className="w-3/4 h-4" />
                  <Skeleton variant="text" className="w-1/2 h-4" />
                </div>
              ))}
            </div>
          ) : upcomingBookings.length === 0 ? (
            <EmptyState
              title="ไม่มีรายการจองที่จะมาถึง"
              actionLabel="จองคิว"
              onAction={() => router.push(`/booking/${tenantId}/date`)}
            />
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  variant="upcoming"
                  showCancelButton
                  onCancel={handleCancelClick}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "past" && (
        <>
          {pastError && (
            <p className="text-red-400 text-sm mb-4">{pastError.message}</p>
          )}
          {pastLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-zinc-800 bg-zinc-800/30 p-4 space-y-3"
                >
                  <div className="h-5 bg-zinc-700/50 rounded w-24 animate-pulse" />
                  <div className="h-4 bg-zinc-700/50 rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-zinc-700/50 rounded w-1/2 animate-pulse" />
                </div>
              ))}
            </div>
          ) : pastBookings.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-800/20 p-8 text-center">
              <p className="text-zinc-400 text-sm">ไม่มีประวัติการจอง</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  variant="past"
                />
              ))}
            </div>
          )}
        </>
      )}

      <CancelConfirmSheet
        open={cancelTarget !== null}
        booking={cancelTarget}
        onClose={handleCloseSheet}
        onConfirm={handleCancelConfirm}
        loading={cancelLoading}
      />
      {cancelError && cancelTarget && (
        <p className="fixed bottom-24 left-6 right-6 text-red-400 text-sm text-center z-50">
          {cancelError}
        </p>
      )}
  </PageTransition>
  );
}
