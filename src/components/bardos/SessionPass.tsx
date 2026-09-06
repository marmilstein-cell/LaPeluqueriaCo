"use client";
// BARDOS — SESSION PASS (Acto V: ARRIVE)
// La confirmación como ceremonia + el pase como objeto de marca persistente.
// Vive en una URL real (#session/BRD-XXXX): se guarda, se comparte, se
// consulta, se cancela y se reprograma.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import type { Session } from "@/lib/bardos/domain";
import { formatLongDate, priceARS, SHOP, artistDisplayName } from "@/lib/bardos/domain";
import { fetchSession, cancelSession } from "@/lib/bardos/client";
import { useBooking, haptic } from "@/store/booking";
import { scrollToScene } from "./providers";
import { BImage } from "./BImage";
import { PassLookup } from "./PassLookup";
import { useFocusTrap } from "./useFocusTrap";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

/** Routea el hash #session/ID — devuelve el id cuando corresponde. */
function useSessionRoute() {
  const [routeId, setRouteId] = useState<string | null>(null);
  useEffect(() => {
    const parse = () => {
      const m = window.location.hash.match(/^#session\/([A-Za-z0-9-]+)/i);
      setRouteId(m ? m[1].toUpperCase() : null);
    };
    parse();
    window.addEventListener("hashchange", parse);
    return () => window.removeEventListener("hashchange", parse);
  }, []);
  return routeId;
}

export function SessionPass() {
  const session = useBooking((s) => s.session);
  const startReschedule = useBooking((s) => s.startReschedule);
  const reset = useBooking((s) => s.reset);
  const routeId = useSessionRoute();
  const reduced = useReducedMotionSafe();
  const qc = useQueryClient();
  // Momento de montaje, para distinguir "la reserva que acaban de hacer" de una
  // re-apertura de un pase viejo. Va en state con inicializador lazy y no en un
  // ref: se lee durante el render, y leer .current en render es incorrecto
  // (React no garantiza re-render cuando cambia). useRef(Date.now()) además
  // reevaluaba Date.now() en cada render para descartarlo.
  const [mountedAt] = useState(() => Date.now());
  const overlayRef = useRef<HTMLDivElement>(null);

  // pase consultado por URL (re-apertura / compartido)
  const { data: routeData, isLoading, isError } = useQuery({
    queryKey: ["session", routeId],
    queryFn: () => fetchSession(routeId!),
    enabled: !!routeId && session?.id !== routeId,
    retry: false,
    staleTime: 30_000,
  });

  // re-abrir el MISMO pase (hash ya en #session/ID) debe re-consultar:
  // p.ej. tras un error de red, o al re-click en el historial.
  useEffect(() => {
    const refetch = () => {
      if (routeId) qc.invalidateQueries({ queryKey: ["session", routeId] });
    };
    window.addEventListener("bardos:refetch-session", refetch);
    return () => window.removeEventListener("bardos:refetch-session", refetch);
  }, [qc, routeId]);

  // El pase activo: prioridad (1) sesión recién confirmada en el store cuyo id
  // coincide con la ruta, (2) sesión fetch-eada por la ruta, (3) sesión del store
  // cuando NO hay ruta (overlay post-confirmación). Si la ruta falló → null:
  // se muestra el estado de error con lookup, nunca un pase viejo desactualizado.
  const active: Session | null = isError
    ? null
    : session?.id === routeId
      ? session
      : routeId
        ? routeData?.session ?? null
        : session;
  const open = !!active || (!!routeId && (isLoading || isError));
  useEffect(() => {
    if (open) {
      const lenis = (window as Window & { __lenis?: { stop(): void; start(): void } }).__lenis;
      lenis?.stop();
      document.documentElement.style.overflow = "hidden";
    } else {
      const lenis = (window as Window & { __lenis?: { stop(): void; start(): void } }).__lenis;
      lenis?.start();
      document.documentElement.style.overflow = "";
    }
  }, [open]);

  const close = useCallback(() => {
    // al cerrar, el pase deja de estar "en mano": la sesión se descarta del
    // estado activo (queda en el historial local y en su URL real).
    useBooking.setState({ session: null });
    if (window.location.hash.startsWith("#session")) {
      window.history.pushState(null, "", "#book");
    }
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    setTimeout(() => scrollToScene("book"), 60);
  }, []);

  // focus trap: Tab cicla dentro del pase, Escape lo cierra
  useFocusTrap(open, overlayRef, { onEsc: close });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelSession(id),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["session"] });
      haptic([20, 50]);
      useBooking.setState({ session: data.session });
    },
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="pass"
          ref={overlayRef}
          className="fixed inset-0 z-[85] overflow-y-auto bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          role="dialog"
          aria-modal="true"
          aria-label="Pase de sesión Bardos"
        >
          {/* --- ceremonia: silencio, línea, confirmación ---
              Solo para sesiones confirmadas DESPUÉS de montar esta página
              (la reserva que acaban de hacer). Re-aperturas y pases viejos
              no repiten la ceremonia. --- */}
          {!isLoading && active && (
            <Ceremony
              key={active.id}
              reduced={reduced}
              fresh={
                !!session &&
                session.id === active.id &&
                active.status !== "cancelled" &&
                new Date(active.createdAt).getTime() > mountedAt
              }
            />
          )}

          <div
            className="mx-auto flex min-h-full w-full max-w-xl flex-col justify-center gap-10 px-4 py-20 md:px-0"
            style={{ paddingTop: "max(80px, 10vh)" }}
          >
            {isLoading && (
              <div className="flex flex-col items-center gap-6" role="status" aria-label="Cargando pase">
                <span className="cut-line w-20 animate-[pulse-line_1.6s_ease-in-out_infinite] origin-center" />
                <p className="type-micro text-bone">BUSCANDO EL PASE…</p>
              </div>
            )}
            {isError && (
              <div className="border border-line bg-coal p-8 text-center">
                <p className="font-display text-[clamp(26px,4vw,44px)] text-offwhite">
                  ESE PASE NO EXISTE<span className="text-red">.</span>
                </p>
                <p className="font-system mt-3 text-[13px] text-bone/80">
                  Fijate el link — o buscalo por código.
                </p>
                <div className="mx-auto mt-6 max-w-xs text-left">
                  <PassLookup />
                </div>
                <button onClick={close} className="b-btn b-btn-ghost mt-6">
                  RESERVAR
                </button>
              </div>
            )}

            {active && (
              <AnimatePresence>
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: reduced ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col gap-10"
                >
                  <PassCard session={active} />

                  {/* NOS VEMOS EN BARDOS, con el dato dinámico */}
                  <motion.p
                    className="font-editorial-italic text-center text-[clamp(20px,2.6vw,30px)] text-chalk/90"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: reduced ? 0 : 1.1, duration: 0.8 }}
                  >
                    Nos vemos en Bardos, {formatLongDate(active.date).toLowerCase()} {active.time}.
                  </motion.p>

                  <PassActions
                    session={active}
                    onClose={close}
                    onCancel={() => cancelMutation.mutate(active.id)}
                    cancelling={cancelMutation.isPending}
                    onReschedule={() => {
                      startReschedule(active);
                      close();
                    }}
                    onNew={() => {
                      reset({ keepCustomer: true });
                      close();
                    }}
                  />

                  {/* post-booking: antes de tu sesión (08.8) */}
                  {active.status !== "cancelled" && (
                    <BeforeSession session={active} />
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* ticket físico: portal oculto que solo existe en @media print */}
          {active && <PrintPass session={active} />}

          {/* cerrar */}
          <button
            onClick={close}
            className="b-link fixed right-0 top-0 z-20 bg-black/80 px-4 py-3 backdrop-blur-sm"
            style={{ marginTop: 68 }}
            aria-label="Cerrar pase de sesión"
          >
            CERRAR ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Ceremonia de confirmación (08.6): silencio → línea → TURNO CONFIRMADO. */
function Ceremony({ reduced, fresh }: { reduced: boolean | null; fresh: boolean }) {
  const [done, setDone] = useState(!fresh);
  useEffect(() => {
    if (!fresh) return;
    const t = setTimeout(() => setDone(true), reduced ? 0 : 1900);
    return () => clearTimeout(t);
  }, [reduced, fresh]);

  if (done) return null;
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-10 flex flex-col items-center justify-center gap-8 bg-black"
      exit={{ opacity: 0 }}
    >
      <motion.span
        className="cut-line"
        style={{ width: 84 }}
        initial={{ scaleX: 0.2 }}
        animate={{ scaleX: [0.2, 1, 1] }}
        transition={{ duration: 1.4, ease: [0.85, 0, 0.15, 1] }}
      />
      <motion.p
        className="font-display font-display-tight type-display-md px-6 text-center text-offwhite"
        initial={{ opacity: 0, y: 24, scale: 1.06 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.9, ease: [0.2, 0.9, 0.25, 1.15] }}
      >
        TURNO CONFIRMADO<span className="text-red">.</span>
      </motion.p>
      <motion.span
        aria-hidden="true"
        className="block h-1 w-1 bg-red"
        animate={{ opacity: [1, 0.2, 1] }}
        transition={{ repeat: Infinity, duration: 1.1 }}
      />
    </motion.div>
  );
}

