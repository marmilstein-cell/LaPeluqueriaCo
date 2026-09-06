// BARDOS — dominio compartido del booking engine (contrato Apéndice C)

export interface Service {
  id: string;
  name: string; // "CUT", "CUT + BEARD"...
  nameEs: string;
  desc: string;
  durationMinutes: number;
  price: number;
  imageRef: string;
}

export interface Artist {
  id: string;
  name: string;
  tag: string | null;
  specialty: string;
  bio: string;
  photoRef: string;
  availableServiceIds: string[];
}

export interface Slot {
  id: string; // `${artistId}|${date}|${time}`
  artistId: string;
  date: string; // ISO "2026-01-16"
  time: string; // "18:30"
  available: boolean;
}

export interface Customer {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

export type SessionStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "rescheduled"
  | "completed";

export interface Session {
  id: string; // "BRD-0247"
  serviceId: string;
  artistId: string;
  slotId: string;
  date: string;
  time: string;
  minutes: number;
  price: number;
  customer: Customer;
  status: SessionStatus;
  createdAt: string;
}

// ---------- Configuración del negocio ----------

export const SHOP = {
  name: "BARDOS",
  city: "SAN MARTÍN DE LOS ANDES",
  // días de atención: martes(2) a sábado(6) — number[] para includes(day)
  openDays: [2, 3, 4, 5, 6] as number[],
  openHour: 10, // 10:00
  closeHour: 20, // 20:00
  slotStep: 30, // granularidad de turnos (min)
  leadMinutes: 45, // anticipación mínima para reservar
  daysAhead: 21, // ventana de reserva
  address: "Av. San Martín 2123, Galería Los Nogales",
  phoneWa: "5492944603267", // WhatsApp del local (wa.me)
  instagram: "@bardos.bbca",
} as const;

/** Nombre visible del barbero por id — hoy hay un solo barbero. */
const ARTIST_NAMES: Record<string, string> = { tomas: "TOMÁS BUCHETT" };
export function artistDisplayName(id: string): string {
  return ARTIST_NAMES[id] ?? id.toUpperCase();
}

export function slotId(artistId: string, date: string, time: string): string {
  return `${artistId}|${date}|${time}`;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Rango de fechas reservables (desde hoy, SHOP.daysAhead) en ISO local. */
export function bookableDates(today = new Date()): string[] {
  const out: string[] = [];
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  for (let i = 0; i <= SHOP.daysAhead; i++) {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    if (SHOP.openDays.includes(day.getDay())) {
      out.push(toISODate(day));
    }
  }
  return out;
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Ahora en San Martín de los Andes (misma zona horaria que Buenos Aires,
 *  UTC-3 — el reloj del negocio). */
export function nowBuenosAires(): { iso: string; minutes: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(new Date()).map((p) => [p.type, p.value])
  ) as Record<string, string>;
  const hour = parts.hour === "24" ? "00" : parts.hour;
  return {
    iso: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(hour) * 60 + Number(parts.minute),
  };
}

/** Horarios candidatos crudos para un servicio de N minutos (sin descontar reservas). */
export function candidateSlots(date: string, serviceMinutes: number): string[] {
  const out: string[] = [];
  const lastStart = SHOP.closeHour * 60 - serviceMinutes;
  for (let t = SHOP.openHour * 60; t <= lastStart; t += SHOP.slotStep) {
    out.push(minutesToTime(t));
  }
  return out;
}

const DAY_NAMES = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const MONTH_NAMES = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
];

export function formatDayLabel(iso: string): { day: string; num: string; month: string } {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    day: DAY_NAMES[date.getDay()],
    num: String(d).padStart(2, "0"),
    month: MONTH_NAMES[date.getMonth()],
  };
}

export function formatLongDate(iso: string): string {
  const { day, num, month } = formatDayLabel(iso);
  return `${day} ${num} ${month}`;
}

export function priceARS(n: number): string {
  return `$${n.toLocaleString("es-AR")}`;
}
