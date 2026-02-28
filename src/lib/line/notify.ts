import { adminDb } from "@/lib/firebase/admin";
import { sendFlexMessage } from "@/lib/line/client";
import {
  buildAdminNewBookingMessage,
  buildAdminBookingCancelledByUserMessage,
  buildBookingReceivedMessage,
  buildBookingConfirmedMessage,
  buildBookingCancelledByAdminMessage,
} from "@/lib/line/messages";
import type { Booking } from "@/types";

async function getAdminLineUserId(tenantId: string): Promise<string | null> {
  const doc = await adminDb.collection("tenants").doc(tenantId).get();
  if (!doc.exists) return null;
  const data = doc.data();
  const adminLineUserId = data?.adminLineUserId as string | undefined;
  return adminLineUserId && adminLineUserId.trim() ? adminLineUserId : null;
}

async function getTenantName(tenantId: string): Promise<string> {
  const doc = await adminDb.collection("tenants").doc(tenantId).get();
  if (!doc.exists) return "";
  return (doc.data()?.name as string) ?? "";
}

export async function notifyAdminNewBooking(
  tenantId: string,
  booking: Booking
): Promise<void> {
  const adminLineUserId = await getAdminLineUserId(tenantId);
  if (!adminLineUserId) return;
  const flex = buildAdminNewBookingMessage(
    booking,
    booking.customerName,
    booking.serviceName,
    booking.staffName
  );
  await sendFlexMessage(
    tenantId,
    adminLineUserId,
    "การจองใหม่",
    flex
  );
}

export async function notifyAdminBookingCancelledByUser(
  tenantId: string,
  booking: Booking
): Promise<void> {
  const adminLineUserId = await getAdminLineUserId(tenantId);
  if (!adminLineUserId) return;
  const flex = buildAdminBookingCancelledByUserMessage(
    booking,
    booking.customerName
  );
  await sendFlexMessage(
    tenantId,
    adminLineUserId,
    "ลูกค้ายกเลิกการจอง",
    flex
  );
}

export async function notifyCustomerBookingReceived(
  tenantId: string,
  booking: Booking
): Promise<void> {
  const tenantName = await getTenantName(tenantId);
  const flex = buildBookingReceivedMessage(booking, tenantName);
  await sendFlexMessage(
    tenantId,
    booking.customerLineId,
    "ได้รับการจองแล้ว",
    flex
  );
}

export async function notifyCustomerBookingConfirmed(
  tenantId: string,
  booking: Booking
): Promise<void> {
  const tenantName = await getTenantName(tenantId);
  const flex = buildBookingConfirmedMessage(booking, tenantName);
  await sendFlexMessage(
    tenantId,
    booking.customerLineId,
    "ยืนยันการจองแล้ว",
    flex
  );
}

export async function notifyCustomerBookingCancelledByAdmin(
  tenantId: string,
  booking: Booking
): Promise<void> {
  const tenantName = await getTenantName(tenantId);
  const flex = buildBookingCancelledByAdminMessage(booking, tenantName);
  await sendFlexMessage(
    tenantId,
    booking.customerLineId,
    "การจองถูกยกเลิก",
    flex
  );
}
