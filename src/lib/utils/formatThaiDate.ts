const THAI_DAYS = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
const THAI_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

export function formatThaiDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  const dayName = THAI_DAYS[date.getDay()];
  const dayNum = date.getDate();
  const monthName = THAI_MONTHS[(m ?? 1) - 1];
  const buddhistYear = (y ?? 0) + 543;
  return `${dayName}ที่ ${dayNum} ${monthName} ${buddhistYear}`;
}
