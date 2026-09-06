// BARDOS — LA CABINA: LA LISTA del club (altas públicas del Archive).
// GET → quiénes se anotaron para la lista de los viernes.
// El barbero la mira antes del viernes y la copia para avisar.
// Acceso: header x-cabina-code (compartido con agenda y clientes).
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

  // la lista se acumula: la más reciente primero (el más nuevo interesado arriba)
  const signups = await db.clubSignup.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, contact: true, createdAt: true },
  });

  return NextResponse.json({
    list: signups.map((s) => ({
      id: s.id,
      name: s.name,
      contact: s.contact,
      createdAt: s.createdAt.toISOString(),
    })),
    total: signups.length,
  });
}
