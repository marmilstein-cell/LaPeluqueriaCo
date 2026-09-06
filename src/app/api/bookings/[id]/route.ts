import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toSession } from "@/lib/bardos/serialize";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const booking = await db.booking.findUnique({
    where: { id: id.toUpperCase() },
  });
  if (!booking) {
    return NextResponse.json(
      { error: "Ese pase de sesión no existe. Fijate el código." },
      { status: 404 }
    );
  }
  return NextResponse.json({ session: toSession(booking) });
}
