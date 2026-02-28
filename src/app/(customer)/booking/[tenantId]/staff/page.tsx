"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useBookingFlowStore } from "@/stores/bookingFlowStore";
import { useTenantStaff } from "@/hooks/useTenantStaff";
import { useTenantServices } from "@/hooks/useTenantServices";
import { PageTransition } from "@/components/ui/PageTransition";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils/cn";

const ANY_STAFF_ID = "any";

const staffEmptyIcon = (
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
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);

export default function BookingStaffPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;
  const {
    tenantId: storeTenantId,
    selectedServiceId,
    selectedStaffId,
    setStaff,
  } = useBookingFlowStore();
  const effectiveTenantId = storeTenantId ?? tenantId;
  const { staffList, loading, error } = useTenantStaff(
    effectiveTenantId,
    selectedServiceId
  );
  const { services } = useTenantServices(effectiveTenantId);
  const serviceMap = useMemo(() => {
    const m: Record<string, string> = {};
    services.forEach((s) => (m[s.id] = s.name));
    return m;
  }, [services]);
  const [picked, setPicked] = useState<string | null>(
    selectedStaffId ?? null
  );

  useEffect(() => {
    setPicked(selectedStaffId ?? null);
  }, [selectedStaffId]);

  const handleNext = () => {
    if (picked === ANY_STAFF_ID) {
      setStaff(ANY_STAFF_ID, "ไม่ระบุ");
    } else {
      const staff = staffList.find((s) => s.id === picked);
      if (staff) setStaff(staff.id, staff.name);
    }
    router.push(`/booking/${tenantId}/confirm`);
  };

  if (!selectedServiceId) {
    return (
      <PageTransition>
        <div className="flex flex-col min-h-full p-6">
          <EmptyState
            title="กรุณาเลือกบริการก่อน"
            actionLabel="กลับไปเลือกบริการ"
            onAction={() => router.push(`/booking/${tenantId}/service`)}
          />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col min-h-full p-6 pb-8 safe-area-bottom">
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/booking/${tenantId}/service`}
            className="text-(--text-secondary) hover:text-(--text-primary) text-sm transition btn-haptic"
          >
            ← กลับ
          </Link>
          <span className="text-xs text-(--text-muted)">ขั้นตอน 4/4</span>
        </div>

        <h1 className="text-xl font-semibold text-(--text-primary) mb-1">
          เลือกพนักงาน
        </h1>
        <p className="text-(--text-secondary) text-sm mb-6">
          เลือกพนักงานหรือไม่ระบุก็ได้
        </p>

        {error && (
          <p className="text-(--error) text-sm mb-4">{error.message}</p>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="card" className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-3 flex-1">
            <button
              type="button"
              onClick={() => setPicked(ANY_STAFF_ID)}
              className={cn(
                "w-full rounded-2xl border-2 p-4 flex items-center gap-4 text-left transition btn-haptic",
                picked === ANY_STAFF_ID
                  ? "border-(--brand-primary) bg-(--brand-primary)/10"
                  : "border-(--border-default) bg-(--surface-secondary) hover:border-(--border-subtle)"
              )}
            >
              <div className="w-14 h-14 rounded-full bg-(--surface-tertiary) flex items-center justify-center shrink-0">
                <span className="text-(--text-muted) text-lg">?</span>
              </div>
              <div>
                <h3 className="font-semibold text-(--text-primary)">
                  ไม่ระบุ
                </h3>
                <p className="text-(--text-secondary) text-sm">
                  ให้ร้านจัดพนักงานให้
                </p>
              </div>
            </button>
            {staffList.length === 0 ? (
              <EmptyState
                title="ไม่มีพนักงานสำหรับบริการนี้"
                description="เลือกไม่ระบุหรือกลับไปเลือกบริการอื่น"
                icon={staffEmptyIcon}
              />
            ) : (
              staffList.map((staff) => (
                <button
                  key={staff.id}
                  type="button"
                  onClick={() => setPicked(staff.id)}
                  className={cn(
                    "w-full rounded-2xl border-2 p-4 flex items-center gap-4 text-left transition btn-haptic",
                    picked === staff.id
                      ? "border-(--brand-primary) bg-(--brand-primary)/10"
                      : "border-(--border-default) bg-(--surface-secondary) hover:border-(--border-subtle)"
                  )}
                >
                  <div className="w-14 h-14 rounded-full bg-(--surface-tertiary) overflow-hidden shrink-0 border-2 border-(--border-default)">
                    {staff.imageUrl ? (
                      <img
                        src={staff.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-(--text-muted) font-medium">
                        {staff.name.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-(--text-primary) truncate">
                      {staff.name}
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {staff.serviceIds.slice(0, 3).map((id) => (
                        <span
                          key={id}
                          className="rounded bg-(--surface-tertiary) px-2 py-0.5 text-xs text-(--text-secondary)"
                        >
                          {serviceMap[id] ?? id}
                        </span>
                      ))}
                      {staff.serviceIds.length > 3 && (
                        <span className="text-xs text-(--text-muted)">
                          +{staff.serviceIds.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
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
      </div>
    </PageTransition>
  );
}
