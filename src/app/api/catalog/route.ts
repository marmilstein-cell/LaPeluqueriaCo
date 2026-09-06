import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toService, toArtist } from "@/lib/bardos/serialize";

export async function GET() {
  const [services, artists] = await Promise.all([
    db.service.findMany({
      orderBy: { order: "asc" },
    }),
    db.artist.findMany({
      where: { active: true },
      orderBy: { rank: "asc" },
      include: { services: { select: { serviceId: true } } },
    }),
  ]);
  return NextResponse.json({
    services: services.map(toService),
    artists: artists.map(toArtist),
  });
}