/** El pase: el único objeto claro de toda la película. Off-white sobre negro. */
function PassCard({ session }: { session: Session }) {
  const cancelled = session.status === "cancelled";
  const completed = session.status === "completed";
  return (
    <div className="relative bg-offwhite text-black shadow-[0_0_60px_rgba(0,0,0,0.8)]">
      {/* perforaciones de ticket */}
      <span aria-hidden="true" className="absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-black" />
      <span aria-hidden="true" className="absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-black" />

      <div className="px-6 pb-6 pt-6 md:px-8">
        <div className="flex items-baseline justify-between">
          <p className="font-display text-[18px] tracking-[0.06em]">BARDOS</p>
          <p className="font-system text-[11px] tracking-[0.18em] text-black/60">
            SESSION / {session.id}
          </p>
        </div>

        {/* línea de corte perforada con remache de estación */}
        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 border-t border-dashed border-black/30" />
          <span
            aria-hidden="true"
            className="block h-[7px] w-[7px] rounded-full bg-red shadow-[inset_0_1px_1px_rgba(0,0,0,0.35),0_0_0_3px_rgba(229,35,27,0.22)]"
          />
          <span className="h-px flex-1 border-t border-dashed border-black/30" />
        </div>

        <motion.div
          animate={cancelled ? { opacity: 0.55 } : { opacity: 1 }}
          className="relative"
        >
          <p className="font-display font-display-tight text-[clamp(34px,6vw,58px)] leading-[0.92]">
            {session.serviceId.toUpperCase().replace("-", " + ")}
          </p>
          <p className="font-system mt-3 text-[13px] tracking-[0.08em] text-black/80">
            BARBERO — {artistDisplayName(session.artistId)}
          </p>
          <p className="font-system mt-1 text-[13px] tracking-[0.08em] text-black/80">
            {formatLongDate(session.date)} — {session.time} — {session.minutes} MIN
          </p>
          <p className="font-system mt-1 text-[13px] tracking-[0.08em] text-black/80">
            {priceARS(session.price)} — {session.customer.name.toUpperCase()}
          </p>

          {/* barcode — guard bars anchos, ancho entero, sin suavizado */}
          <div className="mt-6 flex items-end justify-between gap-3" aria-hidden="true">
            <div className="flex h-11 items-stretch gap-[2px]">
              {barcode(session.id).map((w, i) => (
                <span
                  key={i}
                  className="h-full bg-black"
                  style={{ width: w, flex: "0 0 auto", transform: "translateZ(0)" }}
                />
              ))}
            </div>
            <span className="font-system text-right text-[10px] leading-[1.5] tracking-[0.18em] text-black/60">
              SAN MARTÍN DE LOS ANDES — {new Date(session.createdAt).getFullYear() || "BARDOS"}
            </span>
          </div>

          {/* estado cancelado: el corte atraviesa el pase */}
          {cancelled && (
            <motion.span
              aria-hidden="true"
              className="absolute -left-4 top-[38%] block h-[3px] w-[calc(100%+32px)] origin-left bg-red"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, ease: [0.85, 0, 0.15, 1] }}
              style={{ transform: "rotate(-4deg) scaleX(1)" }}
            />
          )}
        </motion.div>

        {cancelled && (
          <p className="font-display mt-5 text-center text-[clamp(18px,2.4vw,26px)] text-red">
            TURNO CORTADO.
          </p>
        )}
        {completed && (
          <p className="font-display mt-5 text-center text-[clamp(16px,2vw,22px)] text-black/70">
            ESTE CORTE YA ESTÁ HECHO<span className="text-red">.</span>
          </p>
        )}
      </div>

      <div className="border-t border-black/10 px-6 pb-6 pt-4 md:px-8">
        <p className="font-system max-w-[44ch] text-[10px] leading-[1.6] tracking-[0.08em] text-black/55">
          PRESENTÁ ESTE PASE AL LLEGAR — AV. SAN MARTÍN 2123, GALERÍA LOS NOGALES,
          SAN MARTÍN DE LOS ANDES. LLEGÁ 5 MIN ANTES. SI NO PODÉS VENIR, CORTÁ EL
          TURNO DESDE ESTE MISMO LINK.
        </p>
      </div>
    </div>
  );
}

