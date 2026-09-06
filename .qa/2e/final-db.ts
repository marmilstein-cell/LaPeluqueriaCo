import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
console.log(JSON.stringify({
  artists: await db.artist.count(),
  services: await db.service.count(),
  bookings: await db.booking.count(),
  blockedSlots: await db.blockedSlot.count(),
  clubSignups: await db.clubSignup.count(),
}));
await db.$disconnect();
