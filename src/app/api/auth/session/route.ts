import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_SEC = 60 * 60 * 24 * 7;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idToken = body.idToken as string | undefined;
    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        { error: "Missing idToken" },
        { status: 400 }
      );
    }
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SEVEN_DAYS_MS,
    });
    const response = NextResponse.json({ success: true });
    const isProduction = process.env.NODE_ENV === "production";
    response.cookies.set("session", sessionCookie, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: SEVEN_DAYS_SEC,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set("session", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
