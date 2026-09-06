"use client";
// LaPeluqueriaCo — prefers-reduced-motion sin romper la hidratación.
//
// EL PROBLEMA. useReducedMotion() de framer-motion hace, textualmente:
//
//     !hasReducedMotionListener.current && initPrefersReducedMotion();
//     const [shouldReduceMotion] = useState(prefersReducedMotion.current);
//
// initPrefersReducedMotion() lee matchMedia de entrada, así que en el cliente
// el valor ya es `true` en el PRIMER render — el de hidratación. El server, que
// no tiene matchMedia, renderizó `null`. Resultado: para cualquier componente
// cuyo output dependa de `reduced`, el HTML del server y el primer render del
// cliente no coinciden, React descarta el árbol entero y lo vuelve a renderizar
// desde cero, con un error de hidratación en consola. En una máquina con
// Reduced Motion activado eso le pasaba a la home completa, en cada carga.
//
// LA SOLUCIÓN. useSyncExternalStore es exactamente la API de React para esto:
// usa getServerSnapshot() tanto en el server COMO en el render de hidratación
// del cliente, y recién después pasa a getSnapshot(). Los dos lados arrancan en
// `false` y coinciden siempre; el valor real llega en un re-render normal.
// Es el mismo idioma que ya usan passes.ts y TheSpace.tsx en este repo.
//
// De yapa, esto reacciona a cambios de la preferencia en vivo — algo que el hook
// de framer-motion no hace (tiene un TODO al respecto en su código).
//
// EL PRECIO. Quien pidió no tener movimiento ve un frame con movimiento antes
// del switch. Es inevitable: la preferencia vive en el navegador y el server no
// tiene forma de conocerla al generar el HTML. Un frame de más es mucho mejor
// que descartar y rehacer todo el árbol en cada carga.
import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

// booleano: primitivo, así que la identidad es estable entre llamadas
// (requisito de useSyncExternalStore para no entrar en loop de renders).
const getSnapshot = () => window.matchMedia(QUERY).matches;

// server + render de hidratación: sin preferencia conocida, sin mismatch.
const getServerSnapshot = () => false;

export function useReducedMotionSafe(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
