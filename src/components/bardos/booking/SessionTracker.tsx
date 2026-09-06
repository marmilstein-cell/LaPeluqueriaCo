"use client";
// BARDOS — Session Tracker (08.4): el resumen progresivo.
// SERVICIO — — — → SERVICIO — BARBERO — FECHA — HORA → TU TURNO ESTÁ LISTO.
import { motion, AnimatePresence } from "framer-motion";
import { useBooking } from "@/store/booking";

export function SessionTracker() {
  const { step, serviceId, artistId, date, time } = useBooking();

  const items: { label: string; value: string | null; step: number }[] = [
    { label: "SERVICIO", value: serviceId, step: 1 },
    { label: "BARBERO", value: artistId, step: 2 },
    { label: "FECHA", value: date, step: 3 },
    { label: "HORA", value: time, step: 4 },
  ];
  const ready = step === 6 && serviceId && artistId && date && time;

  return (
    <motion.div
      className="sticky top-[68px] z-30 border-y border-line bg-black/90 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      aria-label="Progreso de tu sesión"
    >
      {/* mobile: envuelve a dos líneas (nada cortado); desktop: una línea */}
      <div
        className="flex flex-wrap items-center gap-x-2 gap-y-1.5 px-1 py-3 md:flex-nowrap md:gap-4 md:px-2"
        role="list"
      >
        <span className="type-micro shrink-0 text-red">TU TURNO</span>
        {items.map((it) => (
          <span key={it.label} className="flex shrink-0 items-center gap-2 md:gap-3" role="listitem">
            <span aria-hidden="true" className="h-px w-4 bg-line md:w-6" />
            <span
              className={`type-micro transition-colors duration-300 ${
                it.value ? "text-offwhite" : it.step === step ? "text-bone" : "text-smoke/60"
              }`}
            >
              {it.label}
            </span>
            <AnimatePresence>
              {it.value && (
                <motion.span
                  layout
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 600, damping: 32 }}
                  className="inline-block h-1 w-1 bg-red"
                  aria-label={`${it.label} elegido`}
                />
              )}
            </AnimatePresence>
          </span>
        ))}
        <AnimatePresence>
          {ready && (
            <motion.span
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="type-micro ml-auto shrink-0 text-red"
            >
              TU TURNO ESTÁ LISTO.
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
