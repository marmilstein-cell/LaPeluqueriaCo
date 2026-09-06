// BARDOS — seed del catálogo (servicios + EL barbero) + datos demo
// Se ejecuta con: bun scripts/seed.ts
// Idempotente: WIPea bookings/bloqueos/artistas/servicios viejos antes de upsert.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const SERVICES = [
  { id: "corte", name: "CORTE", nameEs: "Corte a medida — tijera y máquina", desc: "El clásico. Consulta, corte, perfilado y finalizado. Sin apuro, sin ruido.", minutes: 45, price: 16000, photo: "/images/service-cut.webp", order: 1 },
  { id: "corte-barba", name: "CORTE + BARBA", nameEs: "Corte + barba esculpida con navaja", desc: "Corte a medida más barba trabajada a navaja y toalla caliente. La sesión completa.", minutes: 65, price: 23000, photo: "/images/service-beard.webp", order: 2 },
  { id: "color", name: "COLOR", nameEs: "Camuflaje de canas y color", desc: "Disimulado, natural, sin dramatismo. Color masculino hecho con criterio.", minutes: 90, price: 28000, photo: "/images/service-color.webp", order: 3 },
  { id: "tratamiento", name: "TRATAMIENTO", nameEs: "Tratamiento de cuero cabelludo", desc: "Diagnóstico, exfoliación y tónico. La base de todo buen corte.", minutes: 30, price: 12000, photo: "/images/service-treatment.webp", order: 4 },
  { id: "ritual", name: "EL RITUAL", nameEs: "La sesión completa Bardos — corte, barba y tratamiento", desc: "Noventa minutos. Todo el oficio en una sola sesión. Toalla caliente, navaja, silencio.", minutes: 90, price: 34000, photo: "/images/service-ritual.webp", order: 5 },
];

const ARTISTS = [
  { id: "santi", name: "TOMÁS BUCHETT", tag: "EL BARBERO", specialty: "CORTE · BARBA · NAVAJA", bio: "Santi Moro corta como quien edita: primero escucha, después quita. Tijera, máquina y navaja con la seriedad de quien firma cada cabeza que sale de su silla.", photo: "/images/artist-santi.webp", rank: 1, services: ["corte", "corte-barba", "color", "tratamiento", "ritual"] },
];

// ---------- Datos demo (agenda viva para la cabina y el sitio) ----------
const DEMO_BOOKINGS: {
  id: string;
  serviceId: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  notes?: string;
  status?: string;
}[] = [
  { id: "BRD-0001", serviceId: "corte-barba", date: "2026-09-08", time: "10:30", name: "Martín Álvarez", phone: "+5491144320011", notes: "Corte clásico, prolijo." },
  { id: "BRD-0002", serviceId: "corte", date: "2026-09-08", time: "12:00", name: "Diego Ferreyra", phone: "+5491144550012" },
  { id: "BRD-0003", serviceId: "ritual", date: "2026-09-09", time: "11:00", name: "Ezequiel Molina", phone: "+5491122330014", notes: "Primera vez, recomendado por Joaco." },
  { id: "BRD-0004", serviceId: "corte", date: "2026-09-09", time: "16:30", name: "Bruno Salcedo", phone: "+5491166770018" },
  { id: "BRD-0005", serviceId: "tratamiento", date: "2026-09-10", time: "10:00", name: "Franco Giordano", phone: "+5491177880021" },
  { id: "BRD-0006", serviceId: "corte-barba", date: "2026-09-10", time: "15:00", name: "Marcelo Díaz", phone: "+5491188990025", notes: "Barba corta, prolija." },
  { id: "BRD-0007", serviceId: "corte", date: "2026-09-11", time: "11:30", name: "Iván Ocampo", phone: "+5491199000027" },
  { id: "BRD-0008", serviceId: "corte", date: "2026-09-12", time: "10:30", name: "Leandro Ríos", phone: "+5491111000029" },
  { id: "BRD-0009", serviceId: "ritual", date: "2026-09-12", time: "17:00", name: "Nahuel Quiroga", phone: "+5491112000031", notes: "Sábado, sin apuro." },
  { id: "BRD-0010", serviceId: "corte", date: "2026-09-05", time: "11:00", name: "Julián Vera", phone: "+5491113000033", status: "completed" },
];

const DEMO_BLOCKS = [
  { artistId: "santi", date: "2026-09-10", time: "13:30", minutes: 60, reason: "ALMUERZO" },
  { artistId: "santi", date: "2026-09-11", time: "11:00", minutes: 30, reason: "PROVEEDOR" },
];

async function main() {
  // 1) WIPE: catálogo viejo (ids en inglés) + reservas/bloqueos de demo anteriores
  await db.booking.deleteMany({});
  await db.blockedSlot.deleteMany({});
  await db.artistService.deleteMany({});
  await db.artist.deleteMany({});
  await db.service.deleteMany({ where: { id: { notIn: SERVICES.map((s) => s.id) } } });

  // 2) Catálogo nuevo: servicios en español + EL barbero
  for (const s of SERVICES) {
    await db.service.upsert({ where: { id: s.id }, update: s, create: s });
  }
  for (const a of ARTISTS) {
    const { services, ...artist } = a;
    await db.artist.upsert({ where: { id: a.id }, update: artist, create: artist });
    for (const sid of services) {
      await db.artistService.upsert({
        where: { artistId_serviceId: { artistId: a.id, serviceId: sid } },
        update: {},
        create: { artistId: a.id, serviceId: sid },
      });
    }
  }

  // 3) Datos demo: la agenda de Santi (8 al 12 de sep 2026) + 2 bloqueos
  const svcById = new Map(SERVICES.map((s) => [s.id, s]));
  for (const b of DEMO_BOOKINGS) {
    const svc = svcById.get(b.serviceId);
    if (!svc) throw new Error(`Servicio desconocido: ${b.serviceId}`);
    await db.booking.create({
      data: {
        id: b.id,
        serviceId: b.serviceId,
        artistId: "santi",
        date: b.date,
        time: b.time,
        minutes: svc.minutes,
        price: svc.price,
        name: b.name,
        phone: b.phone,
        notes: b.notes ?? null,
        status: b.status ?? "confirmed",
      },
    });
  }
  for (const bl of DEMO_BLOCKS) {
    await db.blockedSlot.create({ data: bl });
  }

  const counts = {
    services: await db.service.count(),
    artists: await db.artist.count(),
    links: await db.artistService.count(),
    bookings: await db.booking.count(),
    blocks: await db.blockedSlot.count(),
  };
  console.log("BARDOS seed OK →", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
