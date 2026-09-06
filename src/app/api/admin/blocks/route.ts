// LaPeluqueriaCo — LA CABINA: bloqueo y desbloqueo de horarios.
// POST   { artistId, date, time, minutes?, reason? } → crea bloqueo (30/60/90/120′)
// DELETE ?id=…                                      → lo corta
// Acceso: header x-cabina-code (compartido con agenda).
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { SHOP, bookableDates, candidateSlots, timeToMinutes } from "@/lib/bardos/domain";

function checkCabinaCode(req: NextRequest): boolean {
  const expected = process.env.CABINA_CODE ?? "MMXIX";
  const got = req.headers.get("x-cabina-code") ?? "";
  return got.trim().toUpperCase() === expected.toUpperCase();
}

const BlockSchema = z.object({
  artistId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  minutes: z.coerce.number().int().multipleOf(SHOP.slotStep).min(SHOP.slotStep).max(SHOP.slotStep * 4).optional(),
  reason: z.string().trim().max(60).optional(),
});

export async function POST(req: NextRequest) {
  if (!checkCabinaCode(req)) {
    return NextResponse.json({ error: "Código incorrecto." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }
  const parsed = BlockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos incompletos." }, { status: 400 });
  }
  const { artistId, date, time, minutes, reason } = parsed.data;
  const blockMinutes = minutes ?? SHOP.slotStep;

  const artist = await db.artist.findUnique({ where: { id: artistId } });
  if (!artist) {
    return NextResponse.json({ error: "Ese artista no existe." }, { status: 400 });
  }

  // día atendido y dentro de la ventana de reserva
  const [y, m, d] = date.split("-").map(Number);
  const dayDate = new Date(y, m - 1, d);
  if (!SHOP.openDays.includes(dayDate.getDay())) {
    return NextResponse.json({ error: "Ese día el local está cerrado." }, { status: 400 });
  }
  if (!bookableDates().includes(date)) {
    return NextResponse.json({ error: "Ese día está fuera de la ventana." }, { status: 400 });
  }

  // el slot debe existir en la grilla de turnos y el bloqueo debe cerrar dentro
  // de la ventana de atención (nunca un bloqueo "que se pasa" de la hora de cierre)
  const validTimes = new Set(candidateSlots(date, SHOP.slotStep));
  if (!validTimes.has(time)) {
    return NextResponse.json({ error: "Ese horario no está en la grilla." }, { status: 400 });
  }
  const start = timeToMinutes(time);
  const end = start + blockMinutes;
  if (end > SHOP.closeHour * 60) {
    return NextResponse.json(
      { error: `El bloqueo termina después de las ${SHOP.closeHour}:00. Elegí menos duración.` },
      { status: 400 }
    );
  }

  // ¿hay una reserva activa que use ese rango? no se bloquea encima de un cliente
  const bookings = await db.booking.findMany({
    where: { artistId, date, status: { in: ["pending", "confirmed"] } },
  });
  const clash = bookings.some((b) => {
    const bStart = timeToMinutes(b.time);
    return start < bStart + b.minutes && bStart < end;
  });
  if (clash) {
    return NextResponse.json(
      { error: "Ese rango ya tiene una sesión. Cortala primero si querés liberarlo." },
      { status: 409 }
    );
  }

  // ¿ya está bloqueado (algún solapamiento de rango)?
  const otherBlocks = await db.blockedSlot.findMany({ where: { artistId, date } });
  const overlapBlock = otherBlocks.some((bl) => {
    const bStart = timeToMinutes(bl.time);
    const bEnd = bStart + (bl.minutes || SHOP.slotStep);
    return start < bEnd && bStart < end;
  });
  if (overlapBlock) {
    return NextResponse.json({ error: "Ese rango ya está bloqueado." }, { status: 409 });
  }

  const block = await db.blockedSlot.create({
    data: {
      artistId,
      date,
      time,
      minutes: blockMinutes,
      reason: reason && reason.length > 0 ? reason.toUpperCase() : "BLOQUEO",
    },
  });

  return NextResponse.json(
    { block: { id: block.id, artistId, date, time: block.time, minutes: block.minutes, reason: block.reason } },
    { status: 201 }
  );
}

export async function DELETE(req: NextRequest) {
  if (!checkCabinaCode(req)) {
    return NextResponse.json({ error: "Código incorrecto." }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!id) {
    return NextResponse.json({ error: "Falta el id del bloqueo." }, { status: 400 });
  }

  try {
    await db.blockedSlot.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Ese bloqueo ya no existe." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
