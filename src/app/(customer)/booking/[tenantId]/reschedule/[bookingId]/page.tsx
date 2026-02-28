"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useBookingFlowStore } from "@/stores/bookingFlowStore";
import { useToastStore } from "@/stores/toastStore";
import { useAvailableDates } from "@/hooks/useAvailability";
import { useAvailableSlots } from "@/hooks/useAvailability";
import { formatThaiDate } from "@/lib/utils/formatThaiDate";
import { PageTransition } from "@/components/ui/PageTransition";
import type { Booking } from "@/types";
import { cn } from "@/lib/utils/cn";

const DAY_LABELS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

function CalendarMonth({
  year,
  month,
  availableDates,
  selectedDate,
  onSelect,
}: {
  year: number;
  month: number;
  availableDates: string[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
}) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startOffset = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const cells = useMemo(() => {
    const list: { date: string; day: number; isAvailable: boolean; isPast: boolean }[] = [];
    for (let i = 0; i < startOffset; i++) {
      list.push({ date: "", day: 0, isAvailable: false, isPast: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${monthStr}-${String(d).padStart(2, "0")}`;
      const dateObj = new Date(year, month - 1, d);
      list.push({
        date: dateStr,
        day: d,
        isAvailable: availableDates.includes(dateStr),
        isPast: dateObj < today,
      });
    }
    return list;
  }, [year, month, daysInMonth, startOffset, monthStr, availableDates]);
  const monthName = new Date(year, month - 1, 1).toLocaleDateString("th-TH", {
    month: "long",
    year: "numeric",
  });
  return (
    <div className="mb-8">
      <h3 className="text-sm font-medium text-zinc-400 mb-3">{monthName}</h3>
      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="h-8 flex items-center justify-center text-xs text-zinc-500"
          >
            {label}
          </div>
        ))}
        {cells.map((cell, i) => (
          <div key={i} className="aspect-square flex items-center justify-center">
            {cell.date ? (
              <button
                type="button"
                onClick={() => {
                  if (cell.isAvailable && !cell.isPast) onSelect(cell.date);
                }}
                disabled={!cell.isAvailable || cell.isPast}
                className={cn(
                  "w-full h-full rounded-lg text-sm font-medium transition",
                  !cell.isAvailable || cell.isPast
                    ? "text-zinc-600 bg-zinc-800/30 cursor-not-allowed"
                    : selectedDate === cell.date
                      ? "bg-emerald-500 text-white"
                      : "text-white bg-zinc-800 hover:bg-zinc-700"
                )}
              >
                {cell.day}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReschedulePage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;
  const bookingId = params.bookingId as string;
  const { lineProfile, setDate, setTime, setService, setStaff } = useBookingFlowStore();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);
  const currentMonth = useMemo(
    () => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    [now]
  );
  const nextMonth = useMemo(() => {
    const n = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  }, [now]);

  useEffect(() => {
    if (!tenantId || !bookingId || !lineProfile?.userId) {
      setFetchLoading(false);
      return;
    }
    setFetchLoading(true);
    setFetchError(null);
    fetch(
      `/api/customer/${tenantId}/bookings/${bookingId}?lineUserId=${encodeURIComponent(lineProfile.userId)}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("ไม่พบการจอง");
        return res.json();
      })
      .then((data: { booking: Booking }) => {
        setBooking(data.booking);
        if (data.booking.status !== "open" && data.booking.status !== "confirmed") {
          setFetchError("ไม่สามารถเลื่อนการจองนี้ได้");
        }
      })
      .catch(() => setFetchError("ไม่พบการจอง"))
      .finally(() => setFetchLoading(false));
  }, [tenantId, bookingId, lineProfile?.userId]);

  const { availableDates: dates1, loading: dates1Loading } = useAvailableDates(
    tenantId,
    booking?.staffId ?? null,
    currentMonth
  );
  const { availableDates: dates2, loading: dates2Loading } = useAvailableDates(
    tenantId,
    booking?.staffId ?? null,
    nextMonth
  );
  const { slots, loading: slotsLoading } = useAvailableSlots(
    tenantId,
    booking?.staffId ?? null,
    booking?.serviceId ?? null,
    selectedDate
  );

  const [y1, m1] = currentMonth.split("-").map(Number);
  const [y2, m2] = nextMonth.split("-").map(Number);

  const handleConfirm = async () => {
    if (!booking || !selectedDate || !selectedTime || !lineProfile?.userId) return;
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      const res = await fetch(`/api/customer/${tenantId}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          newDate: selectedDate,
          newTime: selectedTime,
          lineUserId: lineProfile.userId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "เกิดข้อผิดพลาด";
        setSubmitError(msg);
        useToastStore.getState().error(msg);
        return;
      }
      setDate(selectedDate);
      setTime(selectedTime);
      setService(booking.serviceId, booking.serviceName);
      setStaff(booking.staffId, booking.staffName);
      useToastStore.getState().success("เลื่อนนัดสำเร็จ");
      router.push(`/booking/${tenantId}/success`);
    } catch {
      const msg = "เกิดข้อผิดพลาด กรุณาลองใหม่";
      setSubmitError(msg);
      useToastStore.getState().error(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (fetchLoading || !booking) {
    return (
      <div className="flex flex-col min-h-full p-6">
        <Link
          href={`/booking/${tenantId}/status`}
          className="text-zinc-400 hover:text-white text-sm mb-6"
        >
          ← กลับ
        </Link>
        {fetchError ? (
          <p className="text-red-400 text-sm">{fetchError}</p>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        )}
      </div>
    );
  }

  if (fetchError || (booking.status !== "open" && booking.status !== "confirmed")) {
    return (
      <div className="flex flex-col min-h-full p-6">
        <Link
          href={`/booking/${tenantId}/status`}
          className="text-zinc-400 hover:text-white text-sm mb-6"
        >
          ← กลับ
        </Link>
        <p className="text-red-400 text-sm">{fetchError ?? "ไม่สามารถเลื่อนการจองนี้ได้"}</p>
      </div>
    );
  }

  return (
    <PageTransition className="flex flex-col min-h-full p-6 pb-8 safe-area-bottom">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/booking/${tenantId}/status`}
          className="text-(--text-secondary) hover:text-(--text-primary) text-sm transition"
        >
          ← ยกเลิก
        </Link>
      </div>

      <h1 className="text-xl font-semibold text-(--text-primary) mb-6">เลื่อนนัดหมาย</h1>

      <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-tertiary) p-4 mb-6">
        <p className="text-xs text-(--text-muted) mb-2">การจองปัจจุบัน</p>
        <p className="text-(--text-primary) font-medium">{booking.serviceName}</p>
        <p className="text-(--text-secondary) text-sm">
          {booking.staffId === "any" ? "ไม่ระบุ" : booking.staffName} · {formatThaiDate(booking.date)} · {booking.startTime}
        </p>
      </div>

      <p className="text-sm text-zinc-400 mb-3">เลือกวันใหม่</p>
      {(dates1Loading || dates2Loading) ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          <CalendarMonth
            year={y1}
            month={m1}
            availableDates={dates1}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
          />
          <CalendarMonth
            year={y2}
            month={m2}
            availableDates={dates2}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
          />
        </>
      )}

      {selectedDate && (
        <>
          <p className="text-sm text-zinc-400 mb-3 mt-4">เลือกเวลา</p>
          {slotsLoading ? (
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-xl py-3 bg-zinc-800/50 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => slot.isAvailable && setSelectedTime(slot.time)}
                  disabled={!slot.isAvailable}
                  className={cn(
                    "rounded-xl py-3 px-4 text-sm font-medium transition",
                    !slot.isAvailable
                      ? "bg-zinc-800/50 text-zinc-600 cursor-not-allowed"
                      : selectedTime === slot.time
                        ? "bg-emerald-500 text-white"
                        : "bg-zinc-800 text-white hover:bg-zinc-700"
                  )}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {submitError && (
        <p className="mt-4 text-red-400 text-sm">{submitError}</p>
      )}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!selectedDate || !selectedTime || submitLoading}
        className="mt-6 w-full rounded-2xl bg-(--brand-primary) py-4 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 btn-haptic transition"
      >
        {submitLoading ? (
          <>
            <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            กำลังดำเนินการ...
          </>
        ) : (
          "ยืนยันการเลื่อนนัด"
        )}
      </button>
  </PageTransition>
  );
}
