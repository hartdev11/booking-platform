import { useState, useEffect } from "react";
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Staff } from "@/types";
import type { Timestamp } from "firebase/firestore";

const COLLECTION = "staff";

function toStaff(id: string, data: Record<string, unknown>): Staff {
  return {
    id,
    tenantId: data.tenantId as string,
    name: data.name as string,
    imageUrl: (data.imageUrl as string) ?? "",
    serviceIds: (data.serviceIds as string[]) ?? [],
    workDays: (data.workDays as number[]) ?? [],
    workStartTime: (data.workStartTime as string) ?? "09:00",
    workEndTime: (data.workEndTime as string) ?? "18:00",
    isActive: (data.isActive as boolean) ?? true,
    createdAt: data.createdAt as Timestamp,
    updatedAt: data.updatedAt as Timestamp,
  };
}

export function useStaff(tenantId: string | null) {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tenantId) {
      setStaffList([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, COLLECTION),
      where("tenantId", "==", tenantId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe: Unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => toStaff(d.id, d.data()));
        setStaffList(list);
        setLoading(false);
        setError(null);
      },
      (err: { code?: string } & Error) => {
        if (err?.code === "permission-denied") {
          setStaffList([]);
          setLoading(false);
          setError(err as Error);
          return;
        }
        console.error("Staff listener error:", err);
        setError(err as Error);
        setStaffList([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tenantId]);

  return { staffList, loading, error };
}

export function useStaffMember(
  tenantId: string | null,
  staffId: string | null
) {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tenantId || !staffId) {
      setStaff(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const ref = doc(db, COLLECTION, staffId);
    getDoc(ref)
      .then((snapshot) => {
        if (!snapshot.exists()) {
          setStaff(null);
        } else {
          const data = snapshot.data();
          if (data.tenantId !== tenantId) {
            setStaff(null);
          } else {
            setStaff(toStaff(snapshot.id, data));
          }
        }
      })
      .catch((err) => {
        setError(err as Error);
        setStaff(null);
      })
      .finally(() => setLoading(false));
  }, [tenantId, staffId]);

  return { staff, loading, error };
}
