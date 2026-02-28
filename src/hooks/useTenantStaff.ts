import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
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

export function useTenantStaff(
  tenantId: string | null,
  serviceId: string | null
) {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tenantId || !serviceId) {
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
      where("serviceIds", "array-contains", serviceId),
      orderBy("createdAt", "desc")
    );
    const unsub: Unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => toStaff(d.id, d.data()))
          .filter((s) => s.isActive);
        setStaffList(list);
        setLoading(false);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [tenantId, serviceId]);

  return { staffList, loading, error };
}
