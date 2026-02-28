import type { FlexContainer } from "@line/bot-sdk";
import type { Booking } from "@/types";
import { formatThaiDate } from "@/lib/utils/formatThaiDate";

function getBookingBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (url) return url.startsWith("http") ? url : `https://${url}`;
  return "https://example.com";
}

export function buildWelcomeMessage(tenantName: string): FlexContainer {
  return {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: `ยินดีต้อนรับสู่ ${tenantName}`,
          weight: "bold",
          size: "xl",
          wrap: true,
        },
        {
          type: "text",
          text: "พิมพ์ \"จอง\" เพื่อเริ่มต้นการจองคิว",
          size: "md",
          wrap: true,
          margin: "md",
        },
      ],
    },
  };
}

export function buildBookingConfirmMessage(booking: {
  id: string;
  date: string;
  startTime: string;
  serviceName: string;
  staffName: string;
}): FlexContainer {
  return {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "ยืนยันการจอง",
          weight: "bold",
          size: "xl",
          wrap: true,
        },
        {
          type: "text",
          text: `วันที่: ${booking.date}\nเวลา: ${booking.startTime}\nบริการ: ${booking.serviceName}\nช่าง: ${booking.staffName}`,
          size: "md",
          wrap: true,
          margin: "md",
        },
      ],
    },
    footer: {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "button",
          action: {
            type: "postback",
            label: "ยืนยัน",
            data: `confirm_booking:${booking.id}`,
          },
          style: "primary",
        },
        {
          type: "button",
          action: {
            type: "postback",
            label: "เปลี่ยนเวลา",
            data: `reschedule:${booking.id}`,
          },
        },
        {
          type: "button",
          action: {
            type: "postback",
            label: "ยกเลิก",
            data: `cancel_booking:${booking.id}`,
          },
          style: "secondary",
        },
      ],
    },
  };
}

export function buildBookingSuccessMessage(booking: Booking): FlexContainer {
  return {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "จองสำเร็จ",
          weight: "bold",
          size: "xl",
          wrap: true,
        },
        {
          type: "text",
          text: `วันที่: ${booking.date}\nเวลา: ${booking.startTime}\nบริการ: ${booking.serviceName}\nช่าง: ${booking.staffName}`,
          size: "md",
          wrap: true,
          margin: "md",
        },
      ],
    },
  };
}

export function buildBookingCancelledMessage(booking: Booking): FlexContainer {
  return {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "ยกเลิกการจองแล้ว",
          weight: "bold",
          size: "xl",
          wrap: true,
        },
        {
          type: "text",
          text: `การจองวันที่ ${booking.date} เวลา ${booking.startTime} ถูกยกเลิกแล้ว`,
          size: "md",
          wrap: true,
          margin: "md",
        },
      ],
    },
  };
}

export function buildAdminNewBookingMessage(
  booking: { id: string; date: string; startTime: string },
  customerName: string,
  serviceName: string,
  staffName: string
): FlexContainer {
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "การจองใหม่",
          weight: "bold",
          size: "xl",
          color: "#ffffff",
          wrap: true,
        },
      ],
      backgroundColor: "#059669",
      paddingAll: "md",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "ลูกค้า",
              size: "xs",
              color: "#71717a",
              wrap: true,
            },
            {
              type: "text",
              text: customerName,
              size: "md",
              weight: "bold",
              wrap: true,
            },
          ],
          margin: "sm",
        },
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "บริการ",
              size: "xs",
              color: "#71717a",
              wrap: true,
            },
            {
              type: "text",
              text: serviceName,
              size: "md",
              wrap: true,
            },
          ],
          margin: "sm",
        },
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "พนักงาน",
              size: "xs",
              color: "#71717a",
              wrap: true,
            },
            {
              type: "text",
              text: staffName,
              size: "md",
              wrap: true,
            },
          ],
          margin: "sm",
        },
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "วันที่",
              size: "xs",
              color: "#71717a",
              wrap: true,
            },
            {
              type: "text",
              text: `${booking.date} • ${booking.startTime}`,
              size: "md",
              wrap: true,
            },
          ],
          margin: "sm",
        },
      ],
      paddingAll: "lg",
    },
    footer: {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "button",
          action: {
            type: "postback",
            label: "ยืนยันการจอง",
            data: `action=confirm&bookingId=${booking.id}`,
          },
          style: "primary",
        },
        {
          type: "button",
          action: {
            type: "postback",
            label: "ปฏิเสธการจอง",
            data: `action=admin_cancel&bookingId=${booking.id}`,
          },
          style: "secondary",
        },
      ],
      paddingAll: "md",
    },
  };
}

