"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useServices } from "@/hooks/useServices";
import {
  deleteService,
  toggleServiceStatus,
} from "@/lib/firebase/services";
import { ServiceModal } from "@/components/admin/ServiceModal";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils/cn";
import type { Service } from "@/types";

const PAGE_SIZE = 10;

interface ServicesPageClientProps {
  tenantId: string;
}

export function ServicesPageClient({ tenantId }: ServicesPageClientProps) {
  const { services, loading, error } = useServices(tenantId);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search.trim()) return [...services];
    const q = search.trim().toLowerCase();
    return services.filter((s) => s.name.toLowerCase().includes(q));
  }, [services, search]);

  const sorted = useMemo(() => {
    const list = [...filtered].sort((a, b) =>
      sortAsc
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );
    return list;
  }, [filtered, sortAsc]);

  const paginated = useMemo(() => {
    const start = page * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, page]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

  function handleEdit(s: Service) {
    setEditingService(s);
    setModalOpen(true);
  }

  function handleAdd() {
    setEditingService(null);
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setEditingService(null);
  }

  async function handleToggle(s: Service) {
    try {
      await toggleServiceStatus(tenantId, s.id);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(s: Service) {
    if (!confirm(`ต้องการลบบริการ "${s.name}" ใช่หรือไม่?`)) return;
    setDeletingId(s.id);
    try {
      await deleteService(tenantId, s.id);
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
              Master บริการ
            </h1>
          </div>
          <button
            onClick={handleAdd}
            className="rounded-lg bg-(--brand-primary) px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition"
          >
            + เพิ่มบริการ
          </button>
        </div>

        <div className="mb-4">
          <input
            type="search"
            placeholder="ค้นหาชื่อบริการ..."
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
          <div className="rounded-xl border border-(--border-subtle) bg-(--surface-secondary) overflow-hidden">
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} variant="text" className="h-14 w-full" />
              ))}
            </div>
          </div>
        ) : sorted.length === 0 ? (
          <div className="rounded-xl border border-(--border-subtle) bg-(--surface-secondary) p-12 text-center">
            <p className="text-(--text-secondary) mb-2">
              {search.trim() ? "ไม่พบบริการที่ตรงกับคำค้น" : "ยังไม่มีบริการ"}
            </p>
            {!search.trim() && (
              <button
                onClick={handleAdd}
                className="text-(--brand-primary) hover:opacity-90 text-sm font-medium transition"
              >
                เพิ่มบริการแรก
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-(--border-subtle) bg-(--surface-secondary) overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-(--border-subtle) bg-(--surface-tertiary)">
                      <th className="text-left text-xs font-medium text-(--text-muted) uppercase tracking-wider p-4">
                        <button
                          type="button"
                          onClick={() => setSortAsc((a) => !a)}
                          className="flex items-center gap-1 hover:text-(--text-primary) transition"
                        >
                          บริการ
                          <span className="text-(--brand-primary)">
                            {sortAsc ? "↑" : "↓"}
                          </span>
                        </button>
                      </th>
                      <th className="text-left text-xs font-medium text-(--text-muted) uppercase tracking-wider p-4">
                        ระยะเวลา
                      </th>
                      <th className="text-left text-xs font-medium text-(--text-muted) uppercase tracking-wider p-4">
                        ราคา
                      </th>
                      <th className="text-left text-xs font-medium text-(--text-muted) uppercase tracking-wider p-4">
                        สถานะ
                      </th>
                      <th className="text-right text-xs font-medium text-(--text-muted) uppercase tracking-wider p-4">
                        การดำเนินการ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-(--border-subtle) hover:bg-(--surface-tertiary)/50 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-(--surface-tertiary) overflow-hidden shrink-0">
                              {s.imageUrl ? (
                                <img
                                  src={s.imageUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-(--text-muted) text-xs">
                                  ไม่มีรูป
                                </div>
                              )}
                            </div>
                            <span className="font-medium text-(--text-primary)">
                              {s.name}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-(--text-secondary)">
                          {s.durationMinutes} นาที
                        </td>
                        <td className="p-4 text-(--text-secondary)">
                          ฿{s.price.toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
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
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-(--text-muted)">
                  แสดง {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, sorted.length)} จาก {sorted.length}
                </p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="rounded-lg border border-(--border-default) px-3 py-1.5 text-sm text-(--text-secondary) hover:bg-(--surface-tertiary) disabled:opacity-40 transition"
                  >
                    ก่อนหน้า
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="rounded-lg border border-(--border-default) px-3 py-1.5 text-sm text-(--text-secondary) hover:bg-(--surface-tertiary) disabled:opacity-40 transition"
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {modalOpen && (
        <ServiceModal
          tenantId={tenantId}
          service={editingService}
          onClose={handleCloseModal}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
