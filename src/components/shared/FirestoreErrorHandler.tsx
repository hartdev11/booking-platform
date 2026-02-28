"use client";

import { useEffect } from "react";
import { useToastStore } from "@/stores/toastStore";

const FIRESTORE_ASSERTION =
  /INTERNAL ASSERTION FAILED|Unexpected state \(ID: (ca9|b815)\)/i;

/**
 * Catches Firestore SDK internal assertion errors (unhandled promise rejections)
 * so the app doesn't crash. Shows a toast and prevents the error from propagating.
 */
export function FirestoreErrorHandler() {
  useEffect(() => {
    function handleRejection(event: PromiseRejectionEvent) {
      const msg =
        event?.reason?.message ?? (typeof event?.reason === "string" ? event.reason : "");
      if (FIRESTORE_ASSERTION.test(msg)) {
        event.preventDefault();
        event.stopPropagation();
        useToastStore.getState().error(
          "เกิดข้อผิดพลาดในการเชื่อมต่อข้อมูล กรุณารีเฟรชหน้า"
        );
        return true;
      }
      return false;
    }

    window.addEventListener("unhandledrejection", handleRejection);
    return () => window.removeEventListener("unhandledrejection", handleRejection);
  }, []);

  return null;
}
