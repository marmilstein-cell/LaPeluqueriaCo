"use client";
// LaPeluqueriaCo — PASS LOOKUP: "¿tenés un código?" Encontrá tu pase con BRD-XXXX.
// Acepta "247", "brd-247", "BRD-0247". Vive en el menú y en el error del pase.
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { normalizePass, openPass } from "@/lib/bardos/passes";
import { haptic } from "@/store/booking";

export function PassLookup({ onDone }: { onDone?: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = normalizePass(value);
    if (!id) {
      setError("El código es BRD + números. Ej: BRD-0247.");
      return;
    }
    setError(null);
    haptic(12);
    onDone?.();
    openPass(id);
  };

  return (
    <form onSubmit={submit} className="group/lookup">
      <label
        htmlFor="pass-lookup"
        className="type-micro mb-2 block text-smoke"
      >
        ¿TENÉS UN PASE? — BUSCÁLO POR CÓDIGO
      </label>
      <div className="flex">
        <input
          id="pass-lookup"
          value={value}
          onChange={(e) => {
            setValue(e.target.value.toUpperCase());
            setError(null);
          }}
          placeholder="BRD-0247"
          autoComplete="off"
          spellCheck={false}
          inputMode="text"
          aria-invalid={!!error}
          aria-describedby={error ? "pass-lookup-error" : undefined}
          className="b-input font-system min-w-0 flex-1 border-r-0 tracking-[0.18em]"
          style={{ textTransform: "uppercase" }}
        />
        <button
          type="submit"
          className="shrink-0 border border-line bg-ash px-5 font-system text-[11px] tracking-[0.18em] text-bone transition-colors duration-200 hover:border-red hover:text-offwhite"
        >
          ABRIR
        </button>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            id="pass-lookup-error"
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="type-micro mt-2 text-red"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </form>
  );
}