/** Acciones del pase: WhatsApp / link / agenda / reprograma / cancela. */
function PassActions({
  session,
  onClose,
  onCancel,
  cancelling,
  onReschedule,
  onNew,
}: {
  session: Session;
  onClose: () => void;
  onCancel: () => void;
  cancelling: boolean;
  onReschedule: () => void;
  onNew: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const cancelled = session.status === "cancelled";
  const completed = session.status === "completed";

  const waText = encodeURIComponent(
    `Hola Bardos. Confirmo mi turno ${session.id} — ${session.serviceId
      .toUpperCase()
      .replace("-", " + ")} con ${artistDisplayName(session.artistId)} el ${formatLongDate(
      session.date
    )} ${session.time}hs. Nos vemos en San Martín de los Andes.`
  );
  const waUrl = `https://wa.me/${SHOP.phoneWa}?text=${waText}`;

  const passUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}#session/${session.id}`
      : `#session/${session.id}`;

  const icsHref = useMemo(() => buildICS(session), [session]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(passUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = passUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    haptic(10);
    setTimeout(() => setCopied(false), 2200);
  };

  // COMPARTIR — Web Share API nativa (cualquier app); sin soporte, portapapeles
  const share = async () => {
    const shareText = `Mi turno en Bardos — ${session.serviceId
      .toUpperCase()
      .replace("-", " + ")} con ${artistDisplayName(session.artistId)}, el ${formatLongDate(
      session.date
    )} ${session.time}hs. Av. San Martín 2123, San Martín de los Andes.`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `BARDOS — TURNO ${session.id}`,
          text: shareText,
          url: passUrl,
        });
      } catch {
        /* el usuario cerró el sheet: no pasa nada */
      }
    } else {
      await copy();
    }
  };

  if (cancelled) {
    return (
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={() => {
            onNew();
          }}
          className="b-btn"
        >
          RESERVAR DE NUEVO
        </button>
        <button onClick={onClose} className="b-link">
          VOLVER AL SITIO
        </button>
      </div>
    );
  }

  // post-sesión: el corte está hecho — el próximo movimiento es otro pase
  if (completed) {
    return (
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => {
            onNew();
          }}
          className="b-btn"
        >
          RESERVAR EL PRÓXIMO CORTE
        </button>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <button onClick={copy} className="b-link">
            {copied ? "LINK COPIADO ✓" : "GUARDAR LINK"}
          </button>
          <button onClick={() => window.print()} className="b-link">
            IMPRIMIR PASE
          </button>
        </div>
        <button onClick={onClose} className="type-micro mt-2 text-smoke hover:text-bone">
          CERRAR Y SEGUIR VIENDO EL SITIO
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="b-btn w-full max-w-xs"
      >
        CONFIRMAR POR WHATSAPP
      </a>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        <button onClick={share} className="b-link">
          COMPARTIR PASE
        </button>
        <button onClick={copy} className="b-link">
          {copied ? "LINK COPIADO ✓" : "GUARDAR LINK"}
        </button>
        <a href={icsHref} download={`bardos-${session.id}.ics`} className="b-link">
          AGENDAR (.ICS)
        </a>
        <button onClick={() => window.print()} className="b-link">
          IMPRIMIR PASE
        </button>
        <button onClick={onReschedule} className="b-link">
          REPROGRAMAR
        </button>
        <button
          onClick={() => {
            if (confirmCancel) onCancel();
            else setConfirmCancel(true);
          }}
          disabled={cancelling}
          className="b-link text-red/90 hover:text-red"
        >
          {cancelling ? "CORTANDO…" : confirmCancel ? "¿SEGURO? CORTAR TURNO" : "CANCELAR TURNO"}
        </button>
      </div>
      <button onClick={onClose} className="type-micro mt-2 text-smoke hover:text-bone">
        CERRAR Y SEGUIR VIENDO EL SITIO
      </button>
    </div>
  );
}

