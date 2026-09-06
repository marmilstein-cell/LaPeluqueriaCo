"use client";
// BARDOS — TUS PASES: el historial local del cliente (08.8, mínimo viable).
// Cada pase creado desde este navegador queda acá: código, día, estado vivo
// (consultado contra el server), click → se abre el pase.
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { fetchSession, ApiError } from "@/lib/bardos/client";
import { usePasses, openPass, forgetPass } from "@/lib/bardos/passes";
import { formatLongDate } from "@/lib/bardos/domain";
import { haptic } from "@/store/booking";

const STATUS_LABEL: Record<string, string> = {
  confirmed: "CONFIRMADO",
  cancelled: "CORTADO",
  rescheduled: "REPROGRAMADO",
  completed: "REALIZADO",
  pending: "PENDIENTE",
};

const STATUS_DOT: Record<string, string> = {
  confirmed: "bg-red",
  cancelled: "bg-smoke",
  rescheduled: "bg-bone",
  completed: "bg-offwhite",
  pending: "bg-smoke",
};

/** Una entrada del historial: consulta viva el estado del pase. */
function PassRow({ id }: { id: string }) {
  const { data, isError, error } = useQuery({
    queryKey: ["session", id],
    queryFn: () => fetchSession(id),
    staleTime: 30_000,
    retry: false,
  });

  const s = data?.session;
  // distinguir "no existe" (404) de un fallo de red: el mensaje es distinto
  const notFound = isError && error instanceof ApiError && error.status === 404;
  const offline = isError && !notFound;
  const status = isError ? (notFound ? "gone" : "offline") : s?.status ?? "loading";
  const label =
    status === "gone"
      ? "NO ENCONTRADO"
      : status === "offline"
      ? "SIN CONEXIÓN"
      : STATUS_LABEL[status] ?? "…";
  const dot =
    status === "gone"
      ? "bg-smoke/50"
      : status === "offline"
      ? "bg-bone/50"
      : STATUS_DOT[status] ?? "bg-smoke";

  return (
    <li className="group flex items-center gap-4 border-b border-line/60 py-3 last:border-b-0">
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot} ${
          status === "confirmed" ? "animate-pulse" : ""
        }`}
      />
      <button
        onClick={() => {
          haptic(12);
          openPass(id);
        }}
        className="font-system text-[13px] tracking-[0.12em] text-offwhite transition-colors duration-200 hover:text-red"
        aria-label={`Abrir pase ${id}`}
      >
        {id}
      </button>
      <span className="font-system truncate text-[11px] tracking-[0.06em] text-smoke">
        {s ? `${s.serviceId.toUpperCase().replace("-", " + ")} — ${formatLongDate(s.date)} ${s.time}` : "—"}
      </span>
      <span
        className={`type-micro ml-auto shrink-0 ${
          status === "confirmed"
            ? "text-red"
            : status === "gone" || status === "offline"
            ? "text-smoke/60"
            : "text-smoke"
        }`}
      >
        {label}
      </span>
      <button
        onClick={() => forgetPass(id)}
        className="type-micro shrink-0 text-smoke/70 transition-colors duration-200 hover:text-red focus-visible:text-red"
        aria-label={`Quitar ${id} del historial`}
        title="Quitar del historial"
      >
        ✕
      </button>
    </li>
  );
}

export function PassStrip() {
  const passes = usePasses();

  return (
    <AnimatePresence>
      {passes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="border border-line bg-coal/40"
        >
          <div className="flex items-center justify-between border-b border-line/60 px-5 py-2.5">
            <p className="type-micro text-smoke">
              TUS PASES — {passes.length} EN ESTE NAVEGADOR
            </p>
            <p className="type-micro text-smoke/70">ABRÍ CON UN CLICK</p>
          </div>
          <ul className="max-h-56 overflow-y-auto px-5">
            {passes.map((p) => (
              <PassRow key={p.id} id={p.id} />
            ))}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
