"use client";
// LaPeluqueriaCo — Session Builder, paso 01: SERVICIO ("¿QUÉ TE CORTAMOS?")
import { motion } from "framer-motion";
import type { Service } from "@/lib/bardos/domain";
import { priceARS } from "@/lib/bardos/domain";
import { useBooking, haptic } from "@/store/booking";
import { StepShell } from "./StepShell";

export function StepService({ services }: { services: Service[] }) {
  const { serviceId, setService, next, reschedulingId } = useBooking();

  const choose = (id: string) => {
    if (reschedulingId) return;
    haptic(12);
    setService(id);
    // SNAP: la elección se fija y el flujo avanza
    setTimeout(() => next(), 420);
  };

  return (
    <StepShell n="01" title="SERVICIO" question="¿QUÉ TE CORTAMOS?" hint="Elegí el servicio de tu sesión.">
      <ul className="flex flex-col" aria-label="Servicios">
        {services.map((s) => {
          const selected = serviceId === s.id;
          return (
            <li key={s.id}>
              <button
                onClick={() => choose(s.id)}
                disabled={!!reschedulingId}
                aria-pressed={selected}
                className="group relative block w-full border-b border-line py-5 text-left transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <motion.span
                  className="absolute inset-y-0 left-0 w-[2px] bg-red"
                  initial={false}
                  animate={{ scaleY: selected ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: [0.2, 0.9, 0.25, 1.15] }}
                />
                <motion.span
                  animate={{ x: selected ? 10 : 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 30 }}
                  className="flex flex-wrap items-baseline gap-x-4 gap-y-1"
                >
                  <span
                    className={`font-display font-display-tight text-[clamp(26px,3.2vw,44px)] transition-colors duration-300 ${
                      selected ? "text-offwhite" : "text-chalk/60 group-hover:text-chalk"
                    }`}
                  >
                    {s.name}
                  </span>
                  <span className="font-system hidden text-[12px] text-smoke sm:block">{s.nameEs}</span>
                  <span className="ml-auto flex items-baseline gap-5">
                    <span className="type-mono-label text-bone">{s.durationMinutes}′</span>
                    <span className="font-display text-[clamp(15px,1.4vw,22px)] text-offwhite">
                      {priceARS(s.price)}
                    </span>
                  </span>
                </motion.span>
                <span
                  className={`block overflow-hidden pl-2 font-editorial-italic text-[15px] leading-[1.4] text-bone/70 transition-all duration-500 ${
                    selected ? "mt-2 max-h-16 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  {s.desc}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </StepShell>
  );
}
