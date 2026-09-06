"use client";
// BARDOS — providers raíz: React Query + Lenis (scroll cinematográfico)
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Lenis from "lenis";
import { useReducedMotion } from "framer-motion";

function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  // Acá SÍ va el hook de framer-motion y no useReducedMotionSafe: este valor
  // solo se lee dentro de un effect (nunca se rendea), así que no puede causar
  // mismatch de hidratación. Con la versión "safe" el primer render daría false,
  // Lenis se crearía y se destruiría al toque sin que nadie lo use.
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.6,
      wheelMultiplier: 0.95,
    });
    lenisRef.current = lenis;
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reduced]);

  // API global para navegar por escenas: scrollToId + cut flash lo maneja el router
  useEffect(() => {
    (window as Window & { __lenis?: Lenis }).__lenis = lenisRef.current ?? undefined;
  });

  return <>{children}</>;
}

export function scrollToScene(id: string, opts?: { immediate?: boolean }) {
  const el = document.getElementById(id);
  if (!el) return;
  const lenis = (window as Window & { __lenis?: Lenis }).__lenis;
  if (lenis && !opts?.immediate) {
    lenis.scrollTo(el, { duration: 1.6 });
  } else {
    el.scrollIntoView({ behavior: opts?.immediate ? "auto" : "smooth" });
  }
}

export function BardosProviders({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      <SmoothScroll>{children}</SmoothScroll>
    </QueryClientProvider>
  );
}
