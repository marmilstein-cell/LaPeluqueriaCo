"use client";
// BARDOS — Session Builder, paso 05: DATOS
// Datos del cliente con validación en voz de marca + línea de privacidad honesta.
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBooking } from "@/store/booking";
import { StepShell } from "./StepShell";

export function StepDetails() {
  const { customer, setCustomer, next, back } = useBooking();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (customer.name.trim().length < 2) e.name = "Necesitamos tu nombre para el pase.";
    const digits = customer.phone.replace(/\D/g, "");
    if (digits.length < 6) e.phone = "El WhatsApp está incompleto — va con el recordatorio.";
    if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email))
      e.email = "Ese email no parece un email.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (validate()) next();
  };

  return (
    <StepShell
      n="05"
      title="DATOS"
      question="TU PASE"
      hint="Lo mínimo indispensable. Nada más."
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <Field label="TU NOMBRE" error={errors.name}>
          <input
            className="b-input"
            type="text"
            autoComplete="name"
            value={customer.name}
            aria-invalid={!!errors.name}
            onChange={(e) => setCustomer({ name: e.target.value })}
            placeholder="Como querés que te llamemos"
          />
        </Field>

        <Field label="WHATSAPP" error={errors.phone}>
          <input
            className="b-input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={customer.phone}
            aria-invalid={!!errors.phone}
            onChange={(e) => setCustomer({ phone: e.target.value })}
            placeholder="11 5555 5555"
          />
        </Field>

        <Field label="EMAIL — OPCIONAL" error={errors.email}>
          <input
            className="b-input"
            type="email"
            autoComplete="email"
            value={customer.email}
            aria-invalid={!!errors.email}
            onChange={(e) => setCustomer({ email: e.target.value })}
            placeholder="Solo si querés el pase por mail"
          />
        </Field>

        <Field label="NOTAS — OPCIONAL">
          <textarea
            className="b-input min-h-[88px] resize-none"
            value={customer.notes}
            maxLength={300}
            onChange={(e) => setCustomer({ notes: e.target.value })}
            placeholder="Qué corte querés, referencias, si venís con barba larga…"
          />
        </Field>

        {/* línea de privacidad — una sola línea honesta (brief 06) */}
        <div className="border-l-2 border-red/70 bg-coal/60 p-4">
          <p className="font-system text-[12px] leading-[1.6] text-bone/90">
            Tus datos viven acá nomás: Bardos y nadie más. Sin newsletters, sin
            terceros.{" "}
            <button
              type="button"
              onClick={() => setPrivacyOpen((v) => !v)}
              className="text-red underline decoration-red/50 underline-offset-4"
              aria-expanded={privacyOpen}
            >
              POLÍTICA COMPLETA
            </button>
          </p>
          <AnimatePresence>
            {privacyOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <p className="font-system mt-3 border-t border-line pt-3 text-[12px] leading-[1.7] text-bone/70">
                  Guardamos nombre, contacto y los datos de tu turno durante 12 meses
                  para poder reprogramar o cancelar. No compartimos nada con nadie,
                  no usamos tus datos para publicidad y podés pedir que los borremos
                  escribiendo al WhatsApp del local. El pase funciona por enlace —
                  quien tenga el enlace ve la sesión.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-2 flex items-center justify-between gap-4">
          <button type="button" onClick={back} className="b-link">
            ← VOLVER
          </button>
          <button type="submit" className="b-btn">
            CONTINUAR
          </button>
        </div>
      </form>
    </StepShell>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="type-micro mb-2 block text-bone">{label}</span>
      {children}
      {error && (
        <motion.span
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-system mt-2 block text-[12px] text-red"
          role="alert"
        >
          {error}
        </motion.span>
      )}
    </label>
  );
}
