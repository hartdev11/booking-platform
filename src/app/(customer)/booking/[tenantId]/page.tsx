"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  isLoggedIn,
  login,
  getLiffProfile,
} from "@/lib/line/liff";
import { getOrCreateCustomer } from "@/lib/firebase/customers";
import { getTenant } from "@/lib/firebase/tenants";
import { useBookingFlowStore } from "@/stores/bookingFlowStore";
import type { TenantPublic } from "@/lib/firebase/tenants";
import { PageTransition } from "@/components/ui/PageTransition";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils/cn";

const emptyIcon = (
  <svg className="w-16 h-16 text-(--text-muted) opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

export default function BookingEntryPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const { setLineProfile, lineProfile } = useBookingFlowStore();
  const [tenant, setTenant] = useState<TenantPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    getTenant(tenantId)
      .then(setTenant)
      .catch(() => setError("ไม่พบร้าน"))
      .finally(() => setLoading(false));
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId || !isLoggedIn()) return;
    getLiffProfile()
      .then((profile) => {
        if (profile) {
          setLineProfile({
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
          });
          return getOrCreateCustomer(tenantId, profile.userId, profile);
        }
      })
      .then((customer) => {
        if (customer) {
          useBookingFlowStore.setState({
            tenantId,
            customerId: customer.id,
          });
        }
      })
      .catch(() => {});
  }, [tenantId, setLineProfile]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col p-6">
        <div className="flex flex-col items-center flex-1 justify-center gap-6">
          <Skeleton variant="card" className="w-24 h-24 rounded-2xl" />
          <div className="w-full max-w-xs space-y-2 text-center">
            <div className="h-6 bg-(--surface-tertiary) rounded animate-shimmer mx-auto w-32" />
            <div className="h-4 bg-(--surface-tertiary) rounded animate-shimmer mx-auto w-48" />
          </div>
          <div className="w-full max-w-sm space-y-3">
            <div className="h-14 rounded-2xl bg-(--surface-tertiary) animate-shimmer" />
            <div className="h-14 rounded-2xl bg-(--surface-tertiary) animate-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <PageTransition className="flex-1 flex flex-col p-6">
        <EmptyState
          title="ไม่พบร้าน"
          description={error ?? "กรุณาตรวจสอบลิงก์อีกครั้ง"}
          actionLabel="ลองใหม่"
          onAction={() => window.location.reload()}
          icon={emptyIcon}
          className="flex-1"
        />
      </PageTransition>
    );
  }

  if (!isLoggedIn()) {
    return (
      <PageTransition className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-2xl bg-(--surface-tertiary) mb-6 flex items-center justify-center overflow-hidden ring-2 ring-(--brand-primary)/30">
          {tenant.logoUrl ? (
            <img src={tenant.logoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl text-(--text-muted)">{tenant.name.slice(0, 1)}</span>
          )}
        </div>
        <h1 className="text-xl font-semibold text-(--text-primary) text-center mb-2">
          {tenant.name}
        </h1>
        <p className="text-(--text-secondary) text-sm text-center mb-8">
          เข้าสู่ระบบด้วย Line เพื่อจองคิว
        </p>
        <button
          type="button"
          onClick={login}
          className="w-full max-w-xs rounded-full bg-[#06C755] py-4 px-6 text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 btn-haptic transition"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.647 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
          </svg>
          เข้าสู่ระบบด้วย Line
        </button>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="flex-1 flex flex-col p-6">
      <div className="flex flex-col items-center flex-1 justify-center">
        <div
          className={cn(
            "w-24 h-24 rounded-2xl bg-(--surface-tertiary) mb-6 flex items-center justify-center overflow-hidden ring-2 ring-(--brand-primary)/30",
            "transition-transform duration-300"
          )}
        >
          {tenant.logoUrl ? (
            <img src={tenant.logoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl text-(--text-muted) font-medium">
              {tenant.name.slice(0, 1)}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-(--text-primary) text-center mb-1">
          {tenant.name}
        </h1>
        <p className="text-(--text-secondary) text-sm text-center mb-10">
          ยินดีต้อนรับ{lineProfile?.displayName ? ` ${lineProfile.displayName}` : ""}
        </p>
        <div className="w-full max-w-sm space-y-3">
          <Link
            href={`/booking/${tenantId}/date`}
            className="block w-full rounded-2xl bg-(--brand-primary) py-4 px-6 text-center text-white font-semibold text-lg hover:opacity-90 btn-haptic transition shadow-lg"
          >
            จองคิว
          </Link>
          <Link
            href={`/booking/${tenantId}/status`}
            className="block w-full rounded-2xl border-2 border-(--border-default) py-4 px-6 text-center text-(--text-primary) font-medium hover:bg-(--surface-tertiary) btn-haptic transition"
          >
            ตรวจสอบการจอง
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
