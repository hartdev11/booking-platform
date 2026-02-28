"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useBookingFlowStore } from "@/stores/bookingFlowStore";
import { PageTransition } from "@/components/ui/PageTransition";

const THAI_DAYS = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
const THAI_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

function formatThaiDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  const dayName = THAI_DAYS[date.getDay()];
  const dayNum = date.getDate();
  const monthName = THAI_MONTHS[(m ?? 1) - 1];
  const buddhistYear = (y ?? 0) + 543;
  return `${dayName}ที่ ${dayNum} ${monthName} ${buddhistYear}`;
}

export default function BookingSuccessPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const {
    selectedDate,
    selectedTime,
    selectedServiceName,
    selectedStaffName,
    selectedStaffId,
    reset,
  } = useBookingFlowStore();

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  const staffDisplay = selectedStaffId === "any" ? "ไม่ระบุ" : selectedStaffName;

  return (
    <PageTransition>
      <div className="flex flex-col min-h-full p-6 pb-8 items-center safe-area-bottom">
        <div
          className="w-20 h-20 rounded-full bg-(--success)/20 flex items-center justify-center mb-6"
          style={{ animation: "booking-success-scale-in 0.4s ease-out" }}
        >
          <svg
            className="w-10 h-10 text-(--success) stroke-[2.5]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{
              strokeDasharray: 28,
              strokeDashoffset: 28,
              animation: "booking-success-check-draw 0.35s 0.2s ease-out forwards",
            }}
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-xl font-semibold text-(--text-primary) mb-1">
          จองสำเร็จ
        </h1>
        <p className="text-(--text-secondary) text-sm mb-6">
          รอการยืนยันจากร้าน
        </p>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-(--warning)/20 text-(--warning) text-xs font-medium px-3 py-1 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-(--warning)" />
          รอการยืนยัน
        </span>

        {selectedDate && selectedTime && (
          <div className="w-full max-w-sm rounded-2xl border border-(--border-default) bg-(--surface-secondary) p-4 space-y-3 mb-8">
            <div>
              <p className="text-xs text-(--text-muted)">บริการ</p>
              <p className="text-(--text-primary)">{selectedServiceName ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs text-(--text-muted)">พนักงาน</p>
              <p className="text-(--text-primary)">{staffDisplay ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs text-(--text-muted)">วันที่</p>
              <p className="text-(--text-primary)">{formatThaiDate(selectedDate)}</p>
            </div>
            <div>
              <p className="text-xs text-(--text-muted)">เวลา</p>
              <p className="text-(--text-primary)">{selectedTime}</p>
            </div>
          </div>
        )}

        <div className="w-full max-w-sm space-y-3">
          <Link
            href={`/booking/${tenantId}/status`}
            className="block w-full rounded-2xl bg-(--brand-primary) py-4 text-center text-white font-semibold hover:opacity-90 btn-haptic transition"
          >
            ตรวจสอบสถานะ
          </Link>
          <Link
            href={`/booking/${tenantId}`}
            className="block w-full rounded-2xl border-2 border-(--border-default) py-4 text-center text-(--text-primary) font-medium hover:bg-(--surface-secondary) btn-haptic transition"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
