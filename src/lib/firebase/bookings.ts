import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type DocumentData,
  type Timestamp,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Booking, BookingStatus } from "@/types";
import type { BookingFilters } from "@/types";

const COLLECTION = "bookings";

function toBooking(id: string, data: DocumentData): Booking {
  return {
    id,
    tenantId: data.tenantId,
    customerId: data.customerId,
    customerName: data.customerName,
    customerLineId: data.customerLineId,
    customerPhone: data.customerPhone ?? "",
    serviceId: data.serviceId,
    serviceName: data.serviceName,
    staffId: data.staffId,
    staffName: data.staffName,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime ?? data.startTime,
    status: data.status as BookingStatus,
    notes: data.notes ?? "",
    price: data.price,
    createdAt: data.createdAt as Timestamp,
    updatedAt: data.updatedAt as Timestamp,
  };
}

export async function getBookings(
  tenantId: string,
  filters: BookingFilters = {}
): Promise<Booking[]> {
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
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => toBooking(d.id, d.data()));
}

export async function getBooking(
  tenantId: string,
  bookingId: string
): Promise<Booking | null> {
  const ref = doc(db, COLLECTION, bookingId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  if (data.tenantId !== tenantId) return null;
  return toBooking(snapshot.id, data);
}

export async function updateBookingStatus(
  tenantId: string,
  bookingId: string,
  status: "confirmed" | "admin_cancelled"
): Promise<void> {
  const ref = doc(db, COLLECTION, bookingId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists() || snapshot.data().tenantId !== tenantId) {
    throw new Error("Booking not found");
  }
  await updateDoc(ref, {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function getTodayBookings(tenantId: string): Promise<Booking[]> {
  const today = new Date().toISOString().slice(0, 10);
  const q = query(
    collection(db, COLLECTION),
    where("tenantId", "==", tenantId),
    where("date", "==", today),
    orderBy("startTime", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => toBooking(d.id, d.data()));
}

export interface BookingStats {
  totalToday: number;
  totalPending: number;
  totalConfirmed: number;
  totalCancelled: number;
  totalThisMonth: number;
  revenueThisMonth: number;
}

export async function getBookingStats(
  tenantId: string
): Promise<BookingStats> {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const monthStart = now.toISOString().slice(0, 7) + "-01";
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTION),
      where("tenantId", "==", tenantId),
      where("date", ">=", monthStart),
      where("date", "<=", today)
    )
  );
  const docs = snapshot.docs.map((d) => d.data());
  let totalToday = 0;
  let totalPending = 0;
  let totalConfirmed = 0;
  let totalCancelled = 0;
  let revenueThisMonth = 0;
  for (const d of docs) {
    const date = d.date as string;
    const status = d.status as BookingStatus;
    if (date === today) totalToday += 1;
    if (status === "open") totalPending += 1;
    else if (status === "confirmed") {
      totalConfirmed += 1;
      revenueThisMonth += Number(d.price) || 0;
    } else if (status === "user_cancelled" || status === "admin_cancelled") {
      totalCancelled += 1;
    }
  }
  return {
    totalToday,
    totalPending,
    totalConfirmed,
    totalCancelled,
    totalThisMonth: docs.length,
    revenueThisMonth,
  };
}
