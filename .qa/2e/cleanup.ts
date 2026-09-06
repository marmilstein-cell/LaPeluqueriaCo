import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const deleted = await db.booking.deleteMany({ where: { phone: "+54929000001" } });
console.log("deleted:", deleted.count);
console.log("total bookings:", await db.booking.count());
const remaining = await db.booking.findMany({ select: { id: true, status: true }, orderBy: { id: "asc" } });
console.log("remaining:", remaining.map(b => `${b.id}:${b.status}`).join(" "));
await db.$disconnect();
