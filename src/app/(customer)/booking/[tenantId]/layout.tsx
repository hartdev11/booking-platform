"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { initializeLiff, getLiffProfile, isLoggedIn } from "@/lib/line/liff";
import { useBookingFlowStore } from "@/stores/bookingFlowStore";
import { cn } from "@/lib/utils/cn";

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const setLineProfile = useBookingFlowStore((s) => s.setLineProfile);
  const [liffReady, setLiffReady] = useState(false);
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

  useEffect(() => {
    if (!liffId || !tenantId) {
      setLiffReady(true);
      return;
    }
    initializeLiff(liffId)
      .then(() => {
        if (isLoggedIn()) {
          return getLiffProfile().then((profile) => {
            if (profile) {
              setLineProfile({
                userId: profile.userId,
                displayName: profile.displayName,
                pictureUrl: profile.pictureUrl,
              });
            }
          });
        }
      })
      .catch(() => {})
      .finally(() => setLiffReady(true));
  }, [liffId, tenantId, setLineProfile]);

  return (
    <div
      className="min-h-screen flex flex-col bg-(--surface-primary) text-(--text-primary) safe-area-top safe-area-bottom safe-area-x"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
      }}
    >
      {!liffReady ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-4">
            <div
              className={cn(
                "w-12 h-12 rounded-full border-2 border-(--brand-primary) border-t-transparent animate-spin"
              )}
            />
            <p className="text-(--text-secondary) text-sm">กำลังโหลด...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
