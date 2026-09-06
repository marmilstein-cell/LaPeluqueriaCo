"use client";
// LaPeluqueriaCo — Menú full-screen: otra escena de la película, no un dropdown.
// Ocho ítems numerados, tipografía gigante, reacción sutil al cursor sobre las palabras.
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { scrollToScene } from "./providers";
import { PassLookup } from "./PassLookup";
import { usePasses, openPass } from "@/lib/bardos/passes";
import { useFocusTrap } from "./useFocusTrap";

const ITEMS = [
  { n: "01", label: "INICIO", target: "opening" },
  { n: "02", label: "TURNO", target: "book" },
  { n: "03", label: "EL MANIFIESTO", target: "manifiesto" },
  { n: "04", label: "EL BARBERO", target: "artists" },
  { n: "05", label: "EL OFICIO", target: "craft" },
  { n: "06", label: "EL CORTE", target: "the-cut" },
  { n: "07", label: "EL ARCHIVO", target: "archive" },
  { n: "08", label: "EL CUARTO", target: "space" },
];

export function MenuOverlay({ onClose }: { onClose: () => void }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const recent = usePasses();
  const ref = useRef<HTMLDivElement>(null);

  // focus trap: Tab/Shift+Tab ciclan acá, Escape cierra, foco vuelve al MENÚ
  useFocusTrap(true, ref, { onEsc: onClose });

  const go = (target: string) => {
    onClose();
    // EXPAND → CUT: el menú se corta y navegamos
    setTimeout(() => scrollToScene(target), 80);
  };

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label="Menú Bardos"
      className="fixed inset-0 z-[75] flex flex-col bg-black"
      initial={{ clipPath: "inset(0 0 100% 0)" }}
      animate={{ clipPath: "inset(0 0 0% 0)" }}
      exit={{ clipPath: "inset(0 0 100% 0)" }}
      transition={{ duration: 0.55, ease: [0.85, 0, 0.15, 1] }}
    >
      {/* metadata de escena */}
      <div className="flex items-center justify-between" style={{ padding: "22px var(--grid-margin)" }}>
        <span className="type-micro text-smoke">LaPeluqueriaCo / MENÚ</span>
        <button onClick={onClose} className="b-link" aria-label="Cerrar menú">
          CERRAR ×
        </button>
      </div>

      <ul className="flex flex-1 flex-col justify-center" style={{ padding: "0 var(--grid-margin)" }}>
        {ITEMS.map((item, i) => (
          <li key={item.n} className="border-b border-line last:border-b-0">
            <button
              onClick={() => go(item.target)}
              onPointerEnter={() => setHovered(i)}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
              className="group flex w-full items-baseline gap-5 py-2.5 text-left md:gap-10 md:py-4"
            >
              <motion.span
                animate={{ color: hovered === i ? "var(--color-red)" : "var(--color-smoke)" }}
                className="font-system text-[10px] tracking-[0.3em] md:text-[11px]"
              >
                {item.n}
              </motion.span>
              <motion.span
                animate={{
                  x: hovered === i ? 18 : 0,
                  color: hovered === i ? "var(--color-offwhite)" : "var(--color-chalk)",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
                className="font-display font-display-tight text-[11vw] leading-[0.95] md:text-[6.5vw]"
              >
                {item.label}
              </motion.span>
            </button>
          </li>
        ))}
      </ul>

      <div
        className="flex flex-wrap items-end justify-between gap-6 pb-8"
        style={{ padding: "0 var(--grid-margin)" }}
      >
        {/* historial local de pases (08.8) + lookup por código */}
        <div className="min-w-[240px] max-w-sm">
          {recent.length > 0 && (
            <div className="mb-4">
              <p className="type-micro mb-2 text-smoke">TUS ÚLTIMOS PASES</p>
              <div className="flex flex-wrap gap-2">
                {recent.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onClose();
                      openPass(p.id);
                    }}
                    className="border border-line px-3 py-1.5 font-system text-[11px] tracking-[0.14em] text-bone transition-colors duration-200 hover:border-red hover:text-offwhite"
                  >
                    {p.id}
                  </button>
                ))}
              </div>
            </div>
          )}
          <PassLookup onDone={onClose} />
        </div>
        <div className="flex flex-col items-start gap-1 text-smoke sm:items-end sm:text-right">
          <span className="type-micro">CABA — NEUQUÉN</span>
          <span className="type-micro">MAR–SÁB / 10–20 HS</span>
          <span className="type-micro mt-2 hidden md:inline-flex md:items-center md:gap-2">
            <kbd
              className="border border-line px-1.5 py-0.5 font-system text-[10px] text-bone/80"
              aria-hidden="true"
            >
              ESC
            </kbd>
            CIERRA
          </span>
        </div>
      </div>
    </motion.div>
  );
}
