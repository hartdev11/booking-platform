import { NextResponse } from "next/server";

export enum ErrorCode {
  DOUBLE_BOOKING = "DOUBLE_BOOKING",
  NO_STAFF_AVAILABLE = "NO_STAFF_AVAILABLE",
  INVALID_TRANSITION = "INVALID_TRANSITION",
  UNAUTHORIZED = "UNAUTHORIZED",
  NOT_FOUND = "NOT_FOUND",
  LINE_API_ERROR = "LINE_API_ERROR",
  FIREBASE_ERROR = "FIREBASE_ERROR",
}

export class AppError extends Error {
  code: ErrorCode;
  statusCode: number;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 400
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function handleApiError(error: unknown): NextResponse {
  if (isAppError(error)) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
  return NextResponse.json(
    { error: message, code: ErrorCode.FIREBASE_ERROR },
    { status: 500 }
  );
}
