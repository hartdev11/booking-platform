"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBookingFlowStore } from "@/stores/bookingFlowStore";
import { useTenantServices } from "@/hooks/useTenantServices";
import { useToastStore } from "@/stores/toastStore";
import { PageTransition } from "@/components/ui/PageTransition";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils/cn";

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

const confirmSchema = z.object({
  phone: z
    .string()
    .min(1, "กรุณากรอกเบอร์โทรศัพท์")
    .regex(/^0\d{2}-?\d{3}-?\d{4}$/, "รูปแบบเบอร์โทร 0XX-XXX-XXXX"),
  notes: z.string().max(200).optional(),
});

type ConfirmForm = z.infer<typeof confirmSchema>;

export default function BookingConfirmPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;
  const {
    tenantId: storeTenantId,
    customerId,
    lineProfile,
    selectedDate,
    selectedTime,
    selectedServiceId,
    selectedServiceName,
    selectedStaffId,
    selectedStaffName,
  } = useBookingFlowStore();
  const effectiveTenantId = storeTenantId ?? tenantId;
  const { services } = useTenantServices(effectiveTenantId);
  const selectedService = services.find((s) => s.id === selectedServiceId);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConfirmForm>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { phone: "", notes: "" },
  });

  const onSubmit = async (form: ConfirmForm) => {
    if (
      !selectedDate ||
      !selectedTime ||
      !selectedServiceId ||
      !selectedServiceName ||
      !selectedStaffId ||
      !selectedStaffName ||
      !customerId ||
      !lineProfile
    ) {
      setSubmitError("ข้อมูลการจองไม่ครบ กรุณากลับไปเลือกใหม่");
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/customer/${tenantId}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          customerName: lineProfile.displayName,
          customerLineId: lineProfile.userId,
          customerPhone: form.phone.replace(/-/g, "").replace(/\s/g, ""),
          serviceId: selectedServiceId,
          serviceName: selectedServiceName,
          staffId: selectedStaffId,
          staffName: selectedStaffName,
          date: selectedDate,
          startTime: selectedTime,
          notes: form.notes ?? "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "เกิดข้อผิดพลาด";
        setSubmitError(msg);
        useToastStore.getState().error(msg);
        return;
      }
      useToastStore.getState().success("จองสำเร็จ");
      router.push(`/booking/${tenantId}/success`);
    } catch {
      const msg = "เกิดข้อผิดพลาด กรุณาลองใหม่";
      setSubmitError(msg);
      useToastStore.getState().error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const staffDisplay = selectedStaffId === "any" ? "ไม่ระบุ" : selectedStaffName;

  if (
    !selectedDate ||
    !selectedTime ||
    !selectedServiceId ||
    !selectedStaffId
  ) {
    return (
      <PageTransition className="flex flex-col min-h-full p-6">
        <EmptyState
          title="กรุณาเลือกข้อมูลการจองให้ครบ"
          actionLabel="กลับไปเลือกพนักงาน"
          onAction={() => router.push(`/booking/${tenantId}/staff`)}
        />
      </PageTransition>
    );
  }

  return (
    <PageTransition className="flex flex-col min-h-full p-6 pb-8 safe-area-bottom">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/booking/${tenantId}/staff`}
          className="text-(--text-secondary) hover:text-(--text-primary) text-sm transition"
        >
          ← กลับ
        </Link>
      </div>

      <h1 className="text-xl font-semibold text-(--text-primary) mb-6">ยืนยันการจอง</h1>

      <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-tertiary) p-4 space-y-4 mb-6">
        <div>
          <p className="text-xs text-(--text-muted) mb-0.5">บริการ</p>
          <p className="text-(--text-primary) font-medium">{selectedServiceName}</p>
          {selectedService && (
            <p className="text-(--text-secondary) text-sm">
              {selectedService.durationMinutes} นาที · ฿{selectedService.price.toLocaleString()}
            </p>
          )}
        </div>
        <div>
          <p className="text-xs text-(--text-muted) mb-0.5">พนักงาน</p>
          <p className="text-(--text-primary)">{staffDisplay}</p>
        </div>
        <div>
          <p className="text-xs text-(--text-muted) mb-0.5">วันที่</p>
          <p className="text-(--text-primary)">{formatThaiDate(selectedDate)}</p>
        </div>
        <div>
          <p className="text-xs text-(--text-muted) mb-0.5">เวลา</p>
          <p className="text-(--text-primary)">{selectedTime}</p>
        </div>
      </div>

      {lineProfile && (
        <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-(--surface-tertiary) border border-(--border-subtle)">
          <div className="w-12 h-12 rounded-full bg-(--surface-secondary) overflow-hidden shrink-0">
            {lineProfile.pictureUrl ? (
              <img
                src={lineProfile.pictureUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-(--text-muted) text-lg">
                {lineProfile.displayName.slice(0, 1)}
              </span>
            )}
          </div>
          <p className="text-(--text-primary) font-medium truncate">{lineProfile.displayName}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="phone" className="block text-sm text-(--text-secondary) mb-1.5">
            เบอร์โทรศัพท์ <span className="text-(--error)">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="0XX-XXX-XXXX"
            className={cn(
              "w-full rounded-xl border bg-(--surface-secondary) px-4 py-3 text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 transition",
              errors.phone ? "border-(--error) focus:ring-(--error)/30" : "border-(--border-default) focus:ring-(--brand-primary)/30"
            )}
            {...register("phone")}
          />
          {errors.phone && (
            <p className="mt-1 text-(--error) text-sm">{errors.phone.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm text-(--text-secondary) mb-1.5">
            หมายเหตุ (ไม่บังคับ)
          </label>
          <textarea
            id="notes"
            rows={3}
            maxLength={200}
            placeholder="เช่น ต้องการนัดเวลาเร่งด่วน"
            className="w-full rounded-xl border border-(--border-default) bg-(--surface-secondary) px-4 py-3 text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--brand-primary)/30 resize-none transition"
            {...register("notes")}
          />
          <p className="mt-1 text-xs text-(--text-muted)">สูงสุด 200 ตัวอักษร</p>
        </div>

        {submitError && (
          <p className="text-(--error) text-sm">{submitError}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-(--brand-primary) py-4 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 btn-haptic transition"
        >
          {submitting ? (
            <>
              <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              กำลังส่ง...
            </>
          ) : (
            "ยืนยันการจอง"
          )}
        </button>
      </form>
  </PageTransition>
  );
}
