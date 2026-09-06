"use client";
// BARDOS — LA CABINA (backoffice de barberos, brief 08.11)
// Escena oculta en #cabina: la agenda del día, bloqueo de horarios y caja.
// No está en el menú: la conoce el personal. Código de acceso (CABINA_CODE).
// Estética: la misma película, pero "entre bastidores" — mono, catálogo, rojo.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchAgenda,
  fetchClubList,
  createBlock,
  deleteBlock,
  searchClients,
  setSessionStatus,
  type AgendaArtist,
  type AgendaResponse,
  type WeekTotals,
} from "@/lib/bardos/client";
import {
  SHOP,
  timeToMinutes,
  minutesToTime,
  formatLongDate,
  formatDayLabel,
  priceARS,
  nowBuenosAires,
} from "@/lib/bardos/domain";
import { useFocusTrap } from "../useFocusTrap";
import { scrollToScene } from "../providers";
import { useBooking } from "@/store/booking";

const CABINA_CODE_KEY = "bardos-cabina-code";
const ROW_H = 52; // px por slot de 30'
const BLOCK_DURATIONS = [30, 60, 90, 120]; // minutos (múltiplos de slotStep)

/** Routea el hash #cabina — igual patrón que #session/BRD-XXXX. */
function useCabinaRoute() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const parse = () => setOpen(window.location.hash.toLowerCase() === "#cabina");
    parse();
    window.addEventListener("hashchange", parse);
    return () => window.removeEventListener("hashchange", parse);
  }, []);
  return open;
}