export function buildAdminBookingCancelledByUserMessage(
  booking: { date: string; startTime: string; serviceName: string },
  customerName: string
): FlexContainer {
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "ลูกค้ายกเลิกการจอง",
          weight: "bold",
          size: "xl",
          color: "#ffffff",
          wrap: true,
        },
      ],
      backgroundColor: "#71717a",
      paddingAll: "md",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "ลูกค้า",
              size: "xs",
              color: "#71717a",
              wrap: true,
            },
            {
              type: "text",
              text: customerName,
              size: "md",
              weight: "bold",
              wrap: true,
            },
          ],
          margin: "sm",
        },
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "บริการ",
              size: "xs",
              color: "#71717a",
              wrap: true,
            },
            {
              type: "text",
              text: booking.serviceName,
              size: "md",
              wrap: true,
            },
          ],
          margin: "sm",
        },
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "วันที่ • เวลา",
              size: "xs",
              color: "#71717a",
              wrap: true,
            },
            {
              type: "text",
              text: `${booking.date} • ${booking.startTime}`,
              size: "md",
              wrap: true,
            },
          ],
          margin: "sm",
        },
      ],
      paddingAll: "lg",
    },
  };
}

export function buildAdminBookingStatusMessage(booking: Booking): FlexContainer {
  return {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: `สถานะการจอง: ${booking.status}`,
          weight: "bold",
          size: "xl",
          wrap: true,
        },
        {
          type: "text",
          text: `ลูกค้า: ${booking.customerName}\nวันที่: ${booking.date}\nเวลา: ${booking.startTime}\nบริการ: ${booking.serviceName}`,
          size: "md",
          wrap: true,
          margin: "md",
        },
      ],
    },
  };
}

function bookingBodyRow(label: string, value: string) {
  return {
    type: "box" as const,
    layout: "vertical" as const,
    contents: [
      { type: "text" as const, text: label, size: "xs" as const, color: "#71717a" as const, wrap: true },
      { type: "text" as const, text: value, size: "md" as const, wrap: true },
    ],
    margin: "sm" as const,
  };
}

export function buildBookingReceivedMessage(
  booking: Booking,
  tenantName: string
): FlexContainer {
  const base = getBookingBaseUrl();
  const dateFormatted = formatThaiDate(booking.date);
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: "ได้รับการจองแล้ว", weight: "bold", size: "xl", color: "#ffffff", wrap: true },
      ],
      backgroundColor: "#059669",
      paddingAll: "md",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        bookingBodyRow("บริการ", booking.serviceName),
        bookingBodyRow("พนักงาน", booking.staffId === "any" ? "ไม่ระบุ" : booking.staffName),
        bookingBodyRow("วันที่", dateFormatted),
        bookingBodyRow("เวลา", booking.startTime),
        bookingBodyRow("สถานะ", "รอการยืนยัน"),
      ],
      paddingAll: "lg",
    },
    footer: {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "button",
          action: { type: "uri", label: "ตรวจสอบสถานะ", uri: `${base}/booking/${booking.tenantId}/status` },
          style: "primary",
        },
        {
          type: "button",
          action: { type: "postback", label: "ยกเลิกการจอง", data: `action=user_cancel&bookingId=${booking.id}` },
          style: "secondary",
        },
      ],
      paddingAll: "md",
    },
  };
}

