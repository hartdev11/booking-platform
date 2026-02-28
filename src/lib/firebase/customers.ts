import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  type DocumentData,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Customer } from "@/types";

const COLLECTION = "customers";

function toCustomer(id: string, data: DocumentData): Customer {
  return {
    id,
    tenantId: data.tenantId,
    lineUserId: data.lineUserId,
    displayName: data.displayName ?? "",
    pictureUrl: data.pictureUrl ?? "",
    phone: data.phone ?? "",
    isActive: data.isActive ?? true,
    createdAt: data.createdAt as Timestamp,
    updatedAt: data.updatedAt as Timestamp,
  };
}

export async function getCustomer(
  tenantId: string,
  lineUserId: string
): Promise<Customer | null> {
  const q = query(
    collection(db, COLLECTION),
    where("tenantId", "==", tenantId),
    where("lineUserId", "==", lineUserId)
  );
  const snapshot = await getDocs(q);
  const active = snapshot.docs.find((d) => d.data().isActive !== false);
  if (!active) return null;
  return toCustomer(active.id, active.data());
}

export type CreateCustomerData = Omit<
  Customer,
  "id" | "tenantId" | "createdAt" | "updatedAt"
>;

export async function createCustomer(
  tenantId: string,
  data: CreateCustomerData
): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    tenantId,
    lineUserId: data.lineUserId,
    displayName: data.displayName ?? "",
    pictureUrl: data.pictureUrl ?? "",
    phone: data.phone ?? "",
    isActive: data.isActive ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export type UpdateCustomerData = Partial<
  Omit<Customer, "id" | "tenantId" | "createdAt" | "updatedAt">
>;

export async function updateCustomer(
  tenantId: string,
  customerId: string,
  data: UpdateCustomerData
): Promise<void> {
  const ref = doc(db, COLLECTION, customerId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists() || snapshot.data().tenantId !== tenantId) {
    throw new Error("Customer not found");
  }
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl: string;
}

export async function getOrCreateCustomer(
  tenantId: string,
  lineUserId: string,
  profile: LineProfile
): Promise<Customer> {
  const existing = await getCustomer(tenantId, lineUserId);
  if (existing) return existing;
  const id = await createCustomer(tenantId, {
    lineUserId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl,
    phone: "",
    isActive: true,
  });
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  return toCustomer(snap.id, snap.data()!);
}
