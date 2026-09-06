import { NextRequest, NextResponse } from "next/server";
import { getAvailability } from "@/lib/bardos/availability";
import { bookableDates } from "@/lib/bardos/domain";

export async function GET(req: NextRequest) {
  const artistId = req.nextUrl.searchParams.get("artistId");
  const serviceId = req.nextUrl.searchParams.get("serviceId");
  const date = req.nextUrl.searchParams.get("date");

  if (!artistId || !serviceId || !date) {
    return NextResponse.json(
      { error: "Faltan datos: artistId, serviceId y date son requeridos." },
      { status: 400 }
    );
  }

  const dates = bookableDates();
  if (!dates.includes(date)) {
    return NextResponse.json({ slots: [], dates, reason: "out-of-window" });
  }

  const { slots, reason } = await getAvailability(artistId, serviceId, date);
  return NextResponse.json({ slots, dates, reason });
}
