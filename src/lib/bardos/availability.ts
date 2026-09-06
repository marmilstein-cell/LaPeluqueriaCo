// BARDOS — motor de disponibilidad (server-side)
// La disponibilidad se computa: horarios de trabajo − reservas activas.
// Preparado para migrar a Cal.com / Google Calendar sin tocar la UI (ver brief 08.11).
import { db } from "@/lib/db";
import {
  SHOP,
  candidateSlots,
  slotId as makeSlotId,
  timeToMinutes,
  bookableDates,
  nowBuenosAires,
  toISODate,
} from "./domain";

export async function getAvailability(
  artistId: string,
  serviceId: string,
  date: string
): Promise<{ slots: { id: string; time: string; available: boolean }[]; reason?: string }> {
  const service = await db.service.findUnique({ where: { id: serviceId } });
  const artist = await db.artist.findUnique({ where: { id: artistId } });
  if (!service || !artist) return { slots: [], reason: "unknown" };

  // día atendido?
  const [y, m, d] = date.split("-").map(Number);
  const dayDate = new Date(y, m - 1, d);
  if (!SHOP.openDays.includes(dayDate.getDay())) return { slots: [], reason: "closed" };

  // fecha dentro de la ventana?
  const valid = bookableDates().includes(date);
  if (!valid) return { slots: [], reason: "out-of-window" };

  // reservas activas + bloqueos de cabina del artista ese día
  // (completed cuenta como ocupado: la sesión pasó, el slot se usó)
  const [bookings, blocks] = await Promise.all([
    db.booking.findMany({
      where: { artistId, date, status: { in: ["pending", "confirmed", "completed"] } },
    }),
    db.blockedSlot.findMany({ where: { artistId, date } }),
  ]);

  const nowBA = nowBuenosAires();
  const isToday = nowBA.iso === date;
  const cutoff = nowBA.minutes + SHOP.leadMinutes;

  const slots = candidateSlots(date, service.minutes).map((time) => {
    const start = timeToMinutes(time);
    const end = start + service.minutes;
    // ¿se superpone con una reserva activa?
    const overlaps = bookings.some((b) => {
      const bStart = timeToMinutes(b.time);
      const bEnd = bStart + b.minutes;
      return start < bEnd && bStart < end;
    });
    // ¿o con un bloqueo de cabina? (ocupa bl.minutes, múltiplo de slotStep)
    const overlapsBlock = blocks.some((bl) => {
      const bStart = timeToMinutes(bl.time);
      const bEnd = bStart + (bl.minutes || SHOP.slotStep);
      return start < bEnd && bStart < end;
    });
    const tooLate = isToday && start < cutoff;
    return {
      id: makeSlotId(artistId, date, time),
      time,
      available: !overlaps && !overlapsBlock && !tooLate,
    };
  });

  return { slots };
}

/** Alternativas más cercanas cuando el turno elegido ya no está (edge case 08.10). */
export async function nearestAlternatives(
  artistId: string,
  serviceId: string,
  date: string,
  time: string
): Promise<{ date: string; time: string }[]> {
  const [y, m, d] = date.split("-").map(Number);
  const base = new Date(y, m - 1, d);
  const targetMinutes = timeToMinutes(time);
  const results: { date: string; time: string; dist: number }[] = [];

  // mirar el mismo día y hasta ±6 días con disponibilidad
  for (let offset = 0; offset <= 6 && results.length < 6; offset++) {
    for (const dir of offset === 0 ? [0] : [1, -1]) {
      const day = new Date(base);
      day.setDate(base.getDate() + dir * offset);
      const iso = toISODate(day);
      const { slots } = await getAvailability(artistId, serviceId, iso);
      for (const s of slots) {
        if (!s.available) continue;
        const dayDiff =
          offset * 1440 * (dir === 0 ? 0 : 1) + Math.abs(timeToMinutes(s.time) - targetMinutes) * (dir < 0 ? -1 : 1);
        const dist = offset * 1440 + Math.abs(timeToMinutes(s.time) - targetMinutes);
        results.push({ date: iso, time: s.time, dist: dayDiff >= 0 ? dist : 100000 + dist });
      }
    }
  }
  const sorted = results.sort((a, b) => a.dist - b.dist);
  const seen = new Set<string>();
  const out: { date: string; time: string }[] = [];
  for (const r of sorted) {
    const key = `${r.date}|${r.time}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ date: r.date, time: r.time });
    if (out.length === 2) break;
  }
  return out;
}
