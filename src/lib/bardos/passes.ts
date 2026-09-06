"use client";
// LaPeluqueriaCo — registro local de pases de sesión (brief 08.8: cuenta/historial por cliente).
// Los pases creados desde este navegador quedan acá — sin cuentas, sin servidores
// extra, sin cookies: la honestidad de siempre. Máximo 12, dedupe, orden reciente.
import { useSyncExternalStore } from "react";

const KEY = "bardos-passes";
const EVENT = "bardos:passes";

export interface PassRef {
  id: string; // BRD-XXXX
  createdAt: string; // ISO
}

/** Snapshot estable: misma referencia mientras no cambie el localStorage
 *  (requisito de useSyncExternalStore — evita loops de render). */
const EMPTY: PassRef[] = [];
let cache: { raw: string | null; passes: PassRef[] } = { raw: null, passes: EMPTY };

function read(): PassRef[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === cache.raw) return cache.passes;
    if (!raw) {
      cache = { raw: null, passes: EMPTY };
      return EMPTY;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      cache = { raw, passes: EMPTY };
      return EMPTY;
    }
    const passes = parsed
      .filter(
        (p): p is PassRef =>
          !!p && typeof p.id === "string" && /^BRD-\d{3,6}$/i.test(p.id)
      )
      .slice(0, 12);
    cache = { raw, passes };
    return passes;
  } catch {
    cache = { raw: null, passes: EMPTY };
    return EMPTY;
  }
}

function write(passes: PassRef[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(passes.slice(0, 12)));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* storage lleno o bloqueado: silencio */
  }
}

/** Guarda (o re-apila como más reciente) un pase creado ahora. */
export function rememberPass(id: string) {
  if (!/^BRD-\d{3,6}$/i.test(id)) return;
  const next = [
    { id: id.toUpperCase(), createdAt: new Date().toISOString() },
    ...read().filter((p) => p.id.toUpperCase() !== id.toUpperCase()),
  ];
  write(next);
}

/** Quita un pase del registro local (no toca el server). */
export function forgetPass(id: string) {
  write(read().filter((p) => p.id !== id.toUpperCase()));
}

/** Normaliza input de lookup: "247", "brd-247", "BRD-0247" → "BRD-0247". */
export function normalizePass(input: string): string | null {
  const trimmed = input.trim().toUpperCase().replace(/\s+/g, "");
  let digits: string | null = null;
  if (/^BRD-?\d{3,6}$/.test(trimmed)) {
    digits = trimmed.replace(/^BRD-?/, "");
  } else if (/^\d{3,6}$/.test(trimmed)) {
    digits = trimmed;
  }
  return digits ? `BRD-${digits.padStart(4, "0")}` : null;
}

/** Store externo reactivo: componentes se re-renderizan cuando cambia el registro. */
export function usePasses(): PassRef[] {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener(EVENT, onChange);
      window.addEventListener("storage", onChange);
      return () => {
        window.removeEventListener(EVENT, onChange);
        window.removeEventListener("storage", onChange);
      };
    },
    () => read(),
    () => EMPTY
  );
}

/** Abre un pase por su hash real: #session/BRD-XXXX.
 *  Si ya estamos en ese hash (re-click tras error), fuerza re-consulta. */
export function openPass(id: string) {
  if (typeof window === "undefined") return;
  const target = `#session/${id.toUpperCase()}`;
  if (window.location.hash === target) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    window.dispatchEvent(new CustomEvent("bardos:refetch-session"));
    return;
  }
  window.location.hash = target;
}
