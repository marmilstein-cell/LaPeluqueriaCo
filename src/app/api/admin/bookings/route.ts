// BARDOS — LA CABINA: ciclo de vida de la sesión.
// PATCH { id, status: "completed" | "confirmed" } → marca el corte hecho (o lo reabre).
// Solo transiciones válidas: confirmed → completed → confirmed (reabrir).
// El resto del ciclo (cancelar, reprogramar) vive en el pase del cliente.
// Acceso: header x-cabina-code (compartido con agenda).
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

function checkCabinaCode(req: NextRequest): boolean {
  const expected = process.env.CABINA_CODE ?? "MMXIX";
  const got = req.headers.get("x-cabina-code") ?? "";
  return got.trim().toUpperCase() === expected.toUpperCase();
}

const PatchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["completed", "confirmed"]),
});

export async function PATCH(req: NextRequest) {
  if (!checkCabinaCode(req)) {
    return NextResponse.json({ error: "Código incorrecto." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos incompletos." }, { status: 400 });
  }
  const { id, status } = parsed.data;

  const booking = await db.booking.findUnique({ where: { id } });
  if (!booking) {
    return NextResponse.json({ error: "Esa sesión no existe." }, { status: 404 });
  }

  // transiciones: confirmed → completed (el corte está hecho);
  // completed → confirmed (se reabre — se marcó por error);
  // cancelled/rescheduled no se tocan desde la cabina
  const valid =
    (status === "completed" && booking.status === "confirmed") ||
    (status === "confirmed" && booking.status === "completed");
  if (!valid) {
    return NextResponse.json(
      { error: "Solo se completa una sesión confirmada (o se reabre una completada)." },
      { status: 409 }
    );
  }

  const updated = await db.booking.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({
    session: { id: updated.id, status: updated.status },
  });
}
