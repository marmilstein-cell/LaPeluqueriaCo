// BARDOS — EL CLUB: signup público de la lista de los viernes.
// POST { name, contact } → alta en la lista (dedupe por contacto).
// El contacto acepta email o teléfono: al club se entra por cualquiera de las dos puertas.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const ClubSchema = z.object({
  name: z.string().trim().min(2, "Decinos cómo te llamás.").max(60),
  contact: z.string().trim().min(5, "Dejanos un mail o un teléfono.").max(120),
});

// antiflood mínimo en memoria: 6 altas por minuto por contacto
const attempts = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 6;

function tooFast(key: string): boolean {
  const now = Date.now();
  const hits = (attempts.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  attempts.set(key, hits);
  if (attempts.size > 500) {
    // limpieza ocasional del mapa (no deja crecer la memoria)
    for (const [k, v] of attempts) {
      if (v.every((t) => now - t > WINDOW_MS)) attempts.delete(k);
    }
  }
  return hits.length > MAX_ATTEMPTS;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const parsed = ClubSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos incompletos." },
      { status: 400 }
    );
  }
  const { name, contact } = parsed.data;

  // el contacto es email o teléfono — si no parece ninguno, se dice
  // (el teléfono se escribe como se escribe: con espacios, guiones, +54…)
  const digits = contact.replace(/\D/g, "");
  const isEmail = EMAIL_RE.test(contact);
  const isPhone = digits.length >= 8 && digits.length <= 15;
  if (!isEmail && !isPhone) {
    return NextResponse.json(
      { error: "El contacto no parece un mail ni un teléfono." },
      { status: 400 }
    );
  }

  if (tooFast(contact.toLowerCase())) {
    return NextResponse.json({ error: "Demasiados intentos. Esperá un minuto." }, { status: 429 });
  }

  // dedupe por contacto (normalizado): si ya estaba, todo bien — ya está en la lista
  const normalized = isEmail ? contact.toLowerCase() : digits;
  const existing = await db.clubSignup.findFirst({ where: { contact: normalized } });
  if (existing) {
    return NextResponse.json({ ok: true, already: true, name: existing.name });
  }

  const signup = await db.clubSignup.create({
    data: { name, contact: normalized },
  });

  return NextResponse.json({ ok: true, already: false, id: signup.id }, { status: 201 });
}
