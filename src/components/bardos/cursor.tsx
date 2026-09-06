"use client";
// BARDOS — cursor contextual (sección 11.1)
// Casi invisible: un punto de 4px que se vuelve rojo sobre interacción/booking.
// Nunca protagonista. En touch: no existe.
import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [variant, setVariant] = useState<"default" | "active" | "booking">("default");
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 900, damping: 60, mass: 0.2 });
  const sy = useSpring(y, { stiffness: 900, damping: 60, mass: 0.2 });

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    // Detección client-only de capacidad: es el patraje intencional
    // (el cursor no existe en SSR ni en touch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(true);

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const el = (e.target as HTMLElement)?.closest?.(
        "a, button, [role='button'], input, textarea, select, label, [data-cursor]"
      ) as HTMLElement | null;
      if (!el) {
        setVariant("default");
        return;
      }
      const zone = el.closest("[data-zone='booking']");
      setVariant(zone ? "booking" : "active");
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, [x, y]);

  if (!enabled) return null;

  const size = variant === "default" ? 4 : 7;
  const color = variant === "default" ? "var(--color-bone)" : "var(--color-red)";

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed z-[90] hidden md:block"
      style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
    >
      <motion.div
        animate={{ width: size, height: size, backgroundColor: color }}
        transition={{ duration: 0.14, ease: "easeOut" }}
        style={{ borderRadius: 1 }}
      />
    </motion.div>
  );
}

/** Grain fotográfico global — atmósfera, no contenido. */
export function Grain() {
  return <div className="grain-layer" aria-hidden="true" />;
}
