"use client";
// LaPeluqueriaCo — Session Builder, paso 06: CONFIRMAR
// "TU TURNO" final + confirmación como ceremonia.
// Edge case 08.10: si el turno cayó mientras confirmabas, se corta y ofrece alternativas.
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import type { Artist, Service, Session } from "@/lib/bardos/domain";
import { formatLongDate, priceARS } from "@/lib/bardos/domain";
import { createBooking, rescheduleSession, ApiError, type CutConflict } from "@/lib/bardos/client";
import { rememberPass } from "@/lib/bardos/passes";
import { useBooking, haptic } from "@/store/booking";
import { StepShell } from "./StepShell";

export function StepConfirm({
  service,
  artist,
}: {
  service: Service | undefined;
  artist: Artist | undefined;
}) {
  const store = useBooking();
  const {
    serviceId,
    artistId,
    date,
    time,
    customer,
    setSession,
    startReschedule,
    reschedulingId,
    setCutSlot,
    setDate,
    setTime,
    goTo,
  } = store;
  const qc = useQueryClient();
  const [conflict, setConflict] = useState<CutConflict | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);

  const onSuccess = (s: Session) => {
    qc.invalidateQueries({ queryKey: ["availability"] });
    haptic([16, 60, 24]);
    setSession(s);
    rememberPass(s.id);
    // hash real del pase: #session/BRD-XXXX
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `#session/${s.id}`);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (reschedulingId) {
        return rescheduleSession(reschedulingId, date!, time!);
      }
      return createBooking({
        serviceId: serviceId!,
        artistId: artistId!,
        date: date!,
        time: time!,
        customer: {
          name: customer.name.trim(),
          phone: customer.phone.trim(),
          email: customer.email?.trim() || undefined,
          notes: customer.notes?.trim() || undefined,
        },
      });
    },
    onSuccess: (data) => {
      setConflict(null);
      setFatal(null);
      onSuccess(data.session);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        const data = err.data as unknown as CutConflict;
        setConflict(data);
        setCutSlot({ date: date!, time: time! });
        haptic([30, 40]);
      } else {
        setFatal(
          "No pudimos confirmar. Puede ser la red — dale otra vez. Si sigue, escribinos al WhatsApp."
        );
      }
    },
  });

  if (!service || !artist || !date || !time) {
    return (
      <StepShell n="06" title="CONFIRMAR" question="TU TURNO">
        <p className="font-system text-[13px] text-bone/80">
          Falta completar el turno. Volvé a los pasos anteriores.
        </p>
      </StepShell>
    );
  }

  return (
    <StepShell
      n="06"
      title="CONFIRMAR"
      question="TU TURNO"
      hint={reschedulingId ? "Confirmá el nuevo horario de tu turno." : "Revisá. Confirmá. Nos vemos."}
    >
      {/* composición final del turno */}
      <div className="border border-line bg-coal/60">
        <div className="flex items-center justify-between border-b border-line px-5 py-3 md:px-6">
          <span className="type-micro text-red">TU TURNO</span>
          <span className="type-micro text-smoke">
            {reschedulingId ? `REPROGRAMA DE ${reschedulingId}` : "LISTO PARA CONFIRMAR"}
          </span>
        </div>
        <div className="px-5 py-6 md:px-6 md:py-8">
          <p className="font-display font-display-tight text-[clamp(34px,4.5vw,64px)] text-offwhite">
            {service.name}
          </p>
          <p className="font-editorial-italic mt-2 text-[clamp(17px,1.8vw,24px)] text-chalk/85">
            con {artist.name} — {artist.specialty.toLowerCase()}
          </p>
          <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
            <Meta label="DÍA" value={formatLongDate(date)} />
            <Meta label="HORA" value={`${time} HS`} big />
            <Meta label="DURACIÓN" value={`${service.durationMinutes} MIN`} />
            <Meta label="PRECIO" value={priceARS(service.price)} big />
          </div>
        </div>
      </div>

      {/* edge case: el turno se cortó mientras confirmabas (08.10) */}
      <AnimatePresence>
        {conflict && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-5 border-l-2 border-red bg-coal p-5">
              <p className="font-display text-[clamp(20px,2.2vw,30px)] text-offwhite">
                ESE TURNO SE CORTÓ<span className="text-red">.</span>
              </p>
              <p className="font-system mt-2 text-[13px] leading-[1.6] text-bone/85">
                Alguien lo tomó primero — así funciona el oficio. Estos son los
                más cercanos con {artist.name}:
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {conflict.alternatives.map((alt) => (
                  <button
                    key={`${alt.date}|${alt.time}`}
                    onClick={() => {
                      setConflict(null);
                      setCutSlot(null);
                      setDate(alt.date);
                      setTime(alt.time);
                      goTo(6);
                      haptic(12);
                    }}
                    className="border border-red/60 px-5 py-3 font-system text-[13px] tracking-[0.08em] text-offwhite transition-colors duration-200 hover:bg-red/10"
                  >
                    {formatLongDate(alt.date)} — {alt.time}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {fatal && (
        <p className="font-system mt-4 border-l-2 border-red bg-coal p-4 text-[13px] text-red" role="alert">
          {fatal}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => store.back()}
          disabled={mutation.isPending}
          className="b-link"
        >
          ← VOLVER
        </button>
        <button
          onClick={() => {
            setConflict(null);
            mutation.mutate();
          }}
          disabled={mutation.isPending || !!conflict}
          className="b-btn min-w-[240px]"
        >
          {mutation.isPending ? (
            <>
              CONFIRMANDO
              <motion.span
                aria-hidden="true"
                className="ml-1 block h-[2px] w-10 origin-left bg-current"
                style={{ color: "inherit" }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
              />
            </>
          ) : reschedulingId ? (
            "CONFIRMAR NUEVO HORARIO"
          ) : (
            "CONFIRMAR TURNO"
          )}
        </button>
      </div>
    </StepShell>
  );
}

function Meta({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div>
      <p className="type-micro text-smoke">{label}</p>
      <p className={`font-display mt-2 ${big ? "text-[clamp(22px,2.4vw,34px)]" : "text-[clamp(16px,1.6vw,22px)]"} text-offwhite`}>
        {value}
      </p>
    </div>
  );
}