export function Cabina() {
  const routeOpen = useCabinaRoute();
  // código persistido en sessionStorage (la cabina es de uso diario);
  // lazy initializer: el overlay nunca se renderiza server-side
  const [code, setCode] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return sessionStorage.getItem(CABINA_CODE_KEY);
    } catch {
      return null;
    }
  });
  const queryClient = useQueryClient();
  const overlayRef = useRef<HTMLDivElement>(null);
  // la agenda arranca en hoy (hora real de San Martín de los Andes)
  const [date, setDate] = useState(() => nowBuenosAires().iso);

  const close = useCallback(() => {
    if (window.location.hash.toLowerCase() === "#cabina") {
      window.history.pushState(null, "", "#book");
    }
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    setTimeout(() => scrollToScene("book"), 60);
  }, []);

  // congelar el scroll del sitio mientras la cabina está abierta
  useEffect(() => {
    if (routeOpen) {
      const lenis = (window as Window & { __lenis?: { stop(): void; start(): void } }).__lenis;
      lenis?.stop();
      document.documentElement.style.overflow = "hidden";
      // la cabina toma la pantalla: si había un pase abierto, se guarda
      // (queda en su URL #session/ID y en el historial local).
      useBooking.setState({ session: null });
    } else {
      const lenis = (window as Window & { __lenis?: { stop(): void; start(): void } }).__lenis;
      lenis?.start();
      document.documentElement.style.overflow = "";
    }
  }, [routeOpen]);

  useFocusTrap(routeOpen, overlayRef, { onEsc: close });

  return (
    <AnimatePresence>
      {routeOpen && (
        <motion.div
          key="cabina"
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label="La Cabina — gestión interna de Bardos"
          className="fixed inset-0 z-[80] overflow-y-auto bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-20 md:px-8 md:pt-24">
            {!code ? (
              <CabinaGate
                onValid={(c) => {
                  sessionStorage.setItem(CABINA_CODE_KEY, c);
                  setCode(c);
                }}
                onClose={close}
              />
            ) : (
              <CabinaDashboard
                code={code}
                date={date}
                setDate={setDate}
                onLogout={() => {
                  sessionStorage.removeItem(CABINA_CODE_KEY);
                  setCode(null);
                  queryClient.clear();
                }}
                onClose={close}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- GATE: el código de la cabina ---------------- */

function CabinaGate({
  onValid,
  onClose,
}: {
  onValid: (code: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const candidate = value.trim().toUpperCase();
    if (candidate.length < 3) {
      setError("El código es más largo.");
      return;
    }
    setChecking(true);
    setError(null);
    try {
      // validación real: la API devuelve 401 si el código no es
      await fetchAgenda(candidate, nowBuenosAires().iso);
      onValid(candidate);
    } catch {
      setError("Código cortado. Fijate de nuevo.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <motion.div
      className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <p className="type-micro text-smoke">BARDOS / SOLO PERSONAL</p>
      <h2 className="font-display font-display-tight type-display-md mt-4 text-offwhite">
        LA CABINA<span className="text-red">.</span>
      </h2>
      <p className="font-editorial-italic mt-4 text-[clamp(17px,1.8vw,22px)] text-chalk/85">
        Acá se ve el día antes que el cliente.
      </p>

      <form onSubmit={submit} className="mt-10">
        <label htmlFor="cabina-code" className="type-micro block text-bone">
          CÓDIGO DE ACCESO
        </label>
        <input
          id="cabina-code"
          value={value}
          onChange={(e) => {
            setValue(e.target.value.toUpperCase());
            setError(null);
          }}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          disabled={checking}
          placeholder="••••••"
          className="b-input mt-2 font-display text-[clamp(22px,3vw,34px)] tracking-[0.32em]"
          style={{ textTransform: "uppercase" }}
        />
        {error && <p className="type-micro mt-3 text-red">{error}</p>}
        <div className="mt-6 flex items-center gap-6">
          <button type="submit" disabled={checking} className="b-btn">
            {checking ? "ABRIENDO…" : "ENTRAR"}
          </button>
          <button type="button" onClick={onClose} className="b-link">
            VOLVER AL SITIO
          </button>
        </div>
      </form>
    </motion.div>
  );
}

/* ---------------- DASHBOARD: agenda + bloqueos + stats ---------------- */

function CabinaDashboard({
  code,
  date,
  setDate,
  onLogout,
  onClose,
}: {
  code: string;
  date: string;
  setDate: (d: string) => void;
  onLogout: () => void;
  onClose: () => void;
}) {
  const [artistId, setArtistId] = useState<string | null>(null);
  const qc = useQueryClient();
  const today = useMemo(() => nowBuenosAires().iso, []);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["cabina-agenda", code, date],
    queryFn: () => fetchAgenda(code, date),
    enabled: !!date, // date se setea al montar (hoy BA) — evita un fetch inválido
    refetchInterval: 30_000,
  });

  // artista activo: selección explícita o el primero del catálogo (estado derivado)
  const activeArtistId =
    artistId && data?.artists.some((a) => a.id === artistId)
      ? artistId
      : (data?.artists[0]?.id ?? null);
  const artist = data?.artists.find((a) => a.id === activeArtistId) ?? null;
  const stats = data?.stats;
  const week = data?.week;

  const blockMut = useMutation({
    mutationFn: (input: {
      artistId: string;
      date: string;
      time: string;
      minutes?: number;
      reason?: string;
    }) => createBlock(code, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cabina-agenda"] });
      // también la disponibilidad pública cambió
      qc.invalidateQueries({ queryKey: ["availability"] });
    },
  });

  const unblockMut = useMutation({
    mutationFn: (id: string) => deleteBlock(code, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cabina-agenda"] });
      qc.invalidateQueries({ queryKey: ["availability"] });
    },
  });

  // ciclo de vida de la sesión: confirmada → completada (el corte está hecho)
  const statusMut = useMutation({
    mutationFn: (input: { id: string; status: "completed" | "confirmed" }) =>
      setSessionStatus(code, input.id, input.status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cabina-agenda"] });
    },
  });

  return (
    <div>
      {/* claqueta */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="type-micro text-smoke">
          BARDOS / CABINA — {formatLongDate(date || today)}
          {date === today && <span className="text-red"> — HOY</span>}
        </p>
        <div className="flex items-center gap-6">
          <button
            onClick={() => window.print()}
            className="b-link"
            title="Imprimir la hoja de ruta del día"
          >
            IMPRIMIR EL DÍA
          </button>
          <button
            onClick={onLogout}
            className="b-link"
            title="Salir de la cabina (borra el código de esta sesión)"
          >
            SALIR
          </button>
          <button onClick={onClose} className="b-link">
            CERRAR ×
          </button>
        </div>
      </div>

      {/* hoja de ruta imprimible (portal: solo visible en @media print) */}
      <PrintSheet data={data ?? null} date={date} today={today} />

      <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
        <h2 className="font-display font-display-tight type-display-sm text-offwhite">
          LA CABINA<span className="text-red">.</span>
        </h2>

        {/* picker de día — tira editorial como el builder */}
        {data && (
          <div
            className="-order-1 flex w-full gap-1 overflow-x-auto pb-2 md:order-none md:w-auto"
            style={{ scrollbarWidth: "thin" }}
            aria-label="Elegir día"
          >
            {data.dates.slice(0, 10).map((d) => {
              const l = formatDayLabel(d);
              const isSel = d === date;
              return (
                <button
                  key={d}
                  onClick={() => setDate(d)}
                  aria-pressed={isSel}
                  className={`group flex w-[64px] shrink-0 flex-col items-center border py-2 transition-colors duration-200 ${
                    isSel
                      ? "border-red text-offwhite"
                      : "border-line text-bone hover:border-smoke hover:text-chalk"
                  }`}
                >
                  <span className="type-micro text-[10px]">{l.day}</span>
                  <span className={`font-display text-[18px] ${isSel ? "text-red" : ""}`}>{l.num}</span>
                  <span className="type-micro text-[9px] text-smoke">
                    {d === today ? "HOY" : l.month}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* tabs de artista */}
      {data && (
        <div
          className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-b border-line pb-4"
          role="tablist"
          aria-label="Artistas"
        >
          {data.artists.map((a) => (
            <button
              key={a.id}
              role="tab"
              aria-selected={a.id === activeArtistId}
              onClick={() => setArtistId(a.id)}
              className={`font-display text-[clamp(16px,1.8vw,24px)] tracking-[0.04em] transition-colors duration-200 ${
                a.id === activeArtistId
                  ? "text-offwhite"
                  : "text-smoke hover:text-chalk"
              }`}
            >
              {a.name}
              <span
                className={`ml-2 inline-block h-1 w-1 rounded-full ${
                  a.id === activeArtistId ? "bg-red" : "bg-smoke/40"
                }`}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      )}

      {/* cuerpo: agenda + stats */}
      {isLoading && (
        <div className="flex flex-col items-center gap-6 py-24" role="status">
          <span className="cut-line w-20 animate-[pulse-line_1.6s_ease-in-out_infinite] origin-center" />
          <p className="type-micro text-bone">CARGANDO EL DÍA…</p>
        </div>
      )}

      {isError && (
        <div className="border border-line bg-coal p-8 text-center">
          <p className="font-display text-[clamp(22px,3vw,36px)] text-offwhite">
            EL DÍA SE CORTÓ<span className="text-red">.</span>
          </p>
          <p className="font-system mt-3 text-[13px] text-bone/80">
            No pudimos traer la agenda. Puede ser el código o la conexión.
          </p>
          <button onClick={() => refetch()} className="b-btn b-btn-ghost mt-6">
            REINTENTAR
          </button>
        </div>
      )}

      {data && artist && (
        <div className="mt-8 grid gap-10 lg:grid-cols-12">
          {/* agenda */}
          <div className="lg:col-span-8">
            <AgendaTimeline
              artist={artist}
              date={date}
              onBlock={(time, reason, minutes) =>
                blockMut.mutate({ artistId: artist.id, date, time, reason, minutes })
              }
              onUnblock={(id) => unblockMut.mutate(id)}
              onComplete={(id) => statusMut.mutate({ id, status: "completed" })}
              onReopen={(id) => statusMut.mutate({ id, status: "confirmed" })}
              busy={blockMut.isPending || unblockMut.isPending || statusMut.isPending}
              error={
                blockMut.error?.message ??
                unblockMut.error?.message ??
                statusMut.error?.message ??
                null
              }
            />
          </div>

          {/* stats + clientes + ayuda */}
          <aside className="lg:col-span-4">
            {stats && (
              <div className="border border-line bg-coal">
                <p className="type-micro border-b border-line px-5 py-3 text-red">
                  EL DÍA EN NÚMEROS
                </p>
                <dl className="divide-y divide-line">
                  <Stat label="SESIONES CONFIRMADAS" value={String(stats.totalBookings)} />
                  <Stat
                    label="CORTES COMPLETADOS"
                    value={`${stats.completed} / ${stats.totalBookings}`}
                  />
                  <Stat label="CAJA REALIZADA" value={priceARS(stats.revenueDone)} />
                  <Stat label="CAJA PROYECTADA" value={priceARS(stats.revenue)} />
                  <Stat label="MINUTOS BLOQUEADOS" value={String(stats.totalBlockMinutes)} />
                  <Stat
                    label="OCUPACIÓN"
                    value={
                      stats.capacityMinutes > 0
                        ? `${Math.round((stats.bookedMinutes / stats.capacityMinutes) * 100)}%`
                        : "—"
                    }
                  />
                </dl>
              </div>
            )}

            {/* la semana en corte cruzado: esta vs la pasada */}
            {week && <WeekStats week={week} />}

            {/* búsqueda de clientes: quién llama */}
            <ClientLookup code={code} />

            {/* la lista del club: quiénes esperan el viernes */}
            <ClubList code={code} />
            <div className="mt-8 border border-line bg-coal/50 p-5">
              <p className="type-micro text-smoke">CÓMO SE USA</p>
              <ul className="mt-3 space-y-2 font-system text-[12px] leading-[1.7] text-bone/90">
                <li>
                  <span className="text-chalk">Click en un hueco</span> → bloquea ese horario
                  (descanso, recado, silla parada). Elegí cuánto dura: 30′ a 120′.
                </li>
                <li>
                  <span className="text-chalk">“✓ CORTADO”</span> → marca la sesión como
                  completada cuando el cliente ya se fue. Caja realizada al instante.
                </li>
                <li>
                  <span className="text-chalk">Click en un bloqueo</span> → lo corta y el horario
                  vuelve a la web.
                </li>
                <li>
                  <span className="text-chalk">CLIENTES</span> → buscá por teléfono o nombre y
                  mirá el historial antes de contestar.
                </li>
                <li>
                  <span className="text-chalk">LA LISTA</span> → quiénes se anotaron al club del
                  viernes. Se copia entera para avisarles.
                </li>
                <li>
                  <span className="text-chalk">Las sesiones no se tocan acá</span> — se cortan o
                  mueven desde el pase del cliente.
                </li>
              </ul>
              <p className="type-micro mt-5 text-smoke/70">
                ACTUALIZA SOLO CADA 30″ · {SHOP.openHour}–{SHOP.closeHour} HS · SLOT {SHOP.slotStep}′
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between px-5 py-4">
      <dt className="type-micro text-smoke">{label}</dt>
      <dd className="font-display text-[clamp(18px,2vw,26px)] text-offwhite">{value}</dd>
    </div>
  );
}

/* ---------------- LA SEMANA: esta semana vs la pasada ---------------- */

/** Δ% con flecha — rojo cuando crece (acá el rojo es el buen camino). */
function DeltaPct({
  current,
  previous,
  muted,
}: {
  current: number;
  previous: number;
  muted: boolean;
}) {
  if (muted || previous === 0) {
    return <span className="type-mono-label text-smoke/50">—</span>;
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return <span className="type-mono-label text-smoke/60">0%</span>;
  const up = pct > 0;
  return (
    <span
      className={`type-mono-label ${up ? "text-red" : "text-smoke"}`}
      title={`${up ? "Más" : "Menos"} que la semana pasada`}
    >
      {up ? "↑" : "↓"} {Math.abs(pct)}%
    </span>
  );
}

/** Δ absoluto (para conteos chicos, el % miente). */
function DeltaAbs({
  current,
  previous,
  muted,
}: {
  current: number;
  previous: number;
  muted: boolean;
}) {
  if (muted) {
    return <span className="type-mono-label text-smoke/50">—</span>;
  }
  const diff = current - previous;
  if (diff === 0) return <span className="type-mono-label text-smoke/60">0</span>;
  const up = diff > 0;
  return (
    <span
      className={`type-mono-label ${up ? "text-red" : "text-smoke"}`}
      title={`${up ? "Más" : "Menos"} que la semana pasada`}
    >
      {up ? "↑" : "↓"} {Math.abs(diff)}
    </span>
  );
}

function WeekRow({ label, value, delta }: { label: string; value: string; delta: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-5 py-3">
      <dt className="type-micro text-smoke">{label}</dt>
      <div className="flex items-baseline gap-3">
        <dd className="font-display text-[clamp(18px,2vw,26px)] text-offwhite">{value}</dd>
        {delta}
      </div>
    </div>
  );
}

function WeekStats({ week }: { week: { current: WeekTotals; previous: WeekTotals } }) {
  const { current, previous } = week;
  // semana pasada sin sesiones → no hay contra qué cortar: "—" en vez de ∞
  const noBaseline = previous.sessions === 0;
  return (
    <div className="mt-4 border border-line bg-coal">
      <p className="type-micro border-b border-line px-5 py-3 text-red">
        LA SEMANA — vs SEMANA PASADA
      </p>
      <dl className="divide-y divide-line">
        <WeekRow
          label="SESIONES"
          value={String(current.sessions)}
          delta={
            <DeltaPct
              current={current.sessions}
              previous={previous.sessions}
              muted={noBaseline}
            />
          }
        />
        <WeekRow
          label="CAJA"
          value={priceARS(current.revenue)}
          delta={
            <DeltaPct
              current={current.revenue}
              previous={previous.revenue}
              muted={noBaseline}
            />
          }
        />
        <WeekRow
          label="CORTES COMPLETADOS"
          value={String(current.completed)}
          delta={
            <DeltaAbs
              current={current.completed}
              previous={previous.completed}
              muted={noBaseline}
            />
          }
        />
      </dl>
    </div>
  );
}

/* ---------------- TIMELINE: 10:00→20:00 en slots de 30′ ---------------- */

function AgendaTimeline({
  artist,
  date,
  onBlock,
  onUnblock,
  onComplete,
  onReopen,
  busy,
  error,
}: {
  artist: AgendaArtist;
  date: string;
  onBlock: (time: string, reason: string | undefined, minutes: number) => void;
  onUnblock: (id: string) => void;
  onComplete: (id: string) => void;
  onReopen: (id: string) => void;
  busy: boolean;
  error: string | null;
}) {
  const [pending, setPending] = useState<string | null>(null); // slot en dialog de bloqueo
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState<number>(SHOP.slotStep);
  const [confirmUnblock, setConfirmUnblock] = useState<string | null>(null);

  // reloj vivo (30″): la línea AHORA y el sombreado del pasado se mueven solos
  const [clock, setClock] = useState(() => nowBuenosAires());
  useEffect(() => {
    const id = setInterval(() => setClock(nowBuenosAires()), 30_000);
    return () => clearInterval(id);
  }, []);
  const isToday = clock.iso === date;

  // grilla completa: slots de 30' desde openHour hasta closeHour-slotStep
  const slots = useMemo(() => {
    const out: string[] = [];
    for (let t = SHOP.openHour * 60; t < SHOP.closeHour * 60; t += SHOP.slotStep) {
      out.push(minutesToTime(t));
    }
    return out;
  }, []);

  // bookings y blocks posicionados por índice de slot
  const bookingsByStart = new Map(artist.bookings.map((b) => [b.time, b]));
  const blocksByStart = new Map(artist.blocks.map((b) => [b.time, b]));
  const blockMinutes = (m: number | undefined) => m || SHOP.slotStep;

  // línea de AHORA: posición y visibilidad
  const nowTop = ((clock.minutes - SHOP.openHour * 60) / SHOP.slotStep) * ROW_H;
  const showNow =
    isToday &&
    clock.minutes >= SHOP.openHour * 60 &&
    clock.minutes <= SHOP.closeHour * 60;

  const emptyDay = artist.bookings.length === 0 && artist.blocks.length === 0;

  // duraciones que cierran dentro del día (nunca ofrecer un bloqueo imposible)
  const durationsFor = (time: string) => {
    const room = SHOP.closeHour * 60 - timeToMinutes(time);
    return BLOCK_DURATIONS.filter((m) => m <= room);
  };

  return (
    <div className="relative">
      {error && <p className="type-micro mb-4 text-red">{error}</p>}

      {/* encabezado del artista */}
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <p className="font-system text-[13px] text-bone">
          AGENDA — <span className="text-offwhite">{artist.name}</span>
          {artist.tag && <span className="text-red"> / {artist.tag}</span>}
        </p>
        <p className="type-micro text-smoke">
          {artist.bookings.length} SESIONES ·{" "}
          {artist.blocks.reduce((sum, bl) => sum + blockMinutes(bl.minutes), 0) / SHOP.slotStep}{" "}
          SLOTS BLOQUEADOS
        </p>
      </div>

      {/* leyenda de lectura rápida */}
      <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2" aria-hidden="true">
        <span className="flex items-center gap-2 type-micro text-smoke">
          <span
            className="h-2.5 w-2.5 bg-coal"
            style={{ border: "1px solid var(--color-line)", borderLeft: "3px solid var(--color-red)" }}
          />
          SESIÓN
        </span>
        <span className="flex items-center gap-2 type-micro text-smoke">
          <span
            className="h-2.5 w-2.5"
            style={{
              background: "repeating-linear-gradient(-45deg, rgba(229,35,27,0.35) 0 3px, rgba(229,35,27,0.08) 3px 6px)",
              border: "1px solid rgba(229,35,27,0.5)",
            }}
          />
          BLOQUEO
        </span>
        <span className="flex items-center gap-2 type-micro text-smoke">
          <span className="h-2.5 w-2.5 border border-dashed border-smoke/60" />
          LIBRE
        </span>
        {showNow && (
          <span className="flex items-center gap-2 type-micro text-red">
            <span className="h-px w-4 bg-red" />
            AHORA · {minutesToTime(clock.minutes)}
          </span>
        )}
      </div>

      {emptyDay && (
        <p className="type-micro mb-4 text-bone/60">
          EL DÍA ESTÁ LIBRE — click en un hueco para bloquear.
        </p>
      )}

      {/* fila de tiempo */}
      <div className="relative" style={{ minHeight: slots.length * ROW_H }}>
        {/* gutter de horas */}
        <div className="absolute inset-y-0 left-0 w-14 select-none" aria-hidden="true">
          {slots.map((s) => {
            const [h, m] = s.split(":");
            const past = isToday && timeToMinutes(s) < clock.minutes;
            return (
              <div key={s} className="relative" style={{ height: ROW_H }}>
                {m === "00" && (
                  <span className={`type-micro absolute left-0 top-[3px] ${past ? "text-smoke/40" : "text-bone/80"}`}>
                    {h}:00
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* el canvas de slots */}
        <div className="relative ml-14 md:ml-16" role="list" aria-label={`Agenda de ${artist.name}`}>
          {slots.map((time) => {
            const booking = bookingsByStart.get(time);
            const block = blocksByStart.get(time);
            const covered = // slot tapado por la cola de una sesión o bloqueo previo
              artist.bookings.some((b) => {
                const bStart = timeToMinutes(b.time);
                return timeToMinutes(time) > bStart && timeToMinutes(time) < bStart + b.minutes;
              }) ||
              artist.blocks.some((bl) => {
                const bStart = timeToMinutes(bl.time);
                return (
                  timeToMinutes(time) > bStart &&
                  timeToMinutes(time) < bStart + blockMinutes(bl.minutes)
                );
              });
            const past = isToday && timeToMinutes(time) < clock.minutes;

            if (booking) {
              const spanRows = Math.ceil(booking.minutes / SHOP.slotStep);
              const done = booking.status === "completed";
              return (
                <div
                  key={time}
                  role="listitem"
                  className="group absolute inset-x-0 border bg-coal px-4 py-2.5 transition-opacity duration-300"
                  style={{
                    height: spanRows * ROW_H - 4,
                    top: slots.indexOf(time) * ROW_H + 2,
                    borderLeft: "3px solid var(--color-red)",
                    borderColor: done ? "rgba(229,35,27,0.25)" : "var(--color-line)",
                    opacity: done ? 0.62 : 1,
                  }}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <p
                      className={`font-system text-[12px] tracking-[0.06em] ${
                        done ? "text-smoke line-through decoration-red/70" : "text-offwhite"
                      }`}
                    >
                      {booking.time} — {booking.name.toUpperCase()}
                    </p>
                    <p className="type-micro text-bone/75">
                      {booking.serviceName} · {booking.minutes}′ · {priceARS(booking.price)}
                    </p>
                  </div>
                  {booking.notes && (
                    <p className="type-micro mt-1 truncate text-bone/70">“{booking.notes}”</p>
                  )}
                  <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="type-micro text-bone/60">
                      {booking.id} · {booking.phone}
                    </p>
                    <button
                      disabled={busy}
                      onClick={() => (done ? onReopen(booking.id) : onComplete(booking.id))}
                      className={`type-micro border px-2 py-0.5 transition-colors duration-200 disabled:opacity-40 ${
                        done
                          ? "border-line text-smoke hover:border-smoke hover:text-bone"
                          : "border-red/50 text-red/90 hover:border-red hover:text-red"
                      }`}
                      aria-label={
                        done
                          ? `Reabrir sesión ${booking.id} — volver a confirmada`
                          : `Marcar sesión ${booking.id} como completada`
                      }
                      title={done ? "Se marcó por error — reabrir" : "El corte está hecho"}
                    >
                      {done ? "REABRIR" : "✓ CORTADO"}
                    </button>
                  </div>
                </div>
              );
            }

            if (block) {
              const spanRows = Math.ceil(blockMinutes(block.minutes) / SHOP.slotStep);
              return (
                <button
                  key={time}
                  role="listitem"
                  disabled={busy}
                  onClick={() => {
                    if (confirmUnblock === block.id) {
                      onUnblock(block.id);
                      setConfirmUnblock(null);
                    } else {
                      setConfirmUnblock(block.id);
                      setPending(null);
                    }
                  }}
                  className="group absolute inset-x-0 px-4 py-2 text-left transition-colors"
                  style={{
                    height: spanRows * ROW_H - 4,
                    top: slots.indexOf(time) * ROW_H + 2,
                    background:
                      "repeating-linear-gradient(-45deg, rgba(229,35,27,0.10) 0 6px, rgba(229,35,27,0.03) 6px 12px)",
                    border: "1px solid rgba(229,35,27,0.35)",
                  }}
                  aria-label={`Bloqueado ${time} a ${minutesToTime(
                    timeToMinutes(time) + blockMinutes(block.minutes)
                  )} — ${block.reason}. Click para desbloquear.`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <p className="type-micro text-red/90">
                      {time}–{minutesToTime(timeToMinutes(time) + blockMinutes(block.minutes))}{" "}
                      — {block.reason}
                    </p>
                    <p className="type-micro text-smoke/70 group-hover:text-bone">
                      {confirmUnblock === block.id ? "¿SEGURO? CLICK DE NUEVO" : "CORTAR BLOQUEO"}
                    </p>
                  </div>
                  {spanRows > 1 && (
                    <p className="type-micro mt-1 text-smoke/60">{blockMinutes(block.minutes)}′</p>
                  )}
                </button>
              );
            }

            if (covered) return null; // la sesión de arriba cubre este slot

            // hueco libre
            return (
              <div key={time} role="listitem" className="absolute inset-x-0" style={{ height: ROW_H, top: slots.indexOf(time) * ROW_H }}>
                <button
                  disabled={busy || past}
                  onClick={() => {
                    setPending(pending === time ? null : time);
                    setConfirmUnblock(null);
                    setReason("");
                    setDuration(durationsFor(time)[0] ?? SHOP.slotStep);
                  }}
                  className="absolute inset-0 flex items-center justify-between border border-dashed border-line/70 px-4 text-left transition-colors duration-200 hover:border-smoke disabled:opacity-30"
                  aria-label={`Horario libre ${time}. Click para bloquear.`}
                >
                  <span className={`type-micro ${past ? "text-smoke/40" : "text-bone/70"}`}>
                    {time}
                  </span>
                  {!past && (
                    <span className="type-micro text-smoke/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      + BLOQUEAR
                    </span>
                  )}
                </button>
                {pending === time && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      onBlock(time, reason || undefined, duration);
                      setPending(null);
                    }}
                    className="absolute inset-x-0 z-10 border border-red/40 bg-black px-3 py-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.7)]"
                    style={{ top: 0, height: "auto", minHeight: ROW_H }}
                  >
                    <div className="flex items-center gap-2">
                      <label className="sr-only" htmlFor={`reason-${time}`}>
                        Motivo del bloqueo
                      </label>
                      <input
                        id={`reason-${time}`}
                        value={reason}
                        onChange={(e) => setReason(e.target.value.toUpperCase())}
                        placeholder="MOTIVO (OPCIONAL)"
                        maxLength={60}
                        autoFocus
                        className="b-input flex-1 py-1.5 text-[12px]"
                        style={{ textTransform: "uppercase" }}
                      />
                      <button type="submit" disabled={busy} className="b-btn px-3 py-1.5 text-[11px]">
                        {busy ? "…" : "BLOQUEAR"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPending(null)}
                        className="b-link text-[11px]"
                      >
                        NO
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2" role="radiogroup" aria-label="Duración del bloqueo">
                      <span className="type-micro text-smoke/70">DURACIÓN</span>
                      {durationsFor(time).map((m) => (
                        <button
                          key={m}
                          type="button"
                          role="radio"
                          aria-checked={duration === m}
                          onClick={() => setDuration(m)}
                          className={`type-micro border px-2 py-1 transition-colors duration-200 ${
                            duration === m
                              ? "border-red text-red"
                              : "border-line text-smoke hover:border-smoke hover:text-bone"
                          }`}
                        >
                          {m}′
                        </button>
                      ))}
                    </div>
                  </form>
                )}
              </div>
            );
          })}

          {/* línea de AHORA: el corte rojo que avanza con el día */}
          {showNow && (
            <div
              className="pointer-events-none absolute inset-x-0 z-20"
              style={{ top: nowTop }}
              aria-hidden="true"
            >
              <div className="relative h-px bg-red shadow-[0_0_8px_rgba(229,35,27,0.55)]" />
              <span className="type-micro absolute right-0 -top-4 bg-black/80 px-1 text-red">
                AHORA
              </span>
            </div>
          )}
        </div>
      </div>

      {/* pie: próximas sesiones del día (lista plana para móvil) */}
      {artist.bookings.length > 0 && (
        <div className="mt-8 md:hidden">
          <p className="type-micro text-smoke">SESIONES DE HOY</p>
          <ul className="mt-2 divide-y divide-line border-t border-line">
            {artist.bookings.map((b) => (
              <li key={b.id} className="flex items-baseline justify-between gap-3 py-3">
                <span
                  className={`font-system text-[12px] ${
                    b.status === "completed" ? "text-smoke line-through decoration-red/70" : "text-offwhite"
                  }`}
                >
                  {b.time} — {b.name.toUpperCase()}
                </span>
                {b.status === "confirmed" ? (
                  <button
                    disabled={busy}
                    onClick={() => onComplete(b.id)}
                    className="type-micro border border-red/50 px-2 py-0.5 text-red/90 disabled:opacity-40"
                  >
                    ✓ CORTADO
                  </button>
                ) : (
                  <span className="type-micro text-smoke/60">HECHO</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------------- CLIENTES: quién llama ---------------- */

function ClientLookup({ code }: { code: string }) {
  const [q, setQ] = useState("");
  const trimmed = q.trim();

  const { data, isFetching, isError } = useQuery({
    queryKey: ["cabina-clients", code, trimmed],
    queryFn: () => searchClients(code, trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 20_000,
    retry: false,
  });

  const clients = data?.clients ?? [];

  return (
    <div className="mt-8 border border-line bg-coal">
      <p className="type-micro border-b border-line px-5 py-3 text-red">
        CLIENTES — QUIÉN LLAMA
      </p>
      <div className="p-5">
        <label htmlFor="cabina-client-search" className="sr-only">
          Buscar cliente por teléfono o nombre
        </label>
        <input
          id="cabina-client-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="TELÉFONO O NOMBRE…"
          autoComplete="off"
          className="b-input w-full py-2 text-[12px]"
        />

        {trimmed.length >= 2 && isFetching && (
          <p className="type-micro mt-4 text-bone">BUSCANDO…</p>
        )}
        {trimmed.length >= 2 && !isFetching && isError && (
          <p className="type-micro mt-4 text-red">NO SE PUDO BUSCAR. REINTENTÁ.</p>
        )}
        {trimmed.length >= 2 && !isFetching && !isError && clients.length === 0 && (
          <p className="type-micro mt-4 text-smoke">
            NO HAY COINCIDENCIAS — primera vez que llama.
          </p>
        )}
        {trimmed.length < 2 && (
          <p className="type-micro mt-4 text-smoke/70">
            Dos teclas y sabés quién es: su historia y su próxima sesión.
          </p>
        )}

        <ul className="mt-4 space-y-5">
          {clients.map((c) => (
            <li key={c.phone + c.name} className="border-t border-line pt-4 first:border-t-0 first:pt-0">
              <p className="font-system text-[13px] text-offwhite">
                {c.name.toUpperCase()}
                <span className="ml-2 text-bone/60">{c.phone}</span>
              </p>
              <p className="type-micro mt-1.5 text-smoke">
                {c.totalSessions} {c.totalSessions === 1 ? "SESIÓN" : "SESIONES"} ·{" "}
                {priceARS(c.spent)}
                {c.cancelled > 0 && <span className="text-smoke/60"> · {c.cancelled} CORTADAS</span>}
              </p>
              {c.nextSession ? (
                <p className="type-micro mt-2 text-red">
                  PRÓXIMA — {formatLongDate(c.nextSession.date)} {c.nextSession.time} ·{" "}
                  {c.nextSession.artist} · {c.nextSession.service}
                </p>
              ) : (
                <p className="type-micro mt-2 text-smoke/70">SIN SESIÓN ACTIVA</p>
              )}
              {c.history.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {c.history.map((h) => (
                    <li key={h.id} className="type-micro flex items-baseline justify-between gap-3">
                      <span className={h.status === "cancelled" ? "text-smoke/40 line-through" : "text-bone/70"}>
                        {h.date} {h.time} — {h.service}
                      </span>
                      <span className="text-smoke/50">{h.artist}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------------- LA LISTA: el club de los viernes ---------------- */

/** Fecha BA (YYYY-MM-DD) de un ISO datetime — el reloj del negocio manda. */
const BA_DAY_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Buenos_Aires",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
function clubDay(iso: string): string {
  const parts = Object.fromEntries(
    BA_DAY_FMT.formatToParts(new Date(iso)).map((p) => [p.type, p.value])
  ) as Record<string, string>;
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function ClubList({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["cabina-club", code],
    queryFn: () => fetchClubList(code),
    staleTime: 60_000,
    retry: false,
  });

  const list = data?.list ?? [];
  const total = data?.total ?? 0;

  // copiar la lista entera "NOMBRE — CONTACTO" (fallback textarea, como el pase)
  const copyList = async () => {
    if (list.length === 0) return;
    const text = list.map((s) => `${s.name} — ${s.contact}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-8 border border-line bg-coal">
      <div className="flex items-baseline justify-between gap-3 border-b border-line px-5 py-3">
        <p className="type-micro text-red">LA LISTA — EL CLUB</p>
        <span className="type-mono-label text-smoke" title="Total en la lista">
          {isLoading ? "…" : total}
        </span>
      </div>
      <div className="p-5">
        {isLoading && <p className="type-micro text-bone">TRAYENDO LA LISTA…</p>}
        {isError && <p className="type-micro text-red">NO SE PUDO TRAER LA LISTA. REINTENTÁ.</p>}
        {!isLoading && !isError && list.length === 0 && (
          <p className="type-micro text-smoke">
            TODAVÍA NADIE — LA PUERTA SE ABRE VIERNES 19:30.
          </p>
        )}
        {list.length > 0 && (
          <ul
            className="max-h-64 space-y-3 overflow-y-auto pr-2"
            style={{ scrollbarWidth: "thin" }}
            aria-label="Altas del club"
          >
            {list.map((s) => (
              <li key={s.id} className="border-t border-line pt-3 first:border-t-0 first:pt-0">
                <p className="font-system text-[13px] text-bone">{s.name.toUpperCase()}</p>
                <p className="type-micro mt-1 text-smoke">
                  {s.contact} · {formatLongDate(clubDay(s.createdAt))}
                </p>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={copyList}
          disabled={list.length === 0}
          className={`type-micro w-full border py-2.5 transition-colors duration-200 disabled:opacity-40 ${
            copied
              ? "border-red text-red"
              : "border-line text-bone hover:border-smoke hover:text-chalk"
          }`}
        >
          {copied ? "COPIADA ✓" : "COPIAR LISTA"}
        </button>
      </div>
    </div>
  );
}

/* ---------------- HOJA DE RUTA: versión imprimible del día ---------------- */

function PrintSheet({
  data,
  date,
  today,
}: {
  data: AgendaResponse | null;
  date: string;
  today: string;
}) {
  if (!data || typeof document === "undefined") return null;

  const sheet = (
    <div data-print-root="cabina" className="print-sheet">
      <header className="ps-header">
        <div>
          <p className="ps-brand">BARDOS — LA CABINA</p>
          <h1 className="ps-title">HOJA DE RUTA · {formatLongDate(date)}</h1>
        </div>
        <p className="ps-meta">
          {date === today ? "DÍA DE HOY" : "AGENDA"}
          <br />
          GENERADA {minutesToTime(nowBuenosAires().minutes)} HS
        </p>
      </header>

      <div className="ps-stats">
        <span>
          SESIONES <strong>{data.stats.totalBookings}</strong>
        </span>
        <span>
          CAJA <strong>{priceARS(data.stats.revenue)}</strong>
        </span>
        <span>
          BLOQUEADO <strong>{data.stats.totalBlockMinutes}′</strong>
        </span>
        <span>
          OCUPACIÓN{" "}
          <strong>
            {data.stats.capacityMinutes > 0
              ? Math.round((data.stats.bookedMinutes / data.stats.capacityMinutes) * 100) + "%"
              : "—"}
          </strong>
        </span>
      </div>

      {data.artists.map((a) => {
        const events = [
          ...a.bookings.map((b) => ({
            kind: b.status === "completed" ? "done" : "booking",
            time: b.time,
            minutes: b.minutes,
            label: b.name.toUpperCase() + (b.status === "completed" ? " ✓" : ""),
            detail: `${b.serviceName} · ${b.minutes}′ · ${priceARS(b.price)}`,
            notes: b.notes ?? "",
            phone: b.phone,
          })),
          ...a.blocks.map((bl) => ({
            kind: "block" as const,
            time: bl.time,
            minutes: bl.minutes || SHOP.slotStep,
            label: bl.reason,
            detail: `BLOQUEO · ${(bl.minutes || SHOP.slotStep)}′`,
            notes: "",
            phone: "",
          })),
        ].sort((x, y) => (x.time < y.time ? -1 : 1));

        return (
          <section key={a.id} className="ps-artist">
            <h2 className="ps-artist-name">
              {a.name}
              {a.tag ? ` — ${a.tag}` : ""}
              <span className="ps-artist-meta">
                {a.bookings.length} {a.bookings.length === 1 ? "SESIÓN" : "SESIONES"} ·{" "}
                {priceARS(a.bookings.reduce((s, b) => s + b.price, 0))}
              </span>
            </h2>
            {events.length === 0 ? (
              <p className="ps-empty">— DÍA LIBRE —</p>
            ) : (
              <table className="ps-table">
                <tbody>
                  {events.map((e) => (
                    <tr key={e.kind + e.time} className={e.kind === "block" ? "ps-block-row" : ""}>
                      <td className="ps-time">
                        {e.time}–{minutesToTime(timeToMinutes(e.time) + e.minutes)}
                      </td>
                      <td className="ps-client">{e.label}</td>
                      <td className="ps-detail">{e.detail}</td>
                      <td className="ps-phone">{e.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {a.bookings.some((b) => b.notes) && (
              <div className="ps-notes">
                <p className="ps-notes-title">NOTAS DE SESIONES</p>
                {a.bookings
                  .filter((b) => b.notes)
                  .map((b) => (
                    <p key={b.id}>
                      {b.time} — {b.name.toUpperCase()}: “{b.notes}”
                    </p>
                  ))}
              </div>
            )}
          </section>
        );
      })}

      <footer className="ps-footer">
        CORTÁ EL RUIDO · AV. SAN MARTÍN 2123 · {SHOP.openHour}:00–{SHOP.closeHour}:00 HS · ESTE
        PAPEL SE CORTA AL CIERRE
      </footer>
    </div>
  );

  return createPortal(sheet, document.body);
}
