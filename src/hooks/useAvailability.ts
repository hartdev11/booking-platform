import { useState, useEffect } from "react";
import {
  getAvailableSlots,
  getAvailableDates,
  type TimeSlot,
} from "@/lib/firebase/availability";

export function useAvailableSlots(
  tenantId: string | null,
  staffId: string | null,
  serviceId: string | null,
  date: string | null
) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tenantId || !date) {
      setSlots([]);
      setLoading(false);
      setError(null);
      return;
    }
    if (!staffId || !serviceId) {
      setSlots([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getAvailableSlots(tenantId, staffId, serviceId, date)
      .then(setSlots)
      .catch((e) => {
        setError(e as Error);
        setSlots([]);
      })
      .finally(() => setLoading(false));
  }, [tenantId, staffId, serviceId, date]);

  return { slots, loading, error };
}

export function useAvailableDates(
  tenantId: string | null,
  staffId: string | null,
  month: string | null
) {
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tenantId || !month) {
      setAvailableDates([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    getAvailableDates(tenantId, staffId, month)
      .then(setAvailableDates)
      .catch((e) => {
        setError(e as Error);
        setAvailableDates([]);
      })
      .finally(() => setLoading(false));
  }, [tenantId, staffId, month]);

  return { availableDates, loading, error };
}
