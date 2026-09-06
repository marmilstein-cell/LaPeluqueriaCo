// BARDOS — LA CABINA (backoffice de barberos)
// Agenda del día: reservas activas + bloqueos por artista, con stats.
// Acceso: header x-cabina-code (CABINA_CODE env, default "MMXIX").
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SHOP, bookableDates, toISODate } from "@/lib/bardos/domain";

export function checkCabinaCode(req: NextRequest): boolean {
  const expected = process.env.CABINA_CODE ?? "MMXIX";
  const got = req.headers.get("x-cabina-code") ?? "";
  return got.trim().toUpperCase() === expected.toUpperCase();
}

export async function GET(req: NextRequest) {
  if (!checkCabinaCode(req)) {
    return NextResponse.json({ error: "Código incorrecto." }, { status: 401 });
  }

  const date = req.nextUrl.searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Fecha inválida." }, { status: 400 });
  }

  // lunes de la semana que contiene `date` → semana = [lun, dom]
  const [wy, wm, wd] = date.split("-").map(Number);
  const day = new Date(wy, wm - 1, wd);
  const monday = new Date(day);
  monday.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const prevMonday = new Date(monday);
  prevMonday.setDate(monday.getDate() - 7);
  const prevSunday = new Date(prevMonday);
  prevSunday.setDate(prevMonday.getDate() + 6);
  const weekMondayISO = toISODate(monday);
  const weekSundayISO = toISODate(sunday);
  const weekPrevMondayISO = toISODate(prevMonday);
  const weekPrevSundayISO = toISODate(prevSunday);

  const artists = await db.artist.findMany({
    where: { active: true },
    orderBy: { rank: "asc" },
    select: {
      id: true,
      name: true,
      tag: true,
      specialty: true,
      photo: true,
      services: { select: { serviceId: true } },
    },
  });

  const [bookings, blocks, weekBookings] = await Promise.all([
    db.booking.findMany({
      // completed también se muestra: el día real tiene historia
      where: { date, status: { in: ["pending", "confirmed", "completed"] } },
      include: { service: { select: { name: true } } },
      orderBy: { time: "asc" },
    }),
    db.blockedSlot.findMany({ where: { date }, orderBy: { time: "asc" } }),
    // ventana de dos semanas para la comparativa LA SEMANA (abajo)
    db.booking.findMany({
      where: { date: { gte: weekPrevMondayISO, lte: weekSundayISO } },
      select: { date: true, status: true, price: true },
    }),
  ]);

  // LA SEMANA — comparativa de la semana (lun→dom) que contiene `date`
  // contra la anterior. La atención es mar→sáb, pero la semana se corta
  // de lunes a domingo: el lunes y el domingo no suman, ordenan.
  const weekTotalsFor = (lo: string, hi: string) => {
    const inRange = (b: (typeof weekBookings)[number]) => b.date >= lo && b.date <= hi;
    // sesiones/caja: lo activo de la semana (confirmada o ya cortada)
    const active = weekBookings.filter(
      (b) => inRange(b) && (b.status === "confirmed" || b.status === "completed")
    );
    return {
      sessions: active.length,
      revenue: active.reduce((sum, b) => sum + b.price, 0),
      completed: weekBookings.filter((b) => inRange(b) && b.status === "completed").length,
      cancelled: weekBookings.filter((b) => inRange(b) && b.status === "cancelled").length,
    };
  };
  const week = {
    current: weekTotalsFor(weekMondayISO, weekSundayISO),
    previous: weekTotalsFor(weekPrevMondayISO, weekPrevSundayISO),
  };

  const byArtist = new Map<string, { bookings: typeof bookings; blocks: typeof blocks }>();
  for (const a of artists) byArtist.set(a.id, { bookings: [], blocks: [] });
  for (const b of bookings) byArtist.get(b.artistId)?.bookings.push(b);
  for (const bl of blocks) byArtist.get(bl.artistId)?.blocks.push(bl);

  // ventana de días para el picker (solo atendidos)
  const dates = bookableDates();

  return NextResponse.json({
    date,
    dates,
    week,
    artists: artists.map((a) => ({
      id: a.id,
      name: a.name,
      tag: a.tag,
      specialty: a.specialty,
      photo: a.photo,
      services: a.services.map((s) => s.serviceId),
      bookings: (byArtist.get(a.id)?.bookings ?? []).map((b) => ({
        id: b.id,
        time: b.time,
        minutes: b.minutes,
        price: b.price,
        name: b.name,
        phone: b.phone,
        notes: b.notes,
        serviceId: b.serviceId,
        serviceName: b.service.name,
        status: b.status,
      })),
      blocks: (byArtist.get(a.id)?.blocks ?? []).map((bl) => ({
        id: bl.id,
        time: bl.time,
        minutes: bl.minutes,
        reason: bl.reason,
      })),
    })),
    stats: {
      totalBookings: bookings.length,
      completed: bookings.filter((b) => b.status === "completed").length,
      revenue: bookings.reduce((sum, b) => sum + b.price, 0),
      revenueDone: bookings
        .filter((b) => b.status === "completed")
        .reduce((sum, b) => sum + b.price, 0),
      bookedMinutes: bookings.reduce((sum, b) => sum + b.minutes, 0),
      capacityMinutes: artists.length * (SHOP.closeHour - SHOP.openHour) * 60,
      totalBlocks: blocks.length,
      totalBlockMinutes: blocks.reduce((sum, bl) => sum + (bl.minutes || SHOP.slotStep), 0),
    },
  });
}
