import { useState, useEffect } from "react";
import {
  subscribeUpcomingBookings,
  subscribePastBookings,
} from "@/lib/firebase/customerBookings";
import type { Booking } from "@/types";

export function useUpcomingBookings(
  tenantId: string | null,
  lineUserId: string | null
): { bookings: Booking[]; loading: boolean; error: Error | null } {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tenantId || !lineUserId) {
      setBookings([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const unsub = subscribeUpcomingBookings(
      tenantId,
      lineUserId,
      (list) => {
        setBookings(list);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [tenantId, lineUserId]);

  return { bookings, loading, error };
}

export function usePastBookings(
  tenantId: string | null,
  lineUserId: string | null
): { bookings: Booking[]; loading: boolean; error: Error | null } {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tenantId || !lineUserId) {
      setBookings([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const unsub = subscribePastBookings(
      tenantId,
      lineUserId,
      (list) => {
        setBookings(list);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [tenantId, lineUserId]);

  return { bookings, loading, error };
}