/** Post-booking: la anticipación (Acto V). */
function BeforeSession({ session }: { session: Session }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    "Bardos Barber, " + SHOP.address + ", San Martín de los Andes, Neuquén, Argentina"
  )}`;
  return (
    <div className="border border-line bg-coal/50">
      <p className="type-micro border-b border-line px-5 py-3 text-red">
        ANTES DE TU SESIÓN
      </p>
      <div className="grid gap-0 sm:grid-cols-3">
        <div className="border-line p-5 sm:border-r">
          <p className="type-micro text-smoke">DÓNDE</p>
          <p className="font-system mt-2 text-[13px] leading-[1.6] text-chalk">
            {SHOP.address}, San Martín de los Andes. Local a la vista desde la galería.
          </p>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="b-link mt-3 inline-block">
            CÓMO LLEGAR →
          </a>
        </div>
        <div className="border-line p-5 sm:border-r">
          <p className="type-micro text-smoke">CUÁNTO</p>
          <p className="font-system mt-2 text-[13px] leading-[1.6] text-chalk">
            {session.minutes} minutos de sesión. Llegá 5 minutos antes
            — el café corre por nuestra cuenta.
          </p>
        </div>
        <div className="p-5">
          <p className="type-micro text-smoke">QUÉ ESPERAR</p>
          <p className="font-system mt-2 text-[13px] leading-[1.6] text-chalk">
            Diagnóstico primero: contás qué querés, Tomás dice qué se
            puede. Después, silencio y oficio.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Barcode determinista a partir del ID — guard bars anchos en los extremos. */
function barcode(id: string): number[] {
  let seed = 0;
  for (const c of id) seed = (seed * 31 + c.charCodeAt(0)) % 9973;
  const bars: number[] = [3, 1, 3]; // guard de apertura
  for (let i = 0; i < 34; i++) {
    seed = (seed * 137 + 61) % 9973;
    bars.push((seed % 3) + 1);
  }
  bars.push(3, 1, 3); // guard de cierre
  return bars;
}

/** ICS del turno (UTC a partir del -03:00 de Argentina). */
function buildICS(s: Session): string {
  const start = new Date(`${s.date}T${s.time}:00-03:00`);
  const end = new Date(start.getTime() + s.minutes * 60000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BARDOS//Session//ES",
    "BEGIN:VEVENT",
    `UID:${s.id}@bardos.barber`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:BARDOS — ${s.serviceId.toUpperCase().replace("-", " + ")}`,
    `LOCATION:${SHOP.address}\\, San Martín de los Andes\\, Neuquén`,
    `DESCRIPTION:Turno ${s.id} con ${artistDisplayName(s.artistId)}. Presentá tu pase al llegar.`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

