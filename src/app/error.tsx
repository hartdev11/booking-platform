"use client";

import { useEffect } from "react";

/**
 * Error boundary for the app. Catches render errors and errors in React tree.
 * For Firestore SDK internal assertion errors (unhandled promise rejections),
 * see FirestoreErrorHandler in layout.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error boundary caught:", error);
  }, [error]);

  const isFirestoreAssertion =
    error?.message?.includes("INTERNAL ASSERTION FAILED") ||
    error?.message?.includes("Unexpected state");

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-lg font-semibold text-red-600">
        {isFirestoreAssertion ? "Connection error" : "Something went wrong"}
      </h2>
      <p className="max-w-md text-sm text-gray-600">
        {isFirestoreAssertion
          ? "A temporary issue occurred with the data connection. Please try again."
          : "An unexpected error occurred. You can try again."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        Try again
      </button>
    </div>
  );
}
