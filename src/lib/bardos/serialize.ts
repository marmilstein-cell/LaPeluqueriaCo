// LaPeluqueriaCo — utilidades de serialización Prisma → contrato UI (Apéndice C)
import { Artist, Service, Session, slotId } from "./domain";

type PrismaService = {
  id: string; name: string; nameEs: string; desc: string;
  minutes: number; price: number; photo: string;
};
type PrismaArtist = {
  id: string; name: string; tag: string | null; specialty: string;
  bio: string; photo: string;
  services: { serviceId: string }[];
};
type PrismaBooking = {
  id: string; serviceId: string; artistId: string; date: string; time: string;
  minutes: number; price: number; name: string; phone: string; email: string | null;
  notes: string | null; status: string; createdAt: Date;
};

export function toService(s: PrismaService): Service {
  return {
    id: s.id,
    name: s.name,
    nameEs: s.nameEs,
    desc: s.desc,
    durationMinutes: s.minutes,
    price: s.price,
    imageRef: s.photo,
  };
}

export function toArtist(a: PrismaArtist): Artist {
  return {
    id: a.id,
    name: a.name,
    tag: a.tag,
    specialty: a.specialty,
    bio: a.bio,
    photoRef: a.photo,
    availableServiceIds: a.services.map((s) => s.serviceId),
  };
}

export function toSession(b: PrismaBooking): Session {
  return {
    id: b.id,
    serviceId: b.serviceId,
    artistId: b.artistId,
    slotId: slotId(b.artistId, b.date, b.time),
    date: b.date,
    time: b.time,
    minutes: b.minutes,
    price: b.price,
    customer: { name: b.name, phone: b.phone, email: b.email ?? undefined, notes: b.notes ?? undefined },
    status: b.status as Session["status"],
    createdAt: b.createdAt.toISOString(),
  };
}
