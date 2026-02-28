"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  createService,
  updateService,
  type CreateServiceData,
  type UpdateServiceData,
} from "@/lib/firebase/services";
import { uploadServiceImage } from "@/lib/firebase/storage";
import { cn } from "@/lib/utils/cn";
import type { Service } from "@/types";

const schema = z.object({
  name: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
  description: z.string(),
  durationMinutes: z
    .number()
    .min(15, "ระยะเวลาต้องอย่างน้อย 15 นาที")
    .max(480, "ระยะเวลาไม่เกิน 480 นาที"),
  price: z.number().min(0, "ราคาต้องไม่ต่ำกว่า 0"),
  imageUrl: z
    .string()
    .optional()
    .refine((v) => !v || v === "" || /^https?:\/\/.+/.test(v), "รูปแบบ URL ไม่ถูกต้อง"),
});

type FormData = z.infer<typeof schema>;

interface ServiceModalProps {
  tenantId: string;
  service: Service | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ServiceModal({
  tenantId,
  service,
  onClose,
  onSuccess,
}: ServiceModalProps) {
  const isEdit = !!service;
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: service
      ? {
          name: service.name,
          description: service.description,
          durationMinutes: service.durationMinutes,
          price: service.price,
          imageUrl: service.imageUrl || "",
        }
      : {
          name: "",
          description: "",
          durationMinutes: 60,
          price: 0,
          imageUrl: "",
        },
  });

  const imageUrl = watch("imageUrl");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (isEdit) {
      setUploading(true);
      try {
        const url = await uploadServiceImage(tenantId, service.id, file);
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

  async function onSubmit(data: FormData) {
    try {
      if (isEdit) {
        const updateData: UpdateServiceData = {
          name: data.name,
          description: data.description,
          durationMinutes: data.durationMinutes,
          price: data.price,
          imageUrl: data.imageUrl?.trim() || "",
        };
        await updateService(tenantId, service.id, updateData);
      } else {
        const initialImageUrl = pendingFile ? "" : (data.imageUrl?.trim() || "");
        const createData: CreateServiceData = {
          name: data.name,
          description: data.description,
          durationMinutes: data.durationMinutes,
          price: data.price,
          imageUrl: initialImageUrl,
          isActive: true,
        };
        const id = await createService(tenantId, createData);
        if (pendingFile) {
          const url = await uploadServiceImage(tenantId, id, pendingFile);
          await updateService(tenantId, id, { imageUrl: url });
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-(--border-default) bg-(--surface-secondary) shadow-2xl animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-(--border-subtle)">
          <h2 className="text-lg font-semibold text-(--text-primary)">
            {isEdit ? "แก้ไขบริการ" : "เพิ่มบริการ"}
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
              ชื่อบริการ *
            </label>
            {errors.name && (
              <p className="text-(--error) text-xs mt-1">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-(--text-secondary) mb-1">
              คำอธิบาย
            </label>
            <textarea
              rows={3}
              className={cn(
                "w-full rounded-lg border bg-(--surface-tertiary) px-4 py-2.5 text-(--text-primary) placeholder-(--text-muted) outline-none focus:ring-2 focus:ring-(--brand-primary)/50 focus:border-(--brand-primary) resize-none transition",
                errors.description ? "border-(--error)" : "border-(--border-default)"
              )}
              placeholder="รายละเอียดบริการ"
              {...register("description")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-(--text-secondary) mb-1">
                ระยะเวลา (นาที) *
              </label>
              <input
                type="number"
                min={15}
                max={480}
                step={15}
                className={cn(
                  "w-full rounded-lg border bg-(--surface-tertiary) px-4 py-2.5 text-(--text-primary) outline-none focus:ring-2 focus:ring-(--brand-primary)/50 focus:border-(--brand-primary) transition",
                  errors.durationMinutes ? "border-(--error)" : "border-(--border-default)"
                )}
                {...register("durationMinutes", { valueAsNumber: true })}
              />
              {errors.durationMinutes && (
                <p className="text-(--error) text-xs mt-1">
                  {errors.durationMinutes.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-(--text-secondary) mb-1">
                ราคา (บาท) *
              </label>
              <input
                type="number"
                min={0}
                step={1}
                className={cn(
                  "w-full rounded-lg border bg-(--surface-tertiary) px-4 py-2.5 text-(--text-primary) outline-none focus:ring-2 focus:ring-(--brand-primary)/50 focus:border-(--brand-primary) transition",
                  errors.price ? "border-(--error)" : "border-(--border-default)"
                )}
                {...register("price", { valueAsNumber: true })}
              />
              {errors.price && (
                <p className="text-(--error) text-xs mt-1">
                  {errors.price.message}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-(--text-secondary) mb-1">
              รูปภาพ
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className={cn(
                  "flex-1 rounded-lg border bg-(--surface-tertiary) px-4 py-2.5 text-(--text-primary) placeholder-(--text-muted) outline-none focus:ring-2 focus:ring-(--brand-primary)/50 focus:border-(--brand-primary) transition",
                  errors.imageUrl ? "border-(--error)" : "border-(--border-default)"
                )}
                placeholder="URL รูปภาพ หรืออัปโหลดด้านล่าง"
                {...register("imageUrl")}
              />
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
                className="rounded-lg border border-(--border-default) px-4 py-2.5 text-sm text-(--text-secondary) hover:bg-(--surface-tertiary) disabled:opacity-50 transition"
              >
                {uploading ? "กำลังอัปโหลด..." : "อัปโหลด"}
              </button>
            </div>
            {errors.imageUrl && (
              <p className="text-(--error) text-xs mt-1">
                {errors.imageUrl.message}
              </p>
            )}
            {imageUrl && (
              <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border border-(--border-default)">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="object-cover w-full h-full"
                />
              </div>
            )}
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
