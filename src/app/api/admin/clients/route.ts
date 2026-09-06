// LaPeluqueriaCo — LA CABINA: búsqueda de clientes por teléfono o nombre.
// GET ?q=… → historial de sesiones (agrupado por cliente, últimas 6 sesiones c/u)
// El barbero contesta el teléfono y en dos teclas sabe quién es y qué tiene.
// Acceso: header x-cabina-code (compartido con agenda).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function checkCabinaCode(req: NextRequest): boolean {
  const expected = process.env.CABINA_CODE ?? "MMXIX";
  const got = req.headers.get("x-cabina-code") ?? "";
  return got.trim().toUpperCase() === expected.toUpperCase();
}

export async function GET(req: NextRequest) {
  if (!checkCabinaCode(req)) {
    return NextResponse.json({ error: "Código incorrecto." }, { status: 401 });
  }

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ clients: [], hint: "Mínimo 2 caracteres." });
  }

  // normalizar: dígitos para teléfono, texto para nombre (sin acentos:
  // "martin" tiene que encontrar a "Martín")
  const deaccent = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const digits = q.replace(/\D/g, "");
  const needle = deaccent(q.toLowerCase());

  // traer el historial completo y filtrar en memoria
  // (SQLite LIKE no distingue mayúsculas con acentos de forma confiable)
  const bookings = await db.booking.findMany({
    include: { service: { select: { name: true } }, artist: { select: { name: true } } },
    orderBy: [{ date: "desc" }, { time: "desc" }],
    take: 500,
  });

  const matches = bookings.filter((b) => {
    const nameHit = deaccent(b.name.toLowerCase()).includes(needle);
    const phoneHit = digits.length >= 4 && b.phone.replace(/\D/g, "").includes(digits);
    return nameHit || phoneHit;
  });

  // agrupar por cliente (clave: teléfono sin formato, fallback nombre)
  const byClient = new Map<
    string,
    { name: string; phone: string; sessions: typeof matches }
  >();
  for (const b of matches.slice(0, 200)) {
    const key = b.phone.replace(/\D/g, "") || b.name.toLowerCase();
    const entry = byClient.get(key);
    if (entry) {
      entry.sessions.push(b);
    } else {
      byClient.set(key, { name: b.name, phone: b.phone, sessions: [b] });
    }
  }

  const clients = [...byClient.values()].slice(0, 6).map((c) => {
    const active = c.sessions.find(
      (s) => s.status === "pending" || s.status === "confirmed"
    );
    const cancelled = c.sessions.filter((s) => s.status === "cancelled").length;
    const spent = c.sessions
      .filter((s) => s.status !== "cancelled")
      .reduce((sum, s) => sum + s.price, 0);
    return {
      name: c.name,
      phone: c.phone,
      totalSessions: c.sessions.length,
      cancelled,
      spent,
      nextSession: active
        ? {
            id: active.id,
            date: active.date,
            time: active.time,
            artist: active.artist.name,
            service: active.service.name,
          }
        : null,
      history: c.sessions.slice(0, 6).map((s) => ({
        id: s.id,
        date: s.date,
        time: s.time,
        status: s.status,
        artist: s.artist.name,
        service: s.service.name,
        price: s.price,
      })),
    };
  });

  return NextResponse.json({ clients });
}
