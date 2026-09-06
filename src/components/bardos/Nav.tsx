"use client";
// LaPeluqueriaCo — Nav: minimal y contextual. LaPeluqueriaCo / MENÚ / TURNO.
// Se esconde en scroll-down, reaparece en scroll-up. TURNO siempre a una interacción
// — o a una tecla: T es el atajo directo al Session Builder (mientras no se escriba).
// La hairline roja superior mide el progreso del scroll: "el corte avanza".
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValueEvent, useScroll, useSpring } from "framer-motion";
import { MenuOverlay } from "./MenuOverlay";
import { scrollToScene } from "./providers";

export function Nav() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY, scrollYProgress } = useScroll();

  // la línea de corte crece con el progreso del scroll (suavizada)
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > prev && y > 320 && !menuOpen);
    setScrolled(y > 40);
  });

  // cerrar menú con Escape · T = atajo directo al turno (salvo mientras se escribe)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
      if (e.key.toLowerCase() !== "t" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      const writing =
        !!el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable);
      if (writing) return;
      scrollToScene("book");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <motion.header
        animate={{ y: hidden ? "-100%" : "0%" }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed inset-x-0 top-0 z-[70] transition-colors duration-500 ${
          scrolled ? "bg-black/80 backdrop-blur-sm" : "bg-transparent"
        }`}
      >
        {/* EL CORTE AVANZA — hairline de progreso (1px, rojo, grow left→right) */}
        <motion.span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px origin-left bg-red"
          style={{ scaleX: progress, opacity: scrolled ? 0.85 : 0 }}
        />
        <div
          className="flex items-center justify-between"
          style={{
            padding: "20px var(--grid-margin)",
            borderBottom: scrolled ? "1px solid var(--color-line)" : "1px solid transparent",
          }}
        >
          <button
            onClick={() => scrollToScene("opening", { immediate: false })}
            className="font-display text-[15px] tracking-[0.08em] text-offwhite hover:text-red transition-colors duration-200"
            aria-label="Bardos — volver al inicio"
          >
            LaPeluqueriaCo
          </button>

          <nav className="flex items-center gap-8" aria-label="Navegación principal">
            <button
              onClick={() => setMenuOpen(true)}
              className="group relative b-link"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
            >
              MENÚ
            </button>
            <button
              onClick={() => scrollToScene("book")}
              className="group relative font-system text-[11px] font-medium tracking-[0.2em] text-offwhite"
              aria-keyshortcuts="t"
              title="Atajo: tecla T"
            >
              <span className="relative z-10 transition-colors duration-200 group-hover:text-black">
                TURNO
                <span aria-hidden="true" className="ml-2 hidden text-[9px] tracking-[0.15em] text-red/0 transition-colors duration-200 group-hover:text-red md:inline">[T]</span>
              </span>
              <span
                aria-hidden="true"
                className="absolute -inset-x-4 -inset-y-[7px] border border-offwhite transition-all duration-200 group-hover:bg-offwhite group-hover:border-offwhite"
              />
            </button>
          </nav>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && <MenuOverlay onClose={() => setMenuOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