export function buildBookingConfirmedMessage(
  booking: Booking,
  tenantName: string
): FlexContainer {
  const base = getBookingBaseUrl();
  const dateFormatted = formatThaiDate(booking.date);
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: "ยืนยันการจองแล้ว", weight: "bold", size: "xl", color: "#ffffff", wrap: true },
      ],
      backgroundColor: "#16a34a",
      paddingAll: "md",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        bookingBodyRow("บริการ", booking.serviceName),
        bookingBodyRow("พนักงาน", booking.staffId === "any" ? "ไม่ระบุ" : booking.staffName),
        bookingBodyRow("วันที่", dateFormatted),
        bookingBodyRow("เวลา", booking.startTime),
        bookingBodyRow("สถานะ", "ยืนยันแล้ว"),
      ],
      paddingAll: "lg",
    },
    footer: {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "button",
          action: { type: "uri", label: "ตรวจสอบสถานะ", uri: `${base}/booking/${booking.tenantId}/status` },
          style: "primary",
        },
        {
          type: "button",
          action: { type: "postback", label: "เลื่อนนัด", data: `action=reschedule&bookingId=${booking.id}` },
        },
        {
          type: "button",
          action: { type: "postback", label: "ยกเลิกการจอง", data: `action=user_cancel&bookingId=${booking.id}` },
          style: "secondary",
        },
      ],
      paddingAll: "md",
    },
  };
}

export function buildBookingCancelledByAdminMessage(
  booking: Booking,
  tenantName: string
): FlexContainer {
  const base = getBookingBaseUrl();
  const dateFormatted = formatThaiDate(booking.date);
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: "การจองถูกยกเลิก", weight: "bold", size: "xl", color: "#ffffff", wrap: true },
      ],
      backgroundColor: "#dc2626",
      paddingAll: "md",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        bookingBodyRow("บริการ", booking.serviceName),
        bookingBodyRow("วันที่", dateFormatted),
        bookingBodyRow("เวลา", booking.startTime),
        {
          type: "text",
          text: "ร้านได้ยกเลิกการจองของคุณ",
          size: "md",
          wrap: true,
          margin: "md",
          color: "#71717a",
        },
      ],
      paddingAll: "lg",
    },
    footer: {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "button",
          action: { type: "uri", label: "จองใหม่", uri: `${base}/booking/${booking.tenantId}` },
          style: "primary",
        },
      ],
      paddingAll: "md",
    },
  };
}

export function buildRescheduleMessage(
  booking: Booking,
  tenantName: string
): FlexContainer {
  const base = getBookingBaseUrl();
  const dateFormatted = formatThaiDate(booking.date);
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: "เลื่อนนัดหมาย", weight: "bold", size: "xl", color: "#ffffff", wrap: true },
      ],
      backgroundColor: "#059669",
      paddingAll: "md",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        bookingBodyRow("การจองปัจจุบัน", `${booking.serviceName}`),
        bookingBodyRow("พนักงาน", booking.staffId === "any" ? "ไม่ระบุ" : booking.staffName),
        bookingBodyRow("วันที่", dateFormatted),
        bookingBodyRow("เวลา", booking.startTime),
      ],
      paddingAll: "lg",
    },
    footer: {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "button",
          action: {
            type: "uri",
            label: "เลือกวันเวลาใหม่",
            uri: `${base}/booking/${booking.tenantId}/reschedule/${booking.id}`,
          },
          style: "primary",
        },
      ],
      paddingAll: "md",
    },
  };
}

export function buildReminderMessage(
  booking: Booking,
  tenantName: string
): FlexContainer {
  const base = getBookingBaseUrl();
  const dateFormatted = formatThaiDate(booking.date);
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: "แจ้งเตือนนัดหมายพรุ่งนี้", weight: "bold", size: "xl", color: "#ffffff", wrap: true },
      ],
      backgroundColor: "#059669",
      paddingAll: "md",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        bookingBodyRow("บริการ", booking.serviceName),
        bookingBodyRow("พนักงาน", booking.staffId === "any" ? "ไม่ระบุ" : booking.staffName),
        bookingBodyRow("วันที่", dateFormatted),
        bookingBodyRow("เวลา", booking.startTime),
      ],
      paddingAll: "lg",
    },
    footer: {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "button",
          action: {
            type: "uri",
            label: "ดูรายละเอียด",
            uri: `${base}/booking/${booking.tenantId}/status`,
          },
          style: "primary",
        },
        {
          type: "button",
          action: {
            type: "postback",
            label: "ยกเลิกการจอง",
            data: `action=user_cancel&bookingId=${booking.id}`,
          },
          style: "secondary",
        },
      ],
      paddingAll: "md",
    },
  };
}
