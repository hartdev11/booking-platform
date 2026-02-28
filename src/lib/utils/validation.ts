import { validateSignature } from "@line/bot-sdk";

const THAI_DAYS = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
const THAI_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

export function validateLineSignature(
  body: string,
  signature: string,
  channelSecret: string
): boolean {
  return validateSignature(body, channelSecret, signature);
}

export function validateThaiPhone(phone: string): boolean {
  const normalized = phone.replace(/\s/g, "").replace(/-/g, "");
  return /^0\d{9}$/.test(normalized) || /^0\d{2}-?\d{3}-?\d{4}$/.test(phone);
}

export function formatThaiDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  const dayName = THAI_DAYS[date.getDay()];
  const dayNum = date.getDate();
  const monthName = THAI_MONTHS[(m ?? 1) - 1];
  const buddhistYear = (y ?? 0) + 543;
  return `${dayName}ที่ ${dayNum} ${monthName} ${buddhistYear}`;
}

export function formatTime(time: string): string {
  const parts = time.split(":");
  const h = parts[0] ?? "00";
  const m = parts[1] ?? "00";
  return `${h}:${m} น.`;
}

export function generateBookingId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BK${ts}${r}`;
}
