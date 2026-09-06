import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAvailability, nearestAlternatives } from "@/lib/bardos/availability";
import { toSession } from "@/lib/bardos/serialize";
import { SHOP } from "@/lib/bardos/domain";

const BodySchema = z.object({
  serviceId: z.string().min(1),
  artistId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  customer: z.object({
    name: z.string().trim().min(2, "El nombre es corto."),
    phone: z.string().trim().min(6, "El teléfono está incompleto."),
    email: z.string().email("El email no parece un email.").optional().or(z.literal("")),
    notes: z.string().max(300).optional(),
  }),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos incompletos.", issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }
  const { serviceId, artistId, date, time, customer } = parsed.data;

  const service = await db.service.findUnique({ where: { id: serviceId } });
  const artist = await db.artist.findUnique({
    where: { id: artistId },
    include: { services: { select: { serviceId: true } } },
  });
  if (!service || !artist) {
    return NextResponse.json({ error: "Ese servicio o artista no existe." }, { status: 400 });
  }
  if (!artist.services.some((s) => s.serviceId === serviceId)) {
    return NextResponse.json(
      { error: `${artist.name} no hace ${service.name}. Elegí otro artista.` },
      { status: 400 }
    );
  }

  // Validación server-side del slot (edge case 08.10: el turno puede haber caído)
  const { slots } = await getAvailability(artistId, serviceId, date);
  const slot = slots.find((s) => s.time === time);
  if (!slot || !slot.available) {
    const alternatives = await nearestAlternatives(artistId, serviceId, date, time);
    return NextResponse.json(
      {
        error: "cut",
        message: `Ese turno se acaba de cortar. Alguien lo tomó primero.`,
        alternatives,
      },
      { status: 409 }
    );
  }

  // ID correlativo BRD-XXXX (arranca en 247 como el pase del brief).
  // Robusto ante borrados/resets: toma el máximo sufijo numérico existente, no el count.
  const existingIds = await db.booking.findMany({ select: { id: true } });
  const maxSuffix = existingIds.reduce((max, { id }) => {
    const n = /^BRD-(\d+)$/.exec(id)?.[1];
    return n ? Math.max(max, Number(n)) : max;
  }, 246);
  const next = maxSuffix + 1;

  // capturas no-nulas (el narrowing no cruza el hoisted fn declaration)
  const svc = service;
  const art = artist;

  const createBooking = async (id: string) =>
    db.booking.create({
      data: {
        id,
        serviceId,
        artistId,
        date,
        time,
        minutes: svc.minutes,
        price: svc.price,
        name: customer.name,
        phone: customer.phone,
        email: customer.email || null,
        notes: customer.notes || null,
        status: "confirmed",
      },
    });

  let booking: Awaited<ReturnType<typeof createBooking>> | null = null;
  for (let attempt = next; attempt < next + 25; attempt++) {
    const candidate = `BRD-${String(attempt).padStart(4, "0")}`;
    try {
      booking = await createBooking(candidate);
      break;
    } catch (err) {
      // P2002 = unique constraint (colisión de ID) → probamos el siguiente sufijo
      const code = (err as { code?: string })?.code;
      if (code !== "P2002") throw err;
    }
  }
  if (!booking) {
    return NextResponse.json(
      { error: "No pudimos generar tu código de sesión. Probá otra vez." },
      { status: 500 }
    );
  }

  // Guard TOCTOU: entre el chequeo de disponibilidad y este create puede colarse
  // otra reserva concurrente para el mismo artista. Si pasó, deshacemos la nuestra
  // (nadie la vio) y respondemos como el edge case 08.10: 409 + alternativas.
  const toMin = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
  const start = toMin(time);
  const sameDayActive = await db.booking.findMany({
    where: {
      artistId: art.id,
      date,
      status: { in: ["confirmed", "pending"] },
      id: { not: booking.id },
    },
    select: { time: true, minutes: true },
  });
  const overlapped = sameDayActive.some((b) => {
    const bs = toMin(b.time);
    return bs < start + svc.minutes && bs + b.minutes > start;
  });
  if (overlapped) {
    await db.booking.delete({ where: { id: booking.id } });
    const alternatives = await nearestAlternatives(artistId, serviceId, date, time);
    return NextResponse.json(
      {
        error: "cut",
        message: `Ese turno se acaba de cortar. Alguien lo tomó primero.`,
        alternatives,
      },
      { status: 409 }
    );
  }

  return NextResponse.json({ session: toSession(booking), shop: SHOP }, { status: 201 });
}
