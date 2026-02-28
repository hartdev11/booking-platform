"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { useBookings, useBookingStats } from "@/hooks/useBookings";
import { useStaff } from "@/hooks/useStaff";
import { updateBookingStatus } from "@/lib/firebase/bookings";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils/cn";
import type { Booking, BookingStatus } from "@/types";

const STATUS_LABELS: Record<BookingStatus, string> = {
  open: "รอยืนยัน",
  confirmed: "ยืนยันแล้ว",
  user_cancelled: "ยกเลิก (ลูกค้า)",
  admin_cancelled: "ยกเลิก (ร้าน)",
};

const STATUS_CLASS: Record<BookingStatus, string> = {
  open: "bg-amber-500/20 text-amber-400",
  confirmed: "bg-emerald-500/20 text-emerald-400",
  user_cancelled: "bg-zinc-600/50 text-zinc-400",
  admin_cancelled: "bg-red-500/20 text-red-400",
};

const STATUS_DOT: Record<BookingStatus, string> = {
  open: "bg-amber-400",
  confirmed: "bg-emerald-400",
  user_cancelled: "bg-zinc-400",
  admin_cancelled: "bg-red-400",
};

interface DashboardClientProps {
  tenantId: string;
}

function getLast7Days(): string[] {
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function getLast6Months(): { month: string; revenue: number }[] {
  const out: { month: string; revenue: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      month: d.toLocaleDateString("th-TH", { month: "short", year: "2-digit" }),
      revenue: 0,
    });
  }
  return out;
}

