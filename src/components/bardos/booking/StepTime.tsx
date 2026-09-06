"use client";
// BARDOS — Session Builder, paso 04: HORA ("¿CUÁNDO?")
// Slots reales desde la API. Los tomados llegan cortados (metáfora central).
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { fetchAvailability } from "@/lib/bardos/client";
import { formatLongDate } from "@/lib/bardos/domain";
import { useBooking, haptic } from "@/store/booking";
import { StepShell } from "./StepShell";

export function StepTime() {
  const { serviceId, artistId, date, time, setTime, next, cutSlot } = useBooking();

  const enabled = !!(serviceId && artistId && date);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["availability", artistId, serviceId, date],
    queryFn: () => fetchAvailability(artistId!, serviceId!, date!),
    enabled,
    refetchInterval: 30_000, // refresco silencioso: los turnos se cortan en vivo
  });

  const choose = (t: string) => {
    haptic(12);
    setTime(t);
    setTimeout(() => next(), 380);
  };

  const slots = data?.slots ?? [];
  const anyAvailable = slots.some((s) => s.available);

  return (
    <StepShell
      n="04"
      title="HORA"
      question="¿CUÁNDO?"
      hint={date ? `Turnos para ${formatLongDate(date)}.` : undefined}
    >
      {isLoading && <SlotsLoading />}
      {isError && (
        <p className="font-system text-[13px] text-red">
          Se cortó la conexión con el local. Dale otra vez en un segundo.
        </p>
      )}
      {!isLoading && !isError && (
        <>
          {!anyAvailable && (
            <div className="border border-line bg-coal p-6">
              <p className="font-editorial-italic text-[19px] text-chalk">
                No queda nada este día.
              </p>
              <p className="font-system mt-2 text-[13px] text-bone/80">
                Alguien se adelantó. Probá otro día — el paso anterior te espera.
              </p>
              <button onClick={() => useBooking.getState().goTo(3)} className="b-link mt-4">
                ELEGIR OTRO DÍA →
              </button>
            </div>
          )}
          {anyAvailable && (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:gap-3 lg:grid-cols-6" role="radiogroup" aria-label="Horarios">
              {slots.map((s) => {
                const selected = time === s.time;
                const cut = cutSlot && cutSlot.date === date && cutSlot.time === s.time;
                const disabled = !s.available;
                return (
                  <button
                    key={s.id}
                    role="radio"
                    aria-checked={selected}
                    aria-disabled={disabled}
                    disabled={disabled}
                    onClick={() => choose(s.time)}
                    className={`chip-cutline relative border py-3.5 font-system text-[14px] tracking-[0.06em] transition-all duration-200 ${
                      cut
                        ? "slot-cut"
                        : selected
                        ? "border-red bg-red/10 text-offwhite"
                        : disabled
                        ? "cursor-not-allowed border-line/50 text-smoke/50"
                        : "border-line text-chalk hover:border-bone/50 hover:text-offwhite"
                    }`}
                  >
                    {s.time}
                    {selected && (
                      <motion.span
                        layoutId="time-cut"
                        className="absolute bottom-0 left-0 h-[2px] w-full bg-red"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    {cut && (
                      <span className="type-micro absolute -top-2 right-1 bg-black pl-1 text-red">
                        CORTADO
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          <p className="type-micro mt-5 text-smoke">
            CADA TURNO SE CONFIRMA CONTRA EL LOCAL EN VIVO — SI ALGUIEN LO TOMA ANTES, TE AVISAMOS.
          </p>
        </>
      )}
    </StepShell>
  );
}

/** Placeholder de carga: bloques oscuros con hairline roja latiendo (nada de skeleton gris). */
function SlotsLoading() {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:gap-3 lg:grid-cols-6" aria-hidden="true">
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className="relative border border-line/60 py-3.5">
          <span className="block h-[2px] w-6 bg-red/70 mx-auto animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
        </div>
      ))}
    </div>
  );
}
