import { NextRequest, NextResponse } from "next/server";
import { cancelBooking } from "@/lib/firebase/createBooking";
import { notifyAdminBookingCancelledByUser } from "@/lib/line/notify";
import type { Booking } from "@/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; bookingId: string }> }
) {
  try {
    const { tenantId, bookingId } = await params;
    const body = await request.json();
    const lineUserId = body.lineUserId as string | undefined;
    if (!lineUserId) {
      return NextResponse.json(
        { error: "ต้องระบุ lineUserId" },
        { status: 400 }
      );
    }
    const booking = await cancelBooking(tenantId, bookingId, lineUserId);
    await notifyAdminBookingCancelledByUser(tenantId, booking as Booking).catch(
      () => {}
    );
    return NextResponse.json({ booking });
  } catch (err) {
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
