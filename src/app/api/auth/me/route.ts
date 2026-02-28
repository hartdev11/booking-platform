import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }
    const decoded = await adminAuth.verifyIdToken(token);
    const email = decoded.email ?? "";
    if (!email) {
      return NextResponse.json({ error: "No email in token" }, { status: 401 });
    }
    const snapshot = await adminDb
      .collection("tenants")
      .where("adminEmail", "==", email)
      .limit(1)
      .get();
    if (snapshot.empty) {
      return NextResponse.json(
        { error: "No tenant for this admin", tenantId: null, email },
        { status: 200 }
      );
    }
    const tenantId = snapshot.docs[0].id;
    return NextResponse.json({ tenantId, email });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
