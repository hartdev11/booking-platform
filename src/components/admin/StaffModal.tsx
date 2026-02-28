"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  createStaff,
  updateStaff,
  type CreateStaffData,
  type UpdateStaffData,
} from "@/lib/firebase/staff";
import { uploadStaffImage } from "@/lib/firebase/storage";
import { getServices } from "@/lib/firebase/services";
import { cn } from "@/lib/utils/cn";
import type { Staff, Service } from "@/types";

const DAY_LABELS: { value: number; label: string }[] = [
  { value: 1, label: "จันทร์" },
  { value: 2, label: "อังคาร" },
  { value: 3, label: "พุธ" },
  { value: 4, label: "พฤหัส" },
  { value: 5, label: "ศุกร์" },
  { value: 6, label: "เสาร์" },
  { value: 0, label: "อาทิตย์" },
];

const schema = z
  .object({
    name: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
    imageUrl: z.string(),
    serviceIds: z.array(z.string()),
    workDays: z.array(z.number()),
    workStartTime: z.string().regex(/^\d{2}:\d{2}$/, "รูปแบบเวลาไม่ถูกต้อง"),
    workEndTime: z.string().regex(/^\d{2}:\d{2}$/, "รูปแบบเวลาไม่ถูกต้อง"),
  })
  .refine((d) => d.workEndTime > d.workStartTime, {
    message: "เวลาสิ้นสุดต้องหลังเวลาเริ่มต้น",
    path: ["workEndTime"],
  });

type FormData = z.infer<typeof schema>;

