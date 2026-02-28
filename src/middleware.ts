import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const WEBHOOK_LIMIT = 100;
const WEBHOOK_WINDOW_MS = 60 * 1000;
const BOOKING_CREATE_LIMIT = 10;
const BOOKING_CREATE_WINDOW_MS = 60 * 1000;

const webhookCounts = new Map<string, { count: number; resetAt: number }>();
const bookingCounts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

function checkRateLimit(
  map: Map<string, { count: number; resetAt: number }>,
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = map.get(key);
  if (!entry) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (now > entry.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

function getTenantIdFromPath(pathname: string): string | null {
  const webhookMatch = pathname.match(/^\/api\/webhook\/line\/([^/]+)/);
  if (webhookMatch) return webhookMatch[1];
  const customerMatch = pathname.match(/^\/api\/customer\/([^/]+)/);
  if (customerMatch) return customerMatch[1];
  return null;
}

function logRequest(pathname: string, method: string, tenantId: string | null, statusCode: number) {
  const tenant = tenantId ?? "-";
  console.log(JSON.stringify({ tenantId: tenant, path: pathname, method, statusCode }));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const tenantId = getTenantIdFromPath(pathname);

  if (pathname.startsWith("/api/webhook/line/")) {
    const ip = getClientIp(request);
    const allowed = checkRateLimit(webhookCounts, ip, WEBHOOK_LIMIT, WEBHOOK_WINDOW_MS);
    if (!allowed) {
      logRequest(pathname, method, tenantId, 429);
      return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    }
  }

  const isBookingCreate =
    method === "POST" &&
    /^\/api\/customer\/[^/]+\/bookings$/.test(pathname);
  if (isBookingCreate) {
    const ip = getClientIp(request);
    const allowed = checkRateLimit(bookingCounts, ip, BOOKING_CREATE_LIMIT, BOOKING_CREATE_WINDOW_MS);
    if (!allowed) {
      logRequest(pathname, method, tenantId, 429);
      return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    }
  }

  if (pathname === "/admin/login") {
    const res = NextResponse.next();
    logRequest(pathname, method, null, res.status);
    return res;
  }
  if (pathname.startsWith("/api/")) {
    const res = NextResponse.next();
    logRequest(pathname, method, tenantId, res.status);
    return res;
  }
  if (pathname.startsWith("/booking/")) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/admin/")) {
    const res = NextResponse.next();
    logRequest(pathname, method, null, res.status);
    return res;
  }

  const res = NextResponse.next();
  logRequest(pathname, method, tenantId, res.status);
  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*", "/booking/:path*"],
};