export function DashboardClient({ tenantId }: DashboardClientProps) {
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState<BookingStatus | "">("");
  const [filterStaffId, setFilterStaffId] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      date: filterDate || undefined,
      status: filterStatus || undefined,
      staffId: filterStaffId || undefined,
    }),
    [filterDate, filterStatus, filterStaffId]
  );

  const { bookings, loading, error } = useBookings(tenantId, filters);
  const { stats, loading: statsLoading } = useBookingStats(tenantId);
  const { staffList } = useStaff(tenantId);

  const volumeByDay = useMemo(() => {
    const days = getLast7Days();
    const countByDate: Record<string, number> = {};
    days.forEach((d) => (countByDate[d] = 0));
    bookings.forEach((b) => {
      if (countByDate[b.date] !== undefined) countByDate[b.date]++;
    });
    return days.map((date) => ({
      date: date.slice(5),
      count: countByDate[date] ?? 0,
    }));
  }, [bookings]);

  const revenueByMonth = useMemo(() => {
    const months = getLast6Months();
    const now = new Date();
    const revByMonth: Record<string, number> = {};
    months.forEach((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      revByMonth[key] = 0;
    });
    bookings.forEach((b) => {
      const key = b.date.slice(0, 7);
      if (revByMonth[key] !== undefined && (b.status === "confirmed" || b.status === "open")) {
        revByMonth[key] += b.price ?? 0;
      }
    });
    return months.map((m, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return { ...m, revenue: revByMonth[key] ?? 0 };
    });
  }, [bookings]);

  async function handleConfirm(b: Booking) {
    setActingId(b.id);
    try {
      await updateBookingStatus(tenantId, b.id, "confirmed");
      await fetch(`/api/admin/bookings/${b.id}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setActingId(null);
    }
  }

  async function handleCancel(b: Booking) {
    setActingId(b.id);
    try {
      await updateBookingStatus(tenantId, b.id, "admin_cancelled");
      await fetch(`/api/admin/bookings/${b.id}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "admin_cancelled" }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setActingId(null);
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
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl font-semibold text-(--text-primary) mb-6">Dashboard</h1>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {statsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="card" className="h-24 rounded-xl" />
            ))
          ) : (
            <>
              <div className="rounded-xl border border-(--border-subtle) bg-(--surface-secondary) p-4">
                <p className="text-xs text-(--text-muted)">จองวันนี้</p>
                <p className="text-2xl font-semibold text-(--text-primary) mt-0.5">
                  {stats.totalToday}
                </p>
              </div>
              <div className="rounded-xl border border-(--border-subtle) bg-(--surface-secondary) p-4">
                <p className="text-xs text-(--text-muted)">รอยืนยัน</p>
                <p className="text-2xl font-semibold text-amber-400 mt-0.5">{stats.totalPending}</p>
              </div>
              <div className="rounded-xl border border-(--border-subtle) bg-(--surface-secondary) p-4">
                <p className="text-xs text-(--text-muted)">ยืนยันแล้ว</p>
                <p className="text-2xl font-semibold text-emerald-400 mt-0.5">
                  {stats.totalConfirmed}
                </p>
              </div>
              <div className="rounded-xl border border-(--border-subtle) bg-(--surface-secondary) p-4">
                <p className="text-xs text-(--text-muted)">ยกเลิก</p>
                <p className="text-2xl font-semibold text-(--text-muted) mt-0.5">
                  {stats.totalCancelled}
                </p>
              </div>
              <div className="rounded-xl border border-(--border-subtle) bg-(--surface-secondary) p-4 col-span-2 lg:col-span-1">
                <p className="text-xs text-(--text-muted)">รายได้เดือนนี้</p>
                <p className="text-2xl font-semibold text-(--text-primary) mt-0.5">
                  ฿{stats.revenueThisMonth.toLocaleString()}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="rounded-xl border border-(--border-subtle) bg-(--surface-secondary) p-4">
            <h3 className="text-sm font-medium text-(--text-secondary) mb-4">
              การจอง 7 วันล่าสุด
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface-tertiary)",
                      border: "1px solid var(--border-default)",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "var(--text-primary)" }}
                  />
                  <Bar dataKey="count" fill="var(--brand-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-xl border border-(--border-subtle) bg-(--surface-secondary) p-4">
            <h3 className="text-sm font-medium text-(--text-secondary) mb-4">
              รายได้ 6 เดือนล่าสุด
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface-tertiary)",
                      border: "1px solid var(--border-default)",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "var(--text-primary)" }}
                    formatter={(value: number) => [`฿${value.toLocaleString()}`, "รายได้"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--brand-primary)"
                    strokeWidth={2}
                    dot={{ fill: "var(--brand-primary)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="rounded-lg border border-(--border-default) bg-(--surface-secondary) px-3 py-2 text-(--text-primary) text-sm outline-none focus:ring-2 focus:ring-(--brand-primary)/50 transition"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus((e.target.value || "") as BookingStatus | "")}
            className="rounded-lg border border-(--border-default) bg-(--surface-secondary) px-3 py-2 text-(--text-primary) text-sm outline-none focus:ring-2 focus:ring-(--brand-primary)/50 transition"
          >
            <option value="">ทุกสถานะ</option>
            <option value="open">รอยืนยัน</option>
            <option value="confirmed">ยืนยันแล้ว</option>
            <option value="user_cancelled">ยกเลิก (ลูกค้า)</option>
            <option value="admin_cancelled">ยกเลิก (ร้าน)</option>
          </select>
          <select
            value={filterStaffId}
            onChange={(e) => setFilterStaffId(e.target.value)}
            className="rounded-lg border border-(--border-default) bg-(--surface-secondary) px-3 py-2 text-(--text-primary) text-sm outline-none focus:ring-2 focus:ring-(--brand-primary)/50 transition"
          >
            <option value="">ทุกพนักงาน</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="rounded-lg bg-(--error)/10 border border-(--error)/20 text-(--error) text-sm p-4 mb-4">
            {error.message}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-(--border-subtle) bg-(--surface-secondary) overflow-hidden">
            <div className="p-12 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} variant="text" className="w-full h-12" />
              ))}
            </div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-xl border border-(--border-subtle) bg-(--surface-secondary) p-12 text-center">
            <p className="text-(--text-secondary)">ไม่มีการจองที่ตรงกับตัวกรอง</p>
          </div>
        ) : (
          <div className="rounded-xl border border-(--border-subtle) bg-(--surface-secondary) overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-(--border-subtle) bg-(--surface-tertiary)">
                    <th className="text-left text-xs font-medium text-(--text-muted) uppercase tracking-wider p-3 md:p-4">
                      เวลา
                    </th>
                    <th className="text-left text-xs font-medium text-(--text-muted) uppercase tracking-wider p-3 md:p-4">
                      ลูกค้า
                    </th>
                    <th className="text-left text-xs font-medium text-(--text-muted) uppercase tracking-wider p-3 md:p-4 hidden sm:table-cell">
                      บริการ
                    </th>
                    <th className="text-left text-xs font-medium text-(--text-muted) uppercase tracking-wider p-3 md:p-4 hidden md:table-cell">
                      พนักงาน
                    </th>
                    <th className="text-left text-xs font-medium text-(--text-muted) uppercase tracking-wider p-3 md:p-4">
                      สถานะ
                    </th>
                    <th className="text-right text-xs font-medium text-(--text-muted) uppercase tracking-wider p-3 md:p-4">
                      การดำเนินการ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr
                      key={b.id}
                      className="border-b border-(--border-subtle) hover:bg-(--surface-tertiary)/50 transition-colors"
                    >
                      <td className="p-3 md:p-4">
                        <span className="text-(--text-primary) font-medium">{b.date}</span>
                        <span className="text-(--text-secondary) ml-1">{b.startTime}</span>
                      </td>
                      <td className="p-3 md:p-4 text-(--text-secondary)">{b.customerName}</td>
                      <td className="p-3 md:p-4 text-(--text-secondary) hidden sm:table-cell">
                        {b.serviceName}
                      </td>
                      <td className="p-3 md:p-4 text-(--text-secondary) hidden md:table-cell">
                        {b.staffName}
                      </td>
                      <td className="p-3 md:p-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                            STATUS_CLASS[b.status]
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_DOT[b.status])} />
                          {STATUS_LABELS[b.status]}
                        </span>
                      </td>
                      <td className="p-3 md:p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {b.status === "open" && (
                            <button
                              type="button"
                              onClick={() => handleConfirm(b)}
                              disabled={actingId === b.id}
                              className="rounded-lg bg-(--brand-primary) px-2.5 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-1 transition"
                            >
                              {actingId === b.id ? (
                                <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                              ) : null}
                              {actingId === b.id ? "กำลังดำเนินการ..." : "ยืนยัน"}
                            </button>
                          )}
                          {(b.status === "open" || b.status === "confirmed") && (
                            <button
                              type="button"
                              onClick={() => handleCancel(b)}
                              disabled={actingId === b.id}
                              className="rounded-lg border border-(--error)/40 px-2.5 py-1.5 text-xs text-(--error) hover:bg-(--error)/10 disabled:opacity-50 flex items-center gap-1 transition"
                            >
                              {actingId === b.id ? (
                                <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                              ) : null}
                              {actingId === b.id ? "กำลังดำเนินการ..." : "ยกเลิก"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
