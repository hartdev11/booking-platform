import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type DocumentData,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Staff } from "@/types";

const COLLECTION = "staff";

function toStaff(id: string, data: DocumentData): Staff {
  return {
    id,
    tenantId: data.tenantId,
    name: data.name,
    imageUrl: data.imageUrl ?? "",
    serviceIds: data.serviceIds ?? [],
    workDays: data.workDays ?? [],
    workStartTime: data.workStartTime ?? "09:00",
    workEndTime: data.workEndTime ?? "18:00",
    isActive: data.isActive ?? true,
    createdAt: data.createdAt as Timestamp,
    updatedAt: data.updatedAt as Timestamp,
  };
}

export async function getStaffList(tenantId: string): Promise<Staff[]> {
  const q = query(
    collection(db, COLLECTION),
    where("tenantId", "==", tenantId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => toStaff(d.id, d.data()));
}

export async function getStaff(
  tenantId: string,
  staffId: string
): Promise<Staff | null> {
  const ref = doc(db, COLLECTION, staffId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  if (data.tenantId !== tenantId) return null;
  return toStaff(snapshot.id, data);
}

export type CreateStaffData = Omit<
  Staff,
  "id" | "tenantId" | "createdAt" | "updatedAt"
>;

export async function createStaff(
  tenantId: string,
  data: CreateStaffData
): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    tenantId,
    name: data.name,
    imageUrl: data.imageUrl ?? "",
    serviceIds: data.serviceIds ?? [],
    workDays: data.workDays ?? [],
    workStartTime: data.workStartTime ?? "09:00",
    workEndTime: data.workEndTime ?? "18:00",
    isActive: data.isActive ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export type UpdateStaffData = Partial<
  Omit<Staff, "id" | "tenantId" | "createdAt" | "updatedAt">
>;

export async function updateStaff(
  tenantId: string,
  staffId: string,
  data: UpdateStaffData
): Promise<void> {
  const ref = doc(db, COLLECTION, staffId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists() || snapshot.data().tenantId !== tenantId) {
    throw new Error("Staff not found");
  }
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteStaff(
  tenantId: string,
  staffId: string
): Promise<void> {
  const ref = doc(db, COLLECTION, staffId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists() || snapshot.data().tenantId !== tenantId) {
    throw new Error("Staff not found");
  }
  await deleteDoc(ref);
}

export async function toggleStaffStatus(
  tenantId: string,
  staffId: string
): Promise<void> {
  const ref = doc(db, COLLECTION, staffId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists() || snapshot.data().tenantId !== tenantId) {
    throw new Error("Staff not found");
  }
  const current = snapshot.data().isActive ?? true;
  await updateDoc(ref, {
    isActive: !current,
    updatedAt: serverTimestamp(),
  });
}
