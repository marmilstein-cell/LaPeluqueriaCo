import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toSession } from "@/lib/bardos/serialize";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const booking = await db.booking.findUnique({ where: { id: id.toUpperCase() } });
  if (!booking) {
    return NextResponse.json({ error: "Ese pase no existe." }, { status: 404 });
  }
  if (booking.status === "cancelled") {
    return NextResponse.json({ session: toSession(booking) }); // idempotente
  }
  if (booking.status === "completed") {
    return NextResponse.json(
      { error: "Esa sesión ya se cortó. No tiene sentido cancelarla." },
      { status: 409 }
    );
  }
  const updated = await db.booking.update({
    where: { id: booking.id },
    data: { status: "cancelled" },
  });
  return NextResponse.json({ session: toSession(updated) });
}
