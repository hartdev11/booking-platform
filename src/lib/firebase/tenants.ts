import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export interface TenantPublic {
  id: string;
  name: string;
  logoUrl: string;
}

export async function getTenant(tenantId: string): Promise<TenantPublic | null> {
  const ref = doc(db, "tenants", tenantId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    id: snapshot.id,
    name: (data?.name as string) ?? "",
    logoUrl: (data?.logoUrl as string) ?? "",
  };
}
