"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useStaff } from "@/hooks/useStaff";
import { useServices } from "@/hooks/useServices";
import {
  deleteStaff,
  toggleStaffStatus,
} from "@/lib/firebase/staff";
import { StaffModal } from "@/components/admin/StaffModal";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils/cn";
import type { Staff } from "@/types";

const DAY_LABELS: Record<number, string> = {
  0: "อา.",
  1: "จ.",
  2: "อ.",
  3: "พ.",
  4: "พฤ.",
  5: "ศ.",
  6: "ส.",
};

interface StaffPageClientProps {
  tenantId: string;
}

export function StaffPageClient({ tenantId }: StaffPageClientProps) {
  const { staffList, loading, error } = useStaff(tenantId);
  const { services } = useServices(tenantId);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const serviceMap = useMemo(() => {
    const m: Record<string, string> = {};
    services.forEach((s) => (m[s.id] = s.name));
    return m;
  }, [services]);

  const filtered = useMemo(() => {
    if (!search.trim()) return staffList;
    const q = search.trim().toLowerCase();
    return staffList.filter((s) => s.name.toLowerCase().includes(q));
  }, [staffList, search]);

  function handleEdit(s: Staff) {
    setEditingStaff(s);
    setModalOpen(true);
  }

  function handleAdd() {
    setEditingStaff(null);
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setEditingStaff(null);
  }

  async function handleToggle(s: Staff) {
    try {
      await toggleStaffStatus(tenantId, s.id);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(s: Staff) {
    if (!confirm(`ต้องการลบพนักงาน "${s.name}" ใช่หรือไม่?`)) return;
    setDeletingId(s.id);
    try {
      await deleteStaff(tenantId, s.id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  }

  if (!tenantId) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <p className="text-(--text-secondary)">ไม่พบ tenant</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <Link
              href="/admin/dashboard"
              className="text-sm text-(--text-secondary) hover:text-(--text-primary) mb-1 inline-block transition"
            >
              ← กลับ
            </Link>
            <h1 className="text-xl font-semibold text-(--text-primary)">
              Master พนักงาน
            </h1>
          </div>
          <button
            onClick={handleAdd}
            className="rounded-lg bg-(--brand-primary) px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition"
          >
            + เพิ่มพนักงาน
          </button>
        </div>

        <div className="mb-4">
          <input
            type="search"
            placeholder="ค้นหาชื่อพนักงาน..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72 rounded-lg border border-(--border-default) bg-(--surface-secondary) px-4 py-2.5 text-(--text-primary) placeholder-(--text-muted) outline-none focus:ring-2 focus:ring-(--brand-primary)/50 focus:border-(--brand-primary) transition"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-(--error)/10 border border-(--error)/20 text-(--error) text-sm p-4 mb-4">
            {error.message}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} variant="card" className="h-48" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-(--border-subtle) bg-(--surface-secondary) p-12 text-center">
            <p className="text-(--text-secondary) mb-2">
              {search.trim() ? "ไม่พบพนักงานที่ตรงกับคำค้น" : "ยังไม่มีพนักงาน"}
            </p>
            {!search.trim() && (
              <button
                onClick={handleAdd}
                className="text-(--brand-primary) hover:opacity-90 text-sm font-medium transition"
              >
                เพิ่มพนักงานคนแรก
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-(--border-subtle) bg-(--surface-secondary) p-5 flex flex-col hover:border-(--border-default) transition-colors"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-(--surface-tertiary) overflow-hidden shrink-0 border-2 border-(--border-default)">
                    {s.imageUrl ? (
                      <img
                        src={s.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-(--text-muted) text-sm">
                        ไม่มีรูป
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-(--text-primary) truncate">
                      {s.name}
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {s.serviceIds.slice(0, 3).map((id) => (
                        <span
                          key={id}
                          className="rounded bg-(--surface-tertiary) px-2 py-0.5 text-xs text-(--text-secondary)"
                        >
                          {serviceMap[id] ?? id}
                        </span>
                      ))}
                      {s.serviceIds.length > 3 && (
                        <span className="text-xs text-(--text-muted)">
                          +{s.serviceIds.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-(--text-muted) mb-3">
                  {s.workDays.length > 0 ? (
                    <span>
                      {s.workDays
                        .sort((a, b) => a - b)
                        .map((d) => DAY_LABELS[d])
                        .join(" ")}
                    </span>
                  ) : (
                    <span>ยังไม่ได้ตั้งวันทำงาน</span>
                  )}
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-(--border-subtle)">
                  <button
                    type="button"
                    onClick={() => handleToggle(s)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition",
                      s.isActive
                        ? "bg-(--success)/20 text-(--success)"
                        : "bg-(--surface-tertiary) text-(--text-muted)"
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        s.isActive ? "bg-(--success)" : "bg-(--text-muted)"
                      )}
                    />
                    {s.isActive ? "เปิด" : "ปิด"}
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(s)}
                      className="rounded-lg border border-(--border-default) px-3 py-1.5 text-sm text-(--text-secondary) hover:bg-(--surface-tertiary) transition"
                    >
                      แก้ไข
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s)}
                      disabled={deletingId === s.id}
                      className="rounded-lg border border-(--error)/40 px-3 py-1.5 text-sm text-(--error) hover:bg-(--error)/10 disabled:opacity-50 flex items-center gap-1.5 transition"
                    >
                      {deletingId === s.id ? (
                        <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      ) : null}
                      {deletingId === s.id ? "กำลังลบ..." : "ลบ"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <StaffModal
          tenantId={tenantId}
          staff={editingStaff}
          onClose={handleCloseModal}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
