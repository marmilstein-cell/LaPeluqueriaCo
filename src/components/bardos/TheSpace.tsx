"use client";
// LaPeluqueriaCo — THE SPACE (ubicación, horarios y contacto integrados narrativamente)
// No un footer con íconos: cómo llegar, cuándo, de noche.
// El estado ABIERTO/CERRADO se calcula en vivo contra la hora real de
// San Martín de los Andes (useSyncExternalStore con snapshot cacheada — sin setState en effects).
import { useSyncExternalStore } from "react";
import { BImage } from "./BImage";
import { Slate, Reveal, Drift, CutDivider } from "./scene-utils";
import { SHOP, nowBuenosAires } from "@/lib/bardos/domain";

const HOURS = [
  ["MAR", "10—20"],
  ["MIÉ", "10—20"],
  ["JUE", "10—20"],
  ["VIE", "10—20"],
  ["SÁB", "10—20"],
  ["DOM", "CERRADO"],
  ["LUN", "CERRADO"],
];

const DAY_INDEX: Record<string, number> = { DOM: 0, LUN: 1, MAR: 2, MIÉ: 3, JUE: 4, VIE: 5, SÁB: 6 };

/** Próxima apertura: "HOY 10:00" / "MAR 10:00" — camina hasta el próximo día atendido. */
function nextOpening(iso: string, todayDow: number): string {
  const DOW_LABEL = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
  const now = nowBuenosAires();
  // hoy todavía puede abrir (día atendido, antes de las 10)
  if (SHOP.openDays.includes(todayDow) && now.minutes < SHOP.openHour * 60) {
    return `HOY ${SHOP.openHour}:00`;
  }
  const base = new Date(`${iso}T12:00:00`);
  for (let i = 1; i <= 7; i++) {
    const day = new Date(base);
    day.setDate(base.getDate() + i);
    if (SHOP.openDays.includes(day.getDay())) {
      return `${DOW_LABEL[day.getDay()]} ${SHOP.openHour}:00`;
    }
  }
  return "";
}

interface LiveStatus {
  open: boolean;
  today: string;
  nextOpen: string;
}

/** Snapshot cacheada por minuto: referencia estable entre renders. */
let liveCache: { raw: string; value: LiveStatus } | null = null;

function getLiveSnapshot(): LiveStatus | null {
  if (typeof window === "undefined") return null; // server: sin badge (sin mismatch)
  const now = nowBuenosAires();
  const todayDow = new Date(`${now.iso}T12:00:00`).getDay();
  const openDay = SHOP.openDays.includes(todayDow);
  const inHours = now.minutes >= SHOP.openHour * 60 && now.minutes < SHOP.closeHour * 60;
  const open = openDay && inHours;
  const nextOpen = nextOpening(now.iso, todayDow);
  const raw = `${now.iso}|${open}|${nextOpen}`;
  if (liveCache && liveCache.raw === raw) return liveCache.value;
  const value: LiveStatus = { open, today: now.iso, nextOpen };
  liveCache = { raw, value };
  return value;
}

/** El local, en vivo: se re-chequea cada 30″ contra el reloj de San Martín de los Andes. */
const subscribeClock = (cb: () => void) => {
  const id = setInterval(cb, 30_000);
  return () => clearInterval(id);
};
const serverSnapshot = () => null;

function useLiveStatus(): LiveStatus | null {
  return useSyncExternalStore(subscribeClock, getLiveSnapshot, serverSnapshot);
}

const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  "Bardos Barber, " + SHOP.address + ", San Martín de los Andes, Neuquén, Argentina"
)}`;
const waUrl = `https://wa.me/${SHOP.phoneWa}`;

