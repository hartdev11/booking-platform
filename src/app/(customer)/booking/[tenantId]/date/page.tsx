"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useBookingFlowStore } from "@/stores/bookingFlowStore";
import { useAvailableDates } from "@/hooks/useAvailability";
import { PageTransition } from "@/components/ui/PageTransition";
import { Skeleton } from "@/components/ui/Skeleton";
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
      <h3 className="text-sm font-medium text-(--text-secondary) mb-3">{monthName}</h3>
      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="h-8 flex items-center justify-center text-xs text-(--text-muted)"
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
                  "w-full h-full rounded-lg text-sm font-medium transition btn-haptic",
                  !cell.isAvailable || cell.isPast
                    ? "text-(--text-muted) bg-(--surface-tertiary) cursor-not-allowed"
                    : selectedDate === cell.date
                      ? "bg-(--brand-primary) text-white"
                      : "text-(--text-primary) bg-(--surface-tertiary) hover:bg-(--border-default)"
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

export default function BookingDatePage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;
  const { tenantId: storeTenantId, selectedDate, setDate } = useBookingFlowStore();

  const now = useMemo(() => new Date(), []);
  const currentMonth = useMemo(
    () => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    [now]
  );
  const nextMonth = useMemo(() => {
    const n = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  }, [now]);

  const { availableDates: dates1, loading: loading1 } = useAvailableDates(
    storeTenantId ?? tenantId,
    null,
    currentMonth
  );
  const { availableDates: dates2, loading: loading2 } = useAvailableDates(
    storeTenantId ?? tenantId,
    null,
    nextMonth
  );

  const [picked, setPicked] = useState<string | null>(selectedDate);

  useEffect(() => {
    setPicked(selectedDate);
  }, [selectedDate]);

  const handleNext = () => {
    if (picked) {
      setDate(picked);
      router.push(`/booking/${tenantId}/time`);
    }
  };

  const [y1, m1] = currentMonth.split("-").map(Number);
  const [y2, m2] = nextMonth.split("-").map(Number);

  return (
    <PageTransition className="flex flex-col min-h-full p-6 pb-8 safe-area-bottom">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/booking/${tenantId}`}
          className="text-(--text-secondary) hover:text-(--text-primary) text-sm transition"
        >
          ← กลับ
        </Link>
        <span className="text-xs text-(--text-muted)">ขั้นตอน 1/4</span>
      </div>

      <h1 className="text-xl font-semibold text-(--text-primary) mb-1">เลือกวันที่</h1>
      <p className="text-(--text-secondary) text-sm mb-6">เลือกวันที่ต้องการจอง</p>

      {(loading1 || loading2) ? (
        <div className="flex-1 flex flex-col gap-8">
          <div className="space-y-3">
            <Skeleton variant="text" className="h-4 w-24" />
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} variant="card" className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton variant="text" className="h-4 w-28" />
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} variant="card" className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <CalendarMonth
            year={y1}
            month={m1}
            availableDates={dates1}
            selectedDate={picked}
            onSelect={setPicked}
          />
          <CalendarMonth
            year={y2}
            month={m2}
            availableDates={dates2}
            selectedDate={picked}
            onSelect={setPicked}
          />
        </>
      )}

      <button
        type="button"
        onClick={handleNext}
        disabled={!picked}
        className="mt-auto w-full rounded-2xl bg-(--brand-primary) py-4 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed btn-haptic transition"
      >
        ถัดไป
      </button>
    </PageTransition>
  );
}
