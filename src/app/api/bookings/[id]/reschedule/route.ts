import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAvailability, nearestAlternatives } from "@/lib/bardos/availability";
import { toSession } from "@/lib/bardos/serialize";

const BodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const booking = await db.booking.findUnique({ where: { id: id.toUpperCase() } });
  if (!booking) {
    return NextResponse.json({ error: "Ese pase no existe." }, { status: 404 });
  }
  if (booking.status === "cancelled") {
    return NextResponse.json(
      { error: "Esa sesión está cancelada. Reservá una nueva." },
      { status: 409 }
    );
  }
  if (booking.status === "completed") {
    return NextResponse.json(
      { error: "Esa sesión ya se cortó. Reservá una nueva si querés otro pase." },
      { status: 409 }
    );
  }

  let parsed: z.infer<typeof BodySchema> | null = null;
  try {
    parsed = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Fecha u horario inválidos." }, { status: 400 });
  }

  const { date, time } = parsed;

  // revalidar disponibilidad para la duración original
  const { slots } = await getAvailability(booking.artistId, booking.serviceId, date);
  const slot = slots.find((s) => s.time === time);
  if (!slot || !slot.available) {
    const alternatives = await nearestAlternatives(
      booking.artistId,
      booking.serviceId,
      date,
      time
    );
    return NextResponse.json(
      { error: "cut", message: "Ese turno se acaba de cortar.", alternatives },
      { status: 409 }
    );
  }

  // cancelar el turno anterior (el original queda como "rescheduled") y crear el nuevo
  await db.booking.update({
    where: { id: booking.id },
    data: { status: "rescheduled" },
  });

  const count = await db.booking.count();
  const newId = `BRD-${String(247 + count).padStart(4, "0")}`;
  const updated = await db.booking.create({
    data: {
      id: newId,
      serviceId: booking.serviceId,
      artistId: booking.artistId,
      date,
      time,
      minutes: booking.minutes,
      price: booking.price,
      name: booking.name,
      phone: booking.phone,
      email: booking.email,
      notes: booking.notes,
      status: "confirmed",
      prevId: booking.id,
    },
  });

  return NextResponse.json({ session: toSession(updated), previousId: booking.id });
}