export function TheSpace() {
  const live = useLiveStatus();
  const todayDow = live ? new Date(`${live.today}T12:00:00`).getDay() : -1;

  return (
    <section
      id="space"
      aria-label="El Cuarto — el local y cómo llegar"
      className="relative bg-black"
      style={{ padding: "var(--spacing-b8) var(--grid-margin)" }}
    >
      <Slate>ACTO II — EL CUARTO</Slate>

      <Reveal as="h2" className="font-display font-display-tight type-display-sm mt-8 text-offwhite">
        EL CUARTO<span className="text-red">.</span>
      </Reveal>

      {/* Composición editorial: sillón + espejo */}
      <div className="mt-12 grid gap-5 md:mt-16 md:grid-cols-12 md:gap-6">
        <div className="relative aspect-[3/4] overflow-hidden md:col-span-5">
          <Drift className="absolute inset-0" amount={24}>
            <BImage
              src="/images/space-chair.webp"
              alt="Sillón de barbería vintage en cuero negro y cromo, luz lateral"
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              imgClassName="object-cover scale-[1.05]"
            />
          </Drift>
          <p className="type-micro absolute bottom-4 left-4 text-bone">SILLÓN 04 — CROMO / CUERO</p>
        </div>

        <div className="grid gap-5 md:col-span-7 md:grid-cols-2 md:gap-6">
          <div className="relative aspect-square overflow-hidden">
            <BImage
              src="/images/space-mirror.webp"
              alt="Espejo redondo con lamparitas reflejando un sillón vacío"
              fill
              sizes="(max-width: 768px) 50vw, 30vw"
              imgClassName="object-cover"
            />
            <p className="type-micro absolute bottom-4 left-4 text-bone">EL ESPEJO — TESTIGO</p>
          </div>
          {/* Datos duros como cartel técnico */}
          <div className="flex aspect-square flex-col justify-between border border-line bg-coal p-6">
            <p className="type-micro text-smoke">DÓNDE</p>
            <div>
              <p className="font-display text-[clamp(18px,2vw,26px)] text-offwhite">{SHOP.address}</p>
              <p className="type-mono-label mt-2 text-bone">CABA — NEUQUÉN</p>
              <div className="mt-5 flex flex-col gap-3">
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="b-link">
                  CÓMO LLEGAR →
                </a>
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="b-link">
                  WHATSAPP DEL LOCAL →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Horarios como tabla de catálogo */}
      <div className="mt-16 md:mt-24">
        <CutDivider />
        <div className="mt-10 grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Reveal as="h3" className="font-editorial type-editorial-md text-offwhite">
              Cuándo encontrarnos.
            </Reveal>
            <Reveal delay={0.08}>
              <p className="font-system mt-4 text-body text-bone/80">
                Martes a sábado, de 10 a 20. Domingo y lunes el oficio descansa —
                las navajas también.
              </p>
            </Reveal>
            {/* estado en vivo: la línea de luz del local, ahora */}
            {live && (
              <Reveal delay={0.14}>
                <div
                  className="mt-6 inline-flex items-center gap-3 border px-4 py-2.5"
                  aria-live="polite"
                  style={{ borderColor: live.open ? "rgba(229,35,27,0.45)" : "var(--color-line)" }}
                >
                  <span
                    aria-hidden="true"
                    className={`block h-1.5 w-1.5 rounded-full ${
                      live.open ? "animate-pulse bg-red" : "bg-smoke"
                    }`}
                  />
                  <span className="type-micro text-chalk">
                    AHORA — {live.open ? "ABIERTO" : "CERRADO"}
                  </span>
                  <span className="type-micro text-smoke">
                    {live.open ? `HASTA LAS ${SHOP.closeHour}:00` : `VOLVEMOS ${live.nextOpen}`}
                  </span>
                </div>
              </Reveal>
            )}
          </div>
          <ul className="md:col-span-4 md:col-start-8" aria-label="Horarios de atención">
            {HOURS.map(([d, h], i) => {
              const isToday = DAY_INDEX[d] === todayDow;
              return (
                <li
                  key={d}
                  className={`relative flex items-baseline justify-between border-b border-line py-3.5 transition-colors duration-300 ${
                    isToday ? "border-line pl-4 text-chalk" : h === "CERRADO" ? "text-smoke" : "text-chalk"
                  }`}
                >
                  {/* fila de HOY: la hairline de corte la marca */}
                  {isToday && (
                    <span aria-hidden="true" className="absolute left-0 top-1 bottom-1 w-[2px] bg-red" />
                  )}
                  <span className={`type-mono-label ${isToday ? "text-offwhite" : ""}`}>
                    {d}
                    {isToday && <span className="ml-2 text-red">— HOY</span>}
                  </span>
                  <span className="type-mono-label">{h}</span>
                  <span className="scene-no w-8 text-right">{String(i + 1).padStart(2, "0")}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* De noche — el plano final */}
      <div className="relative mt-16 h-[58vh] w-full overflow-hidden md:mt-24 md:h-[74vh]">
        <Drift className="absolute inset-0" amount={30}>
          <BImage
            src="/images/space-night.webp"
            alt="Fachada de Bardos de noche: el vidrio encendido sobre la calle oscura"
            fill
            sizes="100vw"
            imgClassName="object-cover scale-[1.06]"
          />
        </Drift>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <p className="type-micro absolute bottom-6 left-0 right-0 px-6 text-bone md:bottom-10">
          DE NOCHE, EL CARTEL SE QUEDA SOLO — AV. SAN MARTÍN 2123
        </p>
      </div>
    </section>
  );
}
