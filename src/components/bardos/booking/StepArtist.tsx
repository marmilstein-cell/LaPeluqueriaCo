"use client";
// BARDOS — Session Builder, paso 02: BARBERO ("¿QUIÉN TE CORTA?")
// Hoy hay un solo barbero: cuando eligible.length === 1 se renderiza como
// feature card a ancho completo (editorial), no como grilla rota.
import { motion } from "framer-motion";
import type { Artist } from "@/lib/bardos/domain";
import { BImage } from "../BImage";
import { useBooking, haptic } from "@/store/booking";
import { StepShell } from "./StepShell";

export function StepArtist({ artists }: { artists: Artist[] }) {
  const { serviceId, artistId, setArtist, next, reschedulingId } = useBooking();
  const eligible = serviceId
    ? artists.filter((a) => a.availableServiceIds.includes(serviceId))
    : artists;

  const choose = (id: string) => {
    if (reschedulingId) return;
    haptic(12);
    setArtist(id);
    setTimeout(() => next(), 420);
  };

  return (
    <StepShell
      n="02"
      title="BARBERO"
      question="¿QUIÉN TE CORTA?"
      hint={
        serviceId
          ? "Un solo barbero en la casa. Sentate con Tomás."
          : "Primero elegí un servicio."
      }
    >
      {eligible.length === 1 ? (
        <SoloArtist
          artist={eligible[0]}
          selected={artistId === eligible[0].id}
          onChoose={() => choose(eligible[0].id)}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5">
          {eligible.map((a) => {
            const selected = artistId === a.id;
            return (
              <motion.button
                key={a.id}
                onClick={() => choose(a.id)}
                onPointerEnter={(e) => {
                  // micro-feedback: la foto reacciona (2–4px)
                  const img = (e.currentTarget as HTMLElement).querySelector("img");
                  if (img) img.style.transform = "scale(1.045) translateY(-3px)";
                }}
                onPointerLeave={(e) => {
                  const img = (e.currentTarget as HTMLElement).querySelector("img");
                  if (img) img.style.transform = "";
                }}
                whileTap={{ scale: 0.985 }}
                aria-pressed={selected}
                aria-label={`${a.name} — ${a.specialty}`}
                className={`group relative overflow-hidden border text-left transition-colors duration-300 ${
                  selected ? "border-red" : "border-line hover:border-bone/40"
                }`}
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <BImage
                    src={a.photoRef}
                    alt={`${a.name}, ${a.specialty}`}
                    fill
                    sizes="(max-width: 768px) 45vw, 22vw"
                    imgClassName="object-cover transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/25 transition-opacity duration-500 group-hover:opacity-0" />
                  {selected && (
                    <motion.span
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="type-micro absolute bottom-3 left-3 text-red"
                    >
                      ELEGIDO
                    </motion.span>
                  )}
                  {!selected && (
                    <span className="type-micro absolute bottom-3 left-3 text-bone opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      ELEGIR
                    </span>
                  )}
                </div>
                <div className="p-3 md:p-4">
                  <p
                    className={`font-display text-[clamp(18px,1.8vw,26px)] transition-colors ${
                      selected ? "text-offwhite" : "text-chalk/80"
                    }`}
                  >
                    {a.name}
                  </p>
                  <p className="type-micro mt-1 text-smoke">{a.specialty}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </StepShell>
  );
}

/** Feature card del barbero único: retrato panorámico + tipografía grande.
 *  Mantiene la interacción de la grilla (click elige, ELEGIDO, micro-feedback). */
function SoloArtist({
  artist,
  selected,
  onChoose,
}: {
  artist: Artist;
  selected: boolean;
  onChoose: () => void;
}) {
  return (
    <motion.button
      onClick={onChoose}
      onPointerEnter={(e) => {
        const img = (e.currentTarget as HTMLElement).querySelector("img");
        if (img) img.style.transform = "scale(1.045) translateY(-3px)";
      }}
      onPointerLeave={(e) => {
        const img = (e.currentTarget as HTMLElement).querySelector("img");
        if (img) img.style.transform = "";
      }}
      whileTap={{ scale: 0.985 }}
      aria-pressed={selected}
      aria-label={`${artist.name} — ${artist.specialty}`}
      className={`group relative block w-full overflow-hidden border text-left transition-colors duration-300 ${
        selected ? "border-red" : "border-line hover:border-bone/40"
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden md:aspect-[16/8]">
        <BImage
          src={artist.photoRef}
          alt={`${artist.name}, ${artist.specialty}`}
          fill
          sizes="(max-width: 768px) 100vw, 42vw"
          imgClassName="object-cover transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black/25 transition-opacity duration-500 group-hover:opacity-0" />
        {/* tag de claqueta sobre el retrato */}
        {artist.tag && (
          <span className="type-micro absolute right-4 top-4 text-bone">
            {artist.tag}
          </span>
        )}
        {selected && (
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="type-micro absolute bottom-4 left-4 text-red"
          >
            ELEGIDO
          </motion.span>
        )}
        {!selected && (
          <span className="type-micro absolute bottom-4 left-4 text-bone opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            ELEGIR
          </span>
        )}
      </div>
      <div className="p-5 md:p-6">
        <p
          className={`font-display font-display-tight text-[clamp(30px,4vw,54px)] leading-[0.95] transition-colors duration-300 ${
            selected ? "text-offwhite" : "text-chalk/85 group-hover:text-offwhite"
          }`}
        >
          {artist.name}
        </p>
        <p className="type-micro mt-2 text-smoke">{artist.specialty}</p>
      </div>
    </motion.button>
  );
}
