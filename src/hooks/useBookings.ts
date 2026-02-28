import { useState, useEffect } from "react";
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  type Unsubscribe,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Booking, BookingStatus } from "@/types";
import type { BookingFilters } from "@/types";
import type { Timestamp } from "firebase/firestore";

const COLLECTION = "bookings";

function toBooking(id: string, data: Record<string, unknown>): Booking {
  return {
    id,
    tenantId: data.tenantId as string,
    customerId: data.customerId as string,
    customerName: data.customerName as string,
    customerLineId: data.customerLineId as string,
    customerPhone: (data.customerPhone as string) ?? "",
    serviceId: data.serviceId as string,
    serviceName: data.serviceName as string,
    staffId: data.staffId as string,
    staffName: data.staffName as string,
    date: data.date as string,
    startTime: data.startTime as string,
    endTime: (data.endTime as string) ?? (data.startTime as string),
    status: data.status as BookingStatus,
    notes: (data.notes as string) ?? "",
    price: data.price as number | undefined,
    createdAt: data.createdAt as Timestamp,
    updatedAt: data.updatedAt as Timestamp,
  };
}

export function useBookings(
  tenantId: string | null,
  filters: BookingFilters = {}
) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tenantId) {
      setBookings([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    // Firestore listener: must return unsubscribe for cleanup on unmount
    const constraints: QueryConstraint[] = [
      where("tenantId", "==", tenantId),
    ];
    if (filters.date) constraints.push(where("date", "==", filters.date));
    if (filters.status) constraints.push(where("status", "==", filters.status));
    if (filters.staffId) constraints.push(where("staffId", "==", filters.staffId));
    if (filters.serviceId) constraints.push(where("serviceId", "==", filters.serviceId));
    constraints.push(orderBy("date", "desc"));
    constraints.push(orderBy("startTime", "asc"));
    const q = query(collection(db, COLLECTION), ...constraints);
    const unsub: Unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setBookings(snapshot.docs.map((d) => toBooking(d.id, d.data())));
        setLoading(false);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [tenantId, filters.date, filters.status, filters.staffId, filters.serviceId]);

  return { bookings, loading, error };
}

export function useTodayBookings(tenantId: string | null) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tenantId) {
      setBookings([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const today = new Date().toISOString().slice(0, 10);
    const q = query(
      collection(db, COLLECTION),
      where("tenantId", "==", tenantId),
      where("date", "==", today),
      orderBy("startTime", "asc")
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setBookings(snapshot.docs.map((d) => toBooking(d.id, d.data())));
        setLoading(false);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [tenantId]);

  return { bookings, loading, error };
}

export interface BookingStats {
  totalToday: number;
  totalPending: number;
  totalConfirmed: number;
  totalCancelled: number;
  totalThisMonth: number;
  revenueThisMonth: number;
}

export function useBookingStats(tenantId: string | null) {
  const [stats, setStats] = useState<BookingStats>({
    totalToday: 0,
    totalPending: 0,
    totalConfirmed: 0,
    totalCancelled: 0,
    totalThisMonth: 0,
    revenueThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const monthStart = now.toISOString().slice(0, 7) + "-01";
    const q = query(
      collection(db, COLLECTION),
      where("tenantId", "==", tenantId),
      where("date", ">=", monthStart),
      where("date", "<=", today)
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => d.data());
        let totalToday = 0;
        let totalPending = 0;
        let totalConfirmed = 0;
        let totalCancelled = 0;
        let revenueThisMonth = 0;
        for (const d of docs) {
          if (d.date === today) totalToday += 1;
          if (d.status === "open") totalPending += 1;
          else if (d.status === "confirmed") {
            totalConfirmed += 1;
            revenueThisMonth += Number(d.price) || 0;
          } else if (d.status === "user_cancelled" || d.status === "admin_cancelled") {
            totalCancelled += 1;
          }
        }
        setStats({
          totalToday,
          totalPending,
          totalConfirmed,
          totalCancelled,
          totalThisMonth: docs.length,
          revenueThisMonth,
        });
        setLoading(false);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [tenantId]);

  return { stats, loading, error };
}
