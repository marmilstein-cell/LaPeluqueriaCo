"use client";
// LaPeluqueriaCo — TU TURNO (Acto I, escena #book) — el Session Builder.
// Vive inmediatamente después del hero: reservar es el primer acto.
// Desktop: composición dividida — narrativa/foto a la izquierda (cambia con la
// elección), selección activa a la derecha. Mobile: columna única + tracker sticky.
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BImage } from "../BImage";
import { Slate, Reveal } from "../scene-utils";
import { useCatalog } from "../useCatalog";
import { useBooking } from "@/store/booking";
import { formatLongDate, priceARS } from "@/lib/bardos/domain";
import { SessionTracker } from "./SessionTracker";
import { StepService } from "./StepService";
import { StepArtist } from "./StepArtist";
import { StepDate } from "./StepDate";
import { StepTime } from "./StepTime";
import { StepDetails } from "./StepDetails";
import { StepConfirm } from "./StepConfirm";
import { PassStrip } from "./PassStrip";

const STEP_TITLES = ["SERVICIO", "BARBERO", "FECHA", "HORA", "DATOS", "CONFIRMAR"];

export function YourSession() {
  const { data } = useCatalog();
  const services = data?.services ?? [];
  const artists = data?.artists ?? [];
  const { step, serviceId, artistId, date, time, session, reschedulingId, goTo, reset } = useBooking();

  // guardia de borrador: hay una reserva a medio construir — no perderla
  // por un refresh distraído (el navegador muestra su propio aviso)
  useEffect(() => {
    const draftInProgress = step > 1 && !session;
    if (!draftInProgress) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [step, session]);

  const service = services.find((s) => s.id === serviceId);
  const artist = artists.find((a) => a.id === artistId);

  const back = () => useBooking.getState().back();

  return (
    <section
      id="book"
      data-zone="booking"
      aria-label="Tu Turno — reservá tu turno"
      className="relative bg-black"
    >
      {/* encabezado del acto */}
      <div style={{ padding: "var(--spacing-b8) var(--grid-margin) 0" }}>
        <Slate>ACTO I — TU TURNO</Slate>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
          <Reveal as="h2" className="font-display font-display-tight type-display-sm text-offwhite">
            TU TURNO<span className="text-red">.</span>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="font-editorial-italic max-w-md text-[clamp(16px,1.8vw,24px)] text-chalk/85">
              Seis pasos, menos de un minuto. Estás construyendo algo,
              no llenando un formulario.
            </p>
          </Reveal>
        </div>
      </div>

      {/* tracker persistente + historial local de pases (08.8) */}
      <div
        className="flex flex-col gap-5"
        style={{ padding: "var(--spacing-b5) var(--grid-margin) 0" }}
      >
        <SessionTracker />
        {!session && !reschedulingId && <PassStrip />}
      </div>

      {/* banner de reprogramación */}
      {reschedulingId && (
        <div style={{ padding: "var(--spacing-b4) var(--grid-margin) 0" }}>
          <div className="flex flex-wrap items-center justify-between gap-3 border border-red/40 bg-red/5 px-5 py-4">
            <p className="font-system text-[12px] tracking-[0.1em] text-red">
              REPROGRAMANDO {reschedulingId} — ELEGÍ NUEVO DÍA Y HORA
            </p>
            <button
              onClick={() => reset({ keepCustomer: true })}
              className="b-link"
            >
              CANCELAR REPROGRAMA
            </button>
          </div>
        </div>
      )}

      {/* composición dividida */}
      <div
        className="mt-8 grid gap-10 md:mt-12 md:grid-cols-2 md:gap-14 lg:gap-20"
        style={{ padding: "0 var(--grid-margin) var(--spacing-b8)" }}
      >
        {/* IZQUIERDA — narrativa que cambia con la elección */}
        <div className="relative hidden md:block">
          <div className="sticky top-32">
            <ContextPanel
              step={step}
              service={service}
              artist={artist}
              date={date}
              time={time}
            />
          </div>
        </div>

        {/* DERECHA — la selección activa */}
        <div className="relative min-h-[420px]">
          {/* navegación de pasos (accesible + retomable) */}
          <nav aria-label="Pasos de la reserva" className="mb-6 flex flex-wrap gap-x-5 gap-y-2">
            {STEP_TITLES.map((t, i) => {
              const n = i + 1;
              const done =
                (n === 1 && serviceId) ||
                (n === 2 && artistId) ||
                (n === 3 && date) ||
                (n === 4 && time) ||
                (n === 5 && step > 5);
              const current = step === n;
              const locked = reschedulingId ? n < 3 : n > step;
              return (
                <button
                  key={t}
                  onClick={() => !locked && goTo(n as 1 | 2 | 3 | 4 | 5 | 6)}
                  disabled={locked}
                  aria-current={current ? "step" : undefined}
                  className={`type-micro transition-colors duration-200 ${
                    current
                      ? "text-red"
                      : done
                      ? "text-offwhite"
                      : locked
                      ? "text-smoke/80"
                      : "text-bone/70 hover:text-bone"
                  }`}
                >
                  <span className="mr-1.5">{String(n).padStart(2, "0")}</span>
                  {t}
                  {done && !current && <span className="ml-1 text-red">·</span>}
                </button>
              );
            })}
          </nav>

          <AnimatePresence mode="wait">
            <div key={step}>
              {step === 1 && <StepService services={services} />}
              {step === 2 && <StepArtist artists={artists} />}
              {step === 3 && <StepDate />}
              {step === 4 && <StepTime />}
              {step === 5 && <StepDetails />}
              {step === 6 && <StepConfirm service={service} artist={artist} />}
            </div>
          </AnimatePresence>

          {/* back global (mobile friendly) */}
          {step > 1 && step < 6 && (
            <button onClick={back} className="b-link mt-8 md:hidden">
              ← VOLVER
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/** Panel izquierdo: la foto/metadata invaden según lo elegido (08.2). */
function ContextPanel({
  step,
  service,
  artist,
  date,
  time,
}: {
  step: number;
  service?: { name: string; imageRef: string; durationMinutes: number; price: number; nameEs: string };
  artist?: { name: string; photoRef: string; tag: string | null; specialty: string };
  date: string | null;
  time: string | null;
}) {
  // prioridad visual: artista > servicio > tesis
  const image = artist?.photoRef ?? service?.imageRef ?? "/images/space-wide.webp";
  const caption = artist
    ? `BARBERO — ${artist.name}`
    : service
    ? `SERVICIO — ${service.name}`
    : "LaPeluqueriaCo — ESPERANDO TU ELECCIÓN";

  return (
    <div className="relative aspect-[4/5] overflow-hidden border border-line">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={image}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <BImage
            src={image}
            alt={
              artist
                ? `Retrato de ${artist.name}`
                : service
                ? `Trabajo de ${service.name}`
                : "Interior de Bardos"
            }
            fill
            sizes="(max-width: 768px) 0px, 42vw"
            imgClassName="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/40" />
        </motion.div>
      </AnimatePresence>

      {/* metadata sobre la foto */}
      <div className="absolute inset-x-0 bottom-0 p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={caption + String(time)}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="type-micro text-red">{caption}</p>
            {artist && (
              <p className="font-display mt-2 text-[clamp(30px,3.4vw,54px)] text-offwhite">
                {artist.name}
              </p>
            )}
            {artist?.tag && <p className="type-mono-label mt-1 text-bone">{artist.tag} — {artist.specialty}</p>}
            {!artist && service && (
              <>
                <p className="font-display mt-2 text-[clamp(30px,3.4vw,54px)] text-offwhite">
                  {service.name}
                </p>
                <p className="font-system mt-2 text-[12px] text-bone/80">
                  {service.durationMinutes} MIN — {priceARS(service.price)}
                </p>
              </>
            )}
            {!artist && !service && (
              <p className="font-editorial-italic mt-3 max-w-[26ch] text-[clamp(18px,1.8vw,24px)] text-chalk/90">
                Elegí el servicio para empezar a construir tu sesión.
              </p>
            )}
            {time && date && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 border-t border-line/70 pt-4"
              >
                <p className="type-micro text-smoke">{formatLongDate(date)}</p>
                <p className="font-display mt-1 text-[clamp(36px,4vw,64px)] text-offwhite">
                  {time}
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* indicador de paso */}
      <p className="scene-no absolute right-4 top-4">
        {String(step).padStart(2, "0")} / 06
      </p>
    </div>
  );
}
