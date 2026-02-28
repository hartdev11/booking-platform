import { create } from "zustand";
import type { BookingFlowState } from "@/types";

export interface LineProfileState {
  userId: string;
  displayName: string;
  pictureUrl: string;
}

interface BookingFlowStore {
  tenantId: string | null;
  customerId: string | null;
  lineProfile: LineProfileState | null;
  state: BookingFlowState;
  selectedDate: string | null;
  selectedTime: string | null;
  selectedServiceId: string | null;
  selectedServiceName: string | null;
  selectedStaffId: string | null;
  selectedStaffName: string | null;
  setDate: (date: string | null) => void;
  setTime: (time: string | null) => void;
  setService: (serviceId: string | null, serviceName?: string | null) => void;
  setStaff: (staffId: string | null, staffName?: string | null) => void;
  setLineProfile: (profile: LineProfileState | null) => void;
  reset: () => void;
  nextStep: () => void;
  prevStep: () => void;
}

const initialState = {
  tenantId: null as string | null,
  customerId: null as string | null,
  lineProfile: null as LineProfileState | null,
  state: "idle" as BookingFlowState,
  selectedDate: null as string | null,
  selectedTime: null as string | null,
  selectedServiceId: null as string | null,
  selectedServiceName: null as string | null,
  selectedStaffId: null as string | null,
  selectedStaffName: null as string | null,
};

const stateOrder: BookingFlowState[] = [
  "idle",
  "selecting_date",
  "selecting_time",
  "selecting_service",
  "selecting_staff",
  "confirming",
  "completed",
];

export const useBookingFlowStore = create<BookingFlowStore>((set) => ({
  ...initialState,
  setDate: (date) => set({ selectedDate: date }),
  setTime: (time) => set({ selectedTime: time }),
  setService: (serviceId, serviceName) =>
    set({ selectedServiceId: serviceId, selectedServiceName: serviceName ?? null }),
  setStaff: (staffId, staffName) =>
    set({ selectedStaffId: staffId, selectedStaffName: staffName ?? null }),
  setLineProfile: (profile) => set({ lineProfile: profile }),
  reset: () => set(initialState),
  nextStep: () =>
    set((s) => {
      const idx = stateOrder.indexOf(s.state);
      const next = stateOrder[Math.min(idx + 1, stateOrder.length - 1)];
      return { state: next };
    }),
  prevStep: () =>
    set((s) => {
      const idx = stateOrder.indexOf(s.state);
      const prev = stateOrder[Math.max(idx - 1, 0)];
      return { state: prev };
    }),
}));
