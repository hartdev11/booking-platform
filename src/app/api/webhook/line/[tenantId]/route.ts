import { NextRequest, NextResponse } from "next/server";
import type { WebhookEvent, WebhookRequestBody } from "@line/bot-sdk";
import { adminDb } from "@/lib/firebase/admin";
import {
  validateLineSignature,
  getLineClient,
  replyText,
  replyFlex,
  replyConfirmTemplate,
  sendFlexMessage,
} from "@/lib/line/client";
import {
  buildWelcomeMessage,
  buildBookingConfirmMessage,
  buildBookingSuccessMessage,
  buildBookingCancelledMessage,
  buildRescheduleMessage,
} from "@/lib/line/messages";
import {
  notifyAdminNewBooking,
  notifyAdminBookingCancelledByUser,
  notifyCustomerBookingConfirmed,
  notifyCustomerBookingCancelledByAdmin,
} from "@/lib/line/notify";
import { cancelBooking } from "@/lib/firebase/createBooking";
import type {
  Tenant,
  Customer,
  Booking,
  BookingFlowStateDoc,
} from "@/types";
import { FieldValue } from "firebase-admin/firestore";
import { format, addDays, getDay } from "date-fns";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const signature = request.headers.get("x-line-signature") ?? "";
  const rawBody = await request.text();
  const tenantDoc = await adminDb.collection("tenants").doc(tenantId).get();
  if (!tenantDoc.exists) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }
  const tenant = { id: tenantDoc.id, ...tenantDoc.data() } as Tenant;
  if (!validateLineSignature(rawBody, tenant.lineChannelSecret, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  const body = JSON.parse(rawBody) as WebhookRequestBody;
  for (const event of body.events) {
    try {
      await handleEvent(tenantId, tenant, event);
    } catch (err) {
      console.error("Webhook event error:", err);
    }
  }
  return NextResponse.json({ ok: true });
}

async function handleEvent(
  tenantId: string,
  tenant: Tenant,
  event: WebhookEvent
) {
  if (event.type === "follow") {
    await handleFollow(tenantId, tenant, event);
    return;
  }
  if (event.type === "unfollow") {
    await handleUnfollow(tenantId, event);
    return;
  }
  if (event.type === "message" && event.message.type === "text") {
    await handleMessage(tenantId, tenant, {
      replyToken: event.replyToken,
      message: { text: event.message.text },
      source: event.source,
    });
    return;
  }
  if (event.type === "postback") {
    await handlePostback(tenantId, tenant, event);
  }
}

async function handleFollow(
  tenantId: string,
  tenant: Tenant,
  event: { replyToken: string; source: { userId?: string } }
) {
  const lineUserId = event.source.userId;
  if (!lineUserId) return;
  const client = await getLineClient(tenantId);
  const profile = await client.getProfile(lineUserId);
  const customerRef = adminDb.collection("customers").doc();
  const now = FieldValue.serverTimestamp();
  const customer: Omit<Customer, "id"> & { id: string } = {
    id: customerRef.id,
    tenantId,
    lineUserId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl ?? "",
    phone: "",
    isActive: true,
    createdAt: now as Customer["createdAt"],
    updatedAt: now as Customer["updatedAt"],
  };
  await customerRef.set(customer);
  const welcomeFlex = buildWelcomeMessage(tenant.name);
  await replyFlex(tenantId, event.replyToken, `ยินดีต้อนรับสู่ ${tenant.name}`, welcomeFlex);
}

async function handleUnfollow(
  tenantId: string,
  event: { source: { userId?: string } }
) {
  const lineUserId = event.source.userId;
  if (!lineUserId) return;
  const snapshot = await adminDb
    .collection("customers")
    .where("tenantId", "==", tenantId)
    .where("lineUserId", "==", lineUserId)
    .limit(1)
    .get();
  if (!snapshot.empty) {
    await snapshot.docs[0].ref.update({
      isActive: false,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

async function handleMessage(
  tenantId: string,
  tenant: Tenant,
  event: {
    replyToken: string;
    message: { text: string };
    source: { userId?: string };
  }
) {
  const lineUserId = event.source.userId;
  if (!lineUserId) return;
  const text = event.message.text.trim();
  const customerSnap = await adminDb
    .collection("customers")
    .where("tenantId", "==", tenantId)
    .where("lineUserId", "==", lineUserId)
    .where("isActive", "==", true)
    .limit(1)
    .get();
  if (customerSnap.empty) return;
  const customerDoc = customerSnap.docs[0];
  const customerId = customerDoc.id;
  const flowRef = adminDb
    .collection("bookingFlowState")
    .doc(`${tenantId}_${lineUserId}`);
  const flowSnap = await flowRef.get();
  const flowData = flowSnap.exists ? flowSnap.data() : null;
  type FlowState = Omit<BookingFlowStateDoc, "updatedAt"> & {
    updatedAt?: BookingFlowStateDoc["updatedAt"] | ReturnType<typeof FieldValue.serverTimestamp>;
  };
  const flow: FlowState = flowData
    ? ({ ...flowData } as FlowState)
    : {
        tenantId,
        customerId,
        state: "idle",
        selectedDate: null,
        selectedTime: null,
        selectedServiceId: null,
        selectedStaffId: null,
        updatedAt: FieldValue.serverTimestamp(),
      };
  const currentState = flow.state ?? "idle";
  if (currentState === "idle") {
    if (text === "จอง" || text.toLowerCase() === "booking") {
      await flowRef.set({
        ...flow,
        state: "selecting_date",
        updatedAt: FieldValue.serverTimestamp(),
      });
      const dates = getAvailableDates(tenant.openDays);
      await replyText(
        tenantId,
        event.replyToken,
        `กรุณาเลือกวันที่ (ส่งเลขหรือวันที่ เช่น 1 หรือ ${dates[0]}):\n${dates.slice(0, 7).map((d, i) => `${i + 1}. ${d}`).join("\n")}`
      );
    } else {
      await replyText(tenantId, event.replyToken, "พิมพ์ \"จอง\" เพื่อเริ่มต้นการจองคิว");
    }
    return;
  }
  if (currentState === "selecting_date") {
    const dates = getAvailableDates(tenant.openDays);
    const idx = parseInt(text, 10);
    let dateStr: string;
    if (idx >= 1 && idx <= dates.length) {
      dateStr = dates[idx - 1];
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(text) && dates.includes(text)) {
      dateStr = text;
    } else {
      await replyText(tenantId, event.replyToken, "กรุณาเลือกวันที่จากรายการ");
      return;
    }
    await flowRef.set({
      ...flow,
      state: "selecting_time",
      selectedDate: dateStr,
      updatedAt: FieldValue.serverTimestamp(),
    });
    const slots = getTimeSlots(tenant.openTime, tenant.closeTime, tenant.slotDurationMinutes);
    await replyText(
      tenantId,
      event.replyToken,
      `กรุณาเลือกเวลา (ส่งเลข):\n${slots.map((s, i) => `${i + 1}. ${s}`).join("\n")}`
    );
    return;
  }
  if (currentState === "selecting_time") {
    const slots = getTimeSlots(tenant.openTime, tenant.closeTime, tenant.slotDurationMinutes);
    const idx = parseInt(text, 10);
    if (idx < 1 || idx > slots.length) {
      await replyText(tenantId, event.replyToken, "กรุณาเลือกเวลาจากรายการ");
      return;
    }
    const selectedTime = slots[idx - 1];
    await flowRef.set({
      ...flow,
      state: "selecting_service",
      selectedTime,
      updatedAt: FieldValue.serverTimestamp(),
    });
    const servicesSnap = await adminDb
      .collection("services")
      .where("tenantId", "==", tenantId)
      .where("isActive", "==", true)
      .get();
    const services = servicesSnap.docs.map((d) => ({
      id: d.id,
      name: d.data().name as string,
    }));
    if (services.length === 0) {
      await flowRef.set({
        ...flow,
        state: "idle",
        selectedTime: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
      await replyText(tenantId, event.replyToken, "ไม่มีบริการในขณะนี้");
      return;
    }
    await replyText(
      tenantId,
      event.replyToken,
      `กรุณาเลือกบริการ (ส่งเลข):\n${services.map((s, i) => `${i + 1}. ${s.name}`).join("\n")}`
    );
    return;
  }
  if (currentState === "selecting_service") {
    const servicesSnap = await adminDb
      .collection("services")
      .where("tenantId", "==", tenantId)
      .where("isActive", "==", true)
      .get();
    const services = servicesSnap.docs.map((d) => ({ id: d.id, name: d.data().name }));
    const idx = parseInt(text, 10);
    if (idx < 1 || idx > services.length) {
      await replyText(tenantId, event.replyToken, "กรุณาเลือกบริการจากรายการ");
      return;
    }
    const selectedServiceId = services[idx - 1].id;
    const selectedServiceName = services[idx - 1].name;
    await flowRef.set({
      ...flow,
      state: "selecting_staff",
      selectedServiceId,
      updatedAt: FieldValue.serverTimestamp(),
    });
    const staffSnap = await adminDb
      .collection("staff")
      .where("tenantId", "==", tenantId)
      .where("isActive", "==", true)
      .get();
    const staffList = staffSnap.docs
      .filter((d) => {
        const data = d.data();
        const serviceIds: string[] = data.serviceIds ?? [];
        return serviceIds.includes(selectedServiceId);
      })
      .map((d) => ({ id: d.id, name: d.data().name }));
    if (staffList.length === 0) {
      await flowRef.set({
        ...flow,
        state: "selecting_service",
        selectedServiceId: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
      await replyText(tenantId, event.replyToken, "ไม่มีช่างว่างสำหรับบริการนี้");
      return;
    }
    await replyText(
      tenantId,
      event.replyToken,
      `กรุณาเลือกช่าง (ส่งเลข):\n${staffList.map((s, i) => `${i + 1}. ${s.name}`).join("\n")}`
    );
    return;
  }
  if (currentState === "selecting_staff") {
    const staffSnap = await adminDb
      .collection("staff")
      .where("tenantId", "==", tenantId)
      .where("isActive", "==", true)
      .get();
    const selectedServiceId = flow.selectedServiceId;
    const staffList = staffSnap.docs
      .filter((d) => (d.data().serviceIds ?? []).includes(selectedServiceId))
      .map((d) => ({ id: d.id, name: d.data().name }));
    const idx = parseInt(text, 10);
    if (idx < 1 || idx > staffList.length) {
      await replyText(tenantId, event.replyToken, "กรุณาเลือกช่างจากรายการ");
      return;
    }
    const selectedStaffId = staffList[idx - 1].id;
    const selectedStaffName = staffList[idx - 1].name;
    const servicesSnap = await adminDb.collection("services").doc(flow.selectedServiceId ?? "").get();
    const serviceName = servicesSnap.data()?.name ?? "";
    const customerData = customerDoc.data();
    const bookingRef = adminDb.collection("bookings").doc();
    const now = FieldValue.serverTimestamp();
    const booking: Omit<Booking, "id"> & { id: string } = {
      id: bookingRef.id,
      tenantId,
      customerId,
      customerName: (customerData as Customer).displayName,
      customerLineId: lineUserId,
      customerPhone: (customerData as Customer).phone ?? "",
      serviceId: flow.selectedServiceId ?? "",
      serviceName,
      staffId: selectedStaffId,
      staffName: selectedStaffName,
      date: flow.selectedDate ?? "",
      startTime: flow.selectedTime ?? "",
      endTime: flow.selectedTime ?? "",
      status: "open",
      notes: "",
      createdAt: now as Booking["createdAt"],
      updatedAt: now as Booking["updatedAt"],
    };
    await bookingRef.set(booking);
    const fullBooking = { ...booking, id: bookingRef.id } as Booking;
    await notifyAdminNewBooking(tenantId, fullBooking).catch(() => {});
    await flowRef.set({
      tenantId,
      customerId,
      state: "confirming",
      selectedDate: flow.selectedDate ?? null,
      selectedTime: flow.selectedTime ?? null,
      selectedServiceId: flow.selectedServiceId ?? null,
      selectedStaffId,
      updatedAt: FieldValue.serverTimestamp(),
    });
    const confirmFlex = buildBookingConfirmMessage({
      id: bookingRef.id,
      date: booking.date,
      startTime: booking.startTime,
      serviceName: booking.serviceName,
      staffName: booking.staffName,
    });
    await replyFlex(tenantId, event.replyToken, "ยืนยันการจอง", confirmFlex);
  }
}

async function handlePostback(
  tenantId: string,
  tenant: Tenant,
  event: {
    replyToken: string;
    postback: { data: string };
    source: { userId?: string };
  }
) {
  const data = event.postback.data;
  const lineUserId = event.source.userId;
  if (!lineUserId) return;
  if (data.startsWith("confirm_booking:")) {
    const bookingId = data.replace("confirm_booking:", "");
    const bookingRef = adminDb.collection("bookings").doc(bookingId);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) {
      await replyText(tenantId, event.replyToken, "ไม่พบการจอง");
      return;
    }
    const booking = { id: bookingSnap.id, ...bookingSnap.data() } as Booking;
    await bookingRef.update({
      status: "confirmed",
      updatedAt: FieldValue.serverTimestamp(),
    });
    const flowRef = adminDb.collection("bookingFlowState").doc(`${tenantId}_${lineUserId}`);
    await flowRef.set({
      tenantId,
      customerId: booking.customerId,
      state: "completed",
      selectedDate: null,
      selectedTime: null,
      selectedServiceId: null,
      selectedStaffId: null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    const successFlex = buildBookingSuccessMessage({ ...booking, status: "confirmed" });
    await replyFlex(tenantId, event.replyToken, "จองสำเร็จ", successFlex);
    return;
  }
  if (data.startsWith("cancel_booking:")) {
    const bookingId = data.replace("cancel_booking:", "");
    const bookingRef = adminDb.collection("bookings").doc(bookingId);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) {
      await replyText(tenantId, event.replyToken, "ไม่พบการจอง");
      return;
    }
    const booking = { id: bookingSnap.id, ...bookingSnap.data() } as Booking;
    await bookingRef.update({
      status: "user_cancelled",
      updatedAt: FieldValue.serverTimestamp(),
    });
    const flowRef = adminDb.collection("bookingFlowState").doc(`${tenantId}_${lineUserId}`);
    await flowRef.set({
      tenantId,
      customerId: booking.customerId,
      state: "idle",
      selectedDate: null,
      selectedTime: null,
      selectedServiceId: null,
      selectedStaffId: null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    const cancelledFlex = buildBookingCancelledMessage({ ...booking, status: "user_cancelled" });
    await replyFlex(tenantId, event.replyToken, "ยกเลิกการจองแล้ว", cancelledFlex);
    await notifyAdminBookingCancelledByUser(tenantId, { ...booking, status: "user_cancelled" }).catch(() => {});
    return;
  }
  const userCancelMatch = data.match(/^action=user_cancel&bookingId=(.+)$/);
  if (userCancelMatch) {
    const bookingId = userCancelMatch[1];
    try {
      const booking = await cancelBooking(tenantId, bookingId, lineUserId);
      await notifyAdminBookingCancelledByUser(tenantId, booking).catch(() => {});
      await replyText(tenantId, event.replyToken, "ยกเลิกการจองแล้ว");
    } catch {
      await replyText(tenantId, event.replyToken, "ไม่สามารถยกเลิกได้");
    }
    return;
  }
  const rescheduleMatch = data.match(/^action=reschedule&bookingId=(.+)$/);
  if (rescheduleMatch) {
    const bookingId = rescheduleMatch[1];
    const bookingRef = adminDb.collection("bookings").doc(bookingId);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) {
      await replyText(tenantId, event.replyToken, "ไม่พบการจอง");
      return;
    }
    const bookingData = bookingSnap.data();
    if (bookingData?.tenantId !== tenantId || (bookingData?.customerLineId as string) !== lineUserId) {
      await replyText(tenantId, event.replyToken, "ไม่พบการจอง");
      return;
    }
    const booking = { id: bookingSnap.id, ...bookingData } as Booking;
    const flex = buildRescheduleMessage(booking, tenant.name);
    await replyFlex(tenantId, event.replyToken, "เลื่อนนัดหมาย", flex);
    return;
  }
  const confirmMatch = data.match(/^action=confirm&bookingId=(.+)$/);
  if (confirmMatch) {
    const bookingId = confirmMatch[1];
    const bookingRef = adminDb.collection("bookings").doc(bookingId);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) {
      await replyText(tenantId, event.replyToken, "ไม่พบการจอง");
      return;
    }
    const bookingData = bookingSnap.data();
    if (bookingData?.tenantId !== tenantId) {
      await replyText(tenantId, event.replyToken, "การจองไม่ตรงกับร้าน");
      return;
    }
    const booking = { id: bookingSnap.id, ...bookingData } as Booking;
    await bookingRef.update({
      status: "confirmed",
      updatedAt: FieldValue.serverTimestamp(),
    });
    await notifyCustomerBookingConfirmed(tenantId, { ...booking, status: "confirmed" }).catch(() => {});
    await replyText(tenantId, event.replyToken, "ยืนยันการจองแล้ว");
    return;
  }
  const adminCancelMatch = data.match(/^action=admin_cancel&bookingId=(.+)$/);
  if (adminCancelMatch) {
    const bookingId = adminCancelMatch[1];
    const bookingRef = adminDb.collection("bookings").doc(bookingId);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) {
      await replyText(tenantId, event.replyToken, "ไม่พบการจอง");
      return;
    }
    const bookingData = bookingSnap.data();
    if (bookingData?.tenantId !== tenantId) {
      await replyText(tenantId, event.replyToken, "การจองไม่ตรงกับร้าน");
      return;
    }
    const booking = { id: bookingSnap.id, ...bookingData } as Booking;
    await bookingRef.update({
      status: "admin_cancelled",
      updatedAt: FieldValue.serverTimestamp(),
    });
    await notifyCustomerBookingCancelledByAdmin(tenantId, { ...booking, status: "admin_cancelled" }).catch(() => {});
    await replyText(tenantId, event.replyToken, "ปฏิเสธการจองแล้ว");
    return;
  }
  if (data.startsWith("reschedule:")) {
    const bookingId = data.replace("reschedule:", "");
    const flowRef = adminDb.collection("bookingFlowState").doc(`${tenantId}_${lineUserId}`);
    await flowRef.set({
      tenantId,
      customerId: (await adminDb.collection("bookings").doc(bookingId).get()).data()?.customerId,
      state: "selecting_date",
      selectedDate: null,
      selectedTime: null,
      selectedServiceId: null,
      selectedStaffId: null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    await replyText(tenantId, event.replyToken, "กรุณาเลือกวันที่ใหม่");
  }
}

function getAvailableDates(openDays: number[]): string[] {
  const dates: string[] = [];
  for (let i = 0; i < 14; i++) {
    const d = addDays(new Date(), i);
    if (openDays.includes(getDay(d))) {
      dates.push(format(d, "yyyy-MM-dd"));
    }
  }
  return dates;
}

function getTimeSlots(
  openTime: string,
  closeTime: string,
  slotDurationMinutes: number
): string[] {
  const [openH, openM] = openTime.split(":").map(Number);
  const [closeH, closeM] = closeTime.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;
  const slots: string[] = [];
  for (let m = openMinutes; m + slotDurationMinutes <= closeMinutes; m += slotDurationMinutes) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }
  return slots;
}
