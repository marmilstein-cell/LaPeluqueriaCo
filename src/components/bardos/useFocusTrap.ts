"use client";
// BARDOS — focus trap para diálogos modales (menú, pase, cabina).
// Al abrir: guarda el foco previo, enfoca el primero enfocable.
// Tab/Shift+Tab ciclan dentro del contenedor. Al cerrar: restaura el foco.
import { useEffect, type RefObject } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function useFocusTrap(
  active: boolean,
  ref: RefObject<HTMLElement | null>,
  opts?: { onEsc?: () => void }
) {
  const onEsc = opts?.onEsc;

  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;

    const previous = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );

    // foco inicial: primer enfocable (o el contenedor mismo)
    const initial = focusables()[0];
    if (initial) {
      initial.focus();
    } else {
      node.setAttribute("tabindex", "-1");
      node.focus();
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onEsc?.();
        return;
      }
      if (e.key !== "Tab") return;
      const list = focusables();
      if (list.length === 0) {
        e.preventDefault();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      const current = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (current === first || !node.contains(current)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (current === last || !node.contains(current)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    node.addEventListener("keydown", onKeyDown);
    return () => {
      node.removeEventListener("keydown", onKeyDown);
      node.removeAttribute("tabindex");
      // restaurar el foco de donde vino
      if (previous && document.contains(previous)) previous.focus();
    };
  }, [active, ref, onEsc]);
}
