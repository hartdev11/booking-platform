"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useBookingFlowStore } from "@/stores/bookingFlowStore";
import { useTenantServices } from "@/hooks/useTenantServices";
import { PageTransition } from "@/components/ui/PageTransition";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils/cn";

const emptyServicesIcon = (
  <svg className="w-16 h-16 text-(--text-muted) opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

export default function BookingServicePage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;
  const { tenantId: storeTenantId, selectedServiceId, setService } =
    useBookingFlowStore();
  const effectiveTenantId = storeTenantId ?? tenantId;
  const { services, loading, error } = useTenantServices(effectiveTenantId);
  const [picked, setPicked] = useState<string | null>(selectedServiceId);

  const handleNext = () => {
    const service = services.find((s) => s.id === picked);
    if (service) {
      setService(service.id, service.name);
      router.push(`/booking/${tenantId}/staff`);
    }
  };

  return (
    <PageTransition className="flex flex-col min-h-full p-6 pb-8 safe-area-bottom">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/booking/${tenantId}/time`}
          className="text-(--text-secondary) hover:text-(--text-primary) text-sm transition"
        >
          ← กลับ
        </Link>
        <span className="text-xs text-(--text-muted)">ขั้นตอน 3/4</span>
      </div>

      <h1 className="text-xl font-semibold text-(--text-primary) mb-1">เลือกบริการ</h1>
      <p className="text-(--text-secondary) text-sm mb-6">เลือกบริการที่ต้องการ</p>

      {error && (
        <div className="rounded-xl bg-(--error)/10 border border-(--error)/20 text-(--error) text-sm p-4 mb-4 flex items-center justify-between gap-3">
          <span>{error.message}</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="shrink-0 rounded-lg px-3 py-1.5 bg-(--error)/20 font-medium hover:bg-(--error)/30 transition btn-haptic"
          >
            ลองใหม่
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : services.length === 0 ? (
        <EmptyState
          title="ไม่มีบริการในขณะนี้"
          actionLabel="กลับหน้าแรก"
          onAction={() => router.push(`/booking/${tenantId}`)}
          icon={emptyServicesIcon}
          className="flex-1"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 content-start">
          {services.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => setPicked(service.id)}
              className={cn(
                "rounded-2xl border-2 overflow-hidden text-left transition btn-haptic",
                picked === service.id
                  ? "border-(--brand-primary) bg-(--brand-primary)/10"
                  : "border-(--border-subtle) bg-(--surface-tertiary) hover:border-(--border-default)"
              )}
            >
              <div className="aspect-4/3 bg-(--surface-secondary) relative">
                {service.imageUrl ? (
                  <img
                    src={service.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-(--text-muted) text-2xl">
                    {service.name.slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-(--text-primary) mb-1">{service.name}</h3>
                <p className="text-(--text-secondary) text-sm">
                  {service.durationMinutes} นาที · ฿{service.price.toLocaleString()}
                </p>
              </div>
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
