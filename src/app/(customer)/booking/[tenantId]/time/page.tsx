"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useBookingFlowStore } from "@/stores/bookingFlowStore";
import { useAvailableSlots } from "@/hooks/useAvailability";
import { getStaffList } from "@/lib/firebase/staff";
import { getServices } from "@/lib/firebase/services";
import { PageTransition } from "@/components/ui/PageTransition";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils/cn";

export default function BookingTimePage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;
  const {
    tenantId: storeTenantId,
    selectedDate,
    selectedTime,
    selectedStaffId,
    selectedServiceId,
    setTime,
    setStaff,
    setService,
  } = useBookingFlowStore();

  const effectiveTenantId = storeTenantId ?? tenantId;
  const effectiveStaffId = selectedStaffId;
  const effectiveServiceId = selectedServiceId;

  useEffect(() => {
    if (!effectiveTenantId || !selectedDate) return;
    if (effectiveStaffId && effectiveServiceId) return;
    Promise.all([getStaffList(effectiveTenantId), getServices(effectiveTenantId)]).then(
      ([staffList, services]) => {
        const staff = staffList.filter((s) => s.isActive);
        const svc = services.filter((s) => s.isActive);
        if (staff.length === 1 && !effectiveStaffId) setStaff(staff[0].id, staff[0].name);
        if (svc.length === 1 && !effectiveServiceId) setService(svc[0].id, svc[0].name);
      }
    );
  }, [effectiveTenantId, selectedDate, effectiveStaffId, effectiveServiceId, setStaff, setService]);

  const staffIdToUse = effectiveStaffId;
  const serviceIdToUse = effectiveServiceId;

  const { slots, loading, error } = useAvailableSlots(
    effectiveTenantId,
    staffIdToUse,
    serviceIdToUse,
    selectedDate
  );

  const [picked, setPicked] = useState<string | null>(selectedTime);

  const handleNext = () => {
    if (picked) {
      setTime(picked);
      router.push(`/booking/${tenantId}/service`);
    }
  };

  if (!selectedDate) {
    return (
      <PageTransition className="flex flex-col min-h-full p-6">
        <EmptyState
          title="กรุณาเลือกวันที่ก่อน"
          actionLabel="กลับไปเลือกวันที่"
          onAction={() => router.push(`/booking/${tenantId}/date`)}
        />
      </PageTransition>
    );
  }

  if (!staffIdToUse || !serviceIdToUse) {
    return (
      <PageTransition className="flex flex-col min-h-full p-6">
        <EmptyState
          title="ไม่พบข้อมูลบริการหรือพนักงาน"
          actionLabel="กลับหน้าแรก"
          onAction={() => router.push(`/booking/${tenantId}`)}
        />
      </PageTransition>
    );
  }

  return (
    <PageTransition className="flex flex-col min-h-full p-6 pb-8 safe-area-bottom">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/booking/${tenantId}/date`}
          className="text-(--text-secondary) hover:text-(--text-primary) text-sm transition"
        >
          ← กลับ
        </Link>
        <span className="text-xs text-(--text-muted)">ขั้นตอน 2/4</span>
      </div>

      <h1 className="text-xl font-semibold text-(--text-primary) mb-1">เลือกเวลา</h1>
      <p className="text-(--text-secondary) text-sm mb-6">วันที่ {selectedDate}</p>

      {error && (
        <div className="rounded-xl bg-(--error)/10 border border-(--error)/20 text-(--error) text-sm p-4 mb-4 flex items-center justify-between gap-3">
          <span>{error.message}</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="shrink-0 rounded-lg px-3 py-1.5 bg-(--error)/20 font-medium hover:bg-(--error)/30 transition"
          >
            ลองใหม่
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 flex-1 content-start">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} variant="button" className="w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 flex-1 content-start">
          {slots.map((slot) => (
            <button
              key={slot.time}
              type="button"
              onClick={() => slot.isAvailable && setPicked(slot.time)}
              disabled={!slot.isAvailable}
              className={cn(
                "rounded-xl py-3 px-4 text-sm font-medium transition btn-haptic",
                !slot.isAvailable
                  ? "bg-(--surface-tertiary) text-(--text-muted) cursor-not-allowed"
                  : picked === slot.time
                    ? "bg-(--brand-primary) text-white"
                    : "bg-(--surface-tertiary) text-(--text-primary) hover:bg-(--border-default)"
              )}
            >
              {slot.time}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleNext}
        disabled={!picked}
        className="mt-6 w-full rounded-2xl bg-(--brand-primary) py-4 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed btn-haptic transition"
      >
        ถัดไป
      </button>
    </PageTransition>
  );
}