/** Ticket físico del pase: portal oculto que solo existe en @media print.
 *  El cliente lo imprime (o lo guarda como PDF) desde IMPRIMIR PASE. */
function PrintPass({ session }: { session: Session }) {
  if (typeof document === "undefined") return null;

  const rows: [string, string][] = [
    ["SESIÓN", session.id],
    ["FECHA", formatLongDate(session.date)],
    ["HORA", `${session.time} HS (llegá 5′ antes)`],
    ["SERVICIO", session.serviceId.toUpperCase().replace("-", " + ")],
    ["ARTISTA", artistDisplayName(session.artistId)],
    ["CLIENTE", session.customer.name.toUpperCase()],
    ["TELÉFONO", session.customer.phone],
    ["DURACIÓN", `${session.minutes} MINUTOS`],
    ["PRECIO", priceARS(session.price)],
  ];

  const cancelled = session.status === "cancelled";

  const ticket = (
    <div data-print-root="pass" className="print-pass">
      <header className="pp-header">
        <div>
          <p className="pp-brand">BARDOS — BARBERÍA · SAN MARTÍN DE LOS ANDES</p>
          <h1 className="pp-title">
            {cancelled ? "PASE CORTADO" : "PASE DE SESIÓN"}
          </h1>
        </div>
        <p className="pp-code">{session.id}</p>
      </header>

      <table className="pp-table">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td className="pp-key">{k}</td>
              <td className={cancelled ? "pp-strike" : ""}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {session.customer.notes && (
        <p className="pp-notes">NOTAS: “{session.customer.notes}”</p>
      )}

      <hr className="pp-cut" />

      <footer className="pp-footer">
        {SHOP.address}, SAN MARTÍN DE LOS ANDES · {SHOP.openHour}:00–{SHOP.closeHour}:00 HS
        <br />
        PRESENTÁ ESTE PASE AL LLEGAR · CORTÁ EL RUIDO
      </footer>
    </div>
  );

  return createPortal(ticket, document.body);
}