interface StaffModalProps {
  tenantId: string;
  staff: Staff | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function StaffModal({
  tenantId,
  staff,
  onClose,
  onSuccess,
}: StaffModalProps) {
  const isEdit = !!staff;
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: staff
      ? {
          name: staff.name,
          imageUrl: staff.imageUrl || "",
          serviceIds: staff.serviceIds ?? [],
          workDays: staff.workDays ?? [],
          workStartTime: staff.workStartTime ?? "09:00",
          workEndTime: staff.workEndTime ?? "18:00",
        }
      : {
          name: "",
          imageUrl: "",
          serviceIds: [],
          workDays: [],
          workStartTime: "09:00",
          workEndTime: "18:00",
        },
  });

  const imageUrl = watch("imageUrl");
  const serviceIds = watch("serviceIds");
  const workDays = watch("workDays");

  useEffect(() => {
    getServices(tenantId).then(setServices);
  }, [tenantId]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (isEdit) {
      setUploading(true);
      try {
        const url = await uploadStaffImage(tenantId, staff.id, file);
        setValue("imageUrl", url);
      } catch {
        setValue("imageUrl", "");
      } finally {
        setUploading(false);
      }
    } else {
      setPendingFile(file);
      setValue("imageUrl", URL.createObjectURL(file));
    }
    e.target.value = "";
  }

  function toggleService(id: string) {
    if (serviceIds.includes(id)) {
      setValue(
        "serviceIds",
        serviceIds.filter((s) => s !== id)
      );
    } else {
      setValue("serviceIds", [...serviceIds, id]);
    }
  }

  function toggleWorkDay(day: number) {
    if (workDays.includes(day)) {
      setValue(
        "workDays",
        workDays.filter((d) => d !== day)
      );
    } else {
      setValue("workDays", [...workDays, day]);
    }
  }

  async function onSubmit(data: FormData) {
    try {
      if (isEdit) {
        const updateData: UpdateStaffData = {
          name: data.name,
          imageUrl: data.imageUrl?.trim() || "",
          serviceIds: data.serviceIds,
          workDays: data.workDays,
          workStartTime: data.workStartTime,
          workEndTime: data.workEndTime,
        };
        await updateStaff(tenantId, staff.id, updateData);
      } else {
        const initialImageUrl = pendingFile ? "" : (data.imageUrl?.trim() || "");
        const createData: CreateStaffData = {
          name: data.name,
          imageUrl: initialImageUrl,
          serviceIds: data.serviceIds,
          workDays: data.workDays,
          workStartTime: data.workStartTime,
          workEndTime: data.workEndTime,
          isActive: true,
        };
        const id = await createStaff(tenantId, createData);
        if (pendingFile) {
          const url = await uploadStaffImage(tenantId, id, pendingFile);
          await updateStaff(tenantId, id, { imageUrl: url });
        }
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg my-8 rounded-2xl border border-(--border-default) bg-(--surface-secondary) shadow-2xl animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-(--border-subtle)">
          <h2 className="text-lg font-semibold text-(--text-primary)">
            {isEdit ? "แก้ไขพนักงาน" : "เพิ่มพนักงาน"}
          </h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="relative">
            <input
              type="text"
              className={cn(
                "peer w-full rounded-lg border bg-(--surface-tertiary) pt-5 px-4 pb-2 text-(--text-primary) placeholder-transparent outline-none focus:ring-2 focus:ring-(--brand-primary)/50 focus:border-(--brand-primary) transition",
                errors.name ? "border-(--error)" : "border-(--border-default)"
              )}
              placeholder=" "
              {...register("name")}
            />
            <label className="absolute left-4 top-1/2 -translate-y-1/2 text-(--text-muted) text-sm transition-all duration-200 pointer-events-none peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-(--brand-primary) peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs">
              ชื่อ *
            </label>
            {errors.name && (
              <p className="text-(--error) text-xs mt-1">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-(--text-secondary) mb-1">
              รูปภาพ
            </label>
            <div className="flex gap-2 items-center">
              <div className="w-16 h-16 rounded-full bg-(--surface-tertiary) overflow-hidden shrink-0 border border-(--border-default)">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-(--text-muted) text-xs">
                    ไม่มีรูป
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded-lg border border-(--border-default) px-4 py-2 text-sm text-(--text-secondary) hover:bg-(--surface-tertiary) disabled:opacity-50 transition"
              >
                {uploading ? "กำลังอัปโหลด..." : "อัปโหลดรูป"}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-(--text-secondary) mb-2">
              บริการที่รับ
            </label>
            <div className="flex flex-wrap gap-2">
              {services.map((s) => (
                <label
                  key={s.id}
                  className={cn(
                    "inline-flex items-center rounded-lg border px-3 py-1.5 text-sm cursor-pointer transition",
                    serviceIds.includes(s.id)
                      ? "border-(--brand-primary)/50 bg-(--brand-primary)/20 text-(--brand-primary)"
                      : "border-(--border-default) text-(--text-secondary) hover:bg-(--surface-tertiary)"
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={serviceIds.includes(s.id)}
                    onChange={() => toggleService(s.id)}
                  />
                  {s.name}
                </label>
              ))}
              {services.length === 0 && (
                <p className="text-(--text-muted) text-sm">ยังไม่มีบริการ</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-(--text-secondary) mb-2">
              วันทำงาน
            </label>
            <div className="flex flex-wrap gap-2">
              {DAY_LABELS.map(({ value, label }) => (
                <label
                  key={value}
                  className={cn(
                    "inline-flex items-center rounded-lg border px-3 py-1.5 text-sm cursor-pointer transition",
                    workDays.includes(value)
                      ? "border-(--brand-primary)/50 bg-(--brand-primary)/20 text-(--brand-primary)"
                      : "border-(--border-default) text-(--text-secondary) hover:bg-(--surface-tertiary)"
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={workDays.includes(value)}
                    onChange={() => toggleWorkDay(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-(--text-secondary) mb-1">
                เวลาเริ่ม *
              </label>
              <input
                type="time"
                className={cn(
                  "w-full rounded-lg border bg-(--surface-tertiary) px-4 py-2.5 text-(--text-primary) outline-none focus:ring-2 focus:ring-(--brand-primary)/50 focus:border-(--brand-primary) transition",
                  errors.workStartTime ? "border-(--error)" : "border-(--border-default)"
                )}
                {...register("workStartTime")}
              />
              {errors.workStartTime && (
                <p className="text-(--error) text-xs mt-1">
                  {errors.workStartTime.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-(--text-secondary) mb-1">
                เวลาสิ้นสุด *
              </label>
              <input
                type="time"
                className={cn(
                  "w-full rounded-lg border bg-(--surface-tertiary) px-4 py-2.5 text-(--text-primary) outline-none focus:ring-2 focus:ring-(--brand-primary)/50 focus:border-(--brand-primary) transition",
                  errors.workEndTime ? "border-(--error)" : "border-(--border-default)"
                )}
                {...register("workEndTime")}
              />
              {errors.workEndTime && (
                <p className="text-(--error) text-xs mt-1">
                  {errors.workEndTime.message}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-(--border-default) py-2.5 text-(--text-secondary) hover:bg-(--surface-tertiary) transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-(--brand-primary) py-2.5 text-white font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition"
            >
              {isSubmitting && (
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              )}
              {isSubmitting ? "กำลังบันทึก..." : isEdit ? "บันทึก" : "เพิ่ม"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
