import { NextRequest, NextResponse } from "next/server";
import { createBooking } from "@/lib/firebase/createBooking";
import { notifyAdminNewBooking } from "@/lib/line/notify";
import type { Booking } from "@/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const body = await request.json();
    const {
      customerId,
      customerName,
      customerLineId,
      customerPhone,
      serviceId,
      serviceName,
      staffId,
      staffName,
      date,
      startTime,
      notes,
    } = body as {
      customerId: string;
      customerName: string;
      customerLineId: string;
      customerPhone: string;
      serviceId: string;
      serviceName: string;
      staffId: string;
      staffName: string;
      date: string;
      startTime: string;
      notes?: string;
    };
    if (
      !tenantId ||
      !customerId ||
      !customerName ||
      !customerLineId ||
      !customerPhone ||
      !serviceId ||
      !serviceName ||
      !staffId ||
      !staffName ||
      !date ||
      !startTime
    ) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ครบถ้วน" },
        { status: 400 }
      );
    }
    const booking = await createBooking(tenantId, {
      customerId,
      customerName,
      customerLineId,
      customerPhone,
      serviceId,
      serviceName,
      staffId,
      staffName,
      date,
      startTime,
      notes: notes ?? "",
    });
    await notifyAdminNewBooking(tenantId, booking as Booking).catch(() => {});
    return NextResponse.json({ booking });
  } catch (err) {
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
