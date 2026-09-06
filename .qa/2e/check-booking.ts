import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const b = await db.booking.findFirst({ where: { phone: "+54929000001" } });
console.log(JSON.stringify({ id: b?.id, name: b?.name, phone: b?.phone, status: b?.status, service: b?.serviceId, date: b?.date, time: b?.time, code: b?.code }, null, 2));
console.log("total bookings:", await db.booking.count());
await db.$disconnect();
