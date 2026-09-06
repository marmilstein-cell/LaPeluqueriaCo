"use client";
// BARDOS — shell común de los pasos del Session Builder
import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function StepShell({
  n,
  title,
  question,
  hint,
  children,
}: {
  n: string;
  title: string;
  question: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      // ENTRADA (capa 2-c): el paso se "corta" desde arriba — splice de película.
      // SALIDA: fade-up como siempre (el corte entra, nunca sale cortando).
      initial={{ clipPath: "inset(0 0 100% 0)", y: 12, opacity: 0.4 }}
      animate={{ clipPath: "inset(0 0 0% 0)", y: 0, opacity: 1 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-baseline justify-between border-b border-line pb-4">
        <h3 className="font-display text-[clamp(24px,2.6vw,38px)] text-offwhite">
          <span className="text-smoke">{n}</span> {title}
        </h3>
        <span className="type-micro hidden text-smoke sm:block">{question}</span>
      </div>
      {hint && <p className="font-system mt-4 text-[13px] text-bone/80">{hint}</p>}
      <div className="mt-6">{children}</div>
    </motion.div>
  );
}
