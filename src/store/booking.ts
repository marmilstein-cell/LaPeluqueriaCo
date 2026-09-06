"use client";
// LaPeluqueriaCo — estado del Session Builder (Zustand + sessionStorage)
// Persiste entre pasos y sobrevive a un refresh accidental (brief 21).
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Customer, Session } from "@/lib/bardos/domain";

export type Step = 1 | 2 | 3 | 4 | 5 | 6;

interface BookingState {
  step: Step;
  serviceId: string | null;
  artistId: string | null;
  date: string | null; // ISO
  time: string | null; // "18:30"
  customer: Customer;
  session: Session | null; // resultado confirmado
  // reprogramación: id de la sesión que se está moviendo
  reschedulingId: string | null;
  // slot "cortado" mientras se confirmaba (edge case 08.10)
  cutSlot: { date: string; time: string } | null;

  setService: (id: string) => void;
  setArtist: (id: string) => void;
  setDate: (iso: string) => void;
  setTime: (t: string) => void;
  setCustomer: (c: Partial<Customer>) => void;
  goTo: (s: Step) => void;
  next: () => void;
  back: () => void;
  setSession: (s: Session | null) => void;
  startReschedule: (s: Session) => void;
  setCutSlot: (c: { date: string; time: string } | null) => void;
  reset: (opts?: { keepCustomer?: boolean }) => void;
}

export const useBooking = create<BookingState>()(
  persist(
    (set, get) => ({
      step: 1,
      serviceId: null,
      artistId: null,
      date: null,
      time: null,
      customer: { name: "", phone: "", email: "", notes: "" },
      session: null,
      reschedulingId: null,
      cutSlot: null,

      setService: (id) => set({ serviceId: id, artistId: null, date: null, time: null, cutSlot: null }),
      setArtist: (id) => set({ artistId: id, date: null, time: null, cutSlot: null }),
      setDate: (iso) => set({ date: iso, time: null, cutSlot: null }),
      setTime: (t) => set({ time: t, cutSlot: null }),
      setCustomer: (c) => set({ customer: { ...get().customer, ...c } }),
      goTo: (s) => set({ step: s }),
      next: () => set({ step: Math.min(6, get().step + 1) as Step }),
      back: () => set({ step: Math.max(1, get().step - 1) as Step }),
      setSession: (s) => set({ session: s }),
      startReschedule: (s) =>
        set({
          reschedulingId: s.id,
          serviceId: s.serviceId,
          artistId: s.artistId,
          date: null,
          time: null,
          step: 3,
          session: null,
          cutSlot: null,
        }),
      setCutSlot: (c) => set({ cutSlot: c }),
      reset: (opts) =>
        set({
          step: 1,
          serviceId: null,
          artistId: null,
          date: null,
          time: null,
          session: null,
          reschedulingId: null,
          cutSlot: null,
          customer: opts?.keepCustomer
            ? get().customer
            : { name: "", phone: "", email: "", notes: "" },
        }),
    }),
    {
      name: "bardos-session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({
        step: s.step,
        serviceId: s.serviceId,
        artistId: s.artistId,
        date: s.date,
        time: s.time,
        customer: s.customer,
        session: s.session,
        reschedulingId: s.reschedulingId,
      }),
    }
  )
);

/** Feedback háptico sutil (mobile) — opcional, silencioso si no hay soporte. */
export function haptic(pattern: number | number[] = 12) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    /* sin soporte: silencio */
  }
}
