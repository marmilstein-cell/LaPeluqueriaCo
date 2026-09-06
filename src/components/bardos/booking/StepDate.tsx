"use client";
// BARDOS — Session Builder, paso 03: FECHA ("¿CUÁNDO?")
// Calendario bespoke: grilla editorial de días, pensada para pulgar en mobile.
import { motion } from "framer-motion";
import { StepShell } from "./StepShell";
import { bookableDates, formatDayLabel, nowBuenosAires, formatLongDate } from "@/lib/bardos/domain";
import { useBooking, haptic } from "@/store/booking";

export function StepDate() {
  const { date, setDate, next, reschedulingId } = useBooking();
  const dates = bookableDates();
  const today = nowBuenosAires().iso;

  const choose = (iso: string) => {
    haptic(12);
    setDate(iso);
    setTimeout(() => next(), 380);
  };

  return (
    <StepShell
      n="03"
      title="FECHA"
      question="¿CUÁNDO?"
      hint="Próximas tres semanas. Cerramos domingo y lunes."
    >
      <div
        role="radiogroup"
        aria-label="Elegí el día"
        className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 md:grid md:grid-cols-7 md:gap-2 md:overflow-visible md:px-0"
      >
        {dates.map((iso) => {
          const { day, num, month } = formatDayLabel(iso);
          const selected = date === iso;
          const isToday = iso === today;
          return (
            <button
              key={iso}
              role="radio"
              aria-checked={selected}
              aria-label={formatLongDate(iso)}
              onClick={() => choose(iso)}
              className={`chip-cutline group relative flex w-[74px] shrink-0 snap-start flex-col items-center border py-4 transition-colors duration-300 md:w-auto ${
                selected
                  ? "border-red bg-coal"
                  : "border-line hover:border-bone/40"
              }`}
            >
              <span
                className={`type-micro ${selected ? "text-red" : "text-smoke"}`}
              >
                {day}
              </span>
              <span
                className={`font-display mt-1 text-[clamp(22px,2vw,30px)] ${
                  selected ? "text-offwhite" : "text-chalk/70 group-hover:text-chalk"
                }`}
              >
                {num}
              </span>
              <span className="type-micro text-smoke">{month}</span>
              {isToday && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 type-micro bg-black text-red">
                  HOY
                </span>
              )}
              {selected && (
                <motion.span
                  layoutId="date-cut"
                  className="absolute bottom-0 left-0 h-[2px] w-full bg-red"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>
      {reschedulingId && (
        <p className="type-micro mt-4 text-red">
          REPROGRAMANDO — {reschedulingId}
        </p>
      )}
    </StepShell>
  );
}

