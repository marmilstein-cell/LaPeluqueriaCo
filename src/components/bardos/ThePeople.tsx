"use client";
// BARDOS — THE PEOPLE (Acto II — medium shot)
// Retrato editorial del barbero. Treatment: PEOPLE, mirada directa.
// Al elegir al barbero se cruza al Session Builder (el rojo aparece con la decisión).
import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { BImage } from "./BImage";
import { Slate, Reveal, CutDivider } from "./scene-utils";
import { useCatalog } from "./useCatalog";
import { scrollToScene } from "./providers";
import { useBooking, haptic } from "@/store/booking";

export function ThePeople() {
  const { data } = useCatalog();
  const artists = data?.artists ?? [];

  return (
    <section
      id="artists"
      aria-label="El Barbero — Tomás Buchett"
      className="relative bg-black"
      style={{ padding: "var(--spacing-b8) var(--grid-margin)" }}
    >
      <Slate>ACTO II — EL BARBERO</Slate>

      <Reveal as="h2" className="font-display font-display-tight type-display-sm mt-8 text-offwhite">
        EL BARBERO<span className="text-red">.</span>
      </Reveal>
      <Reveal delay={0.12}>
        <p className="font-editorial-italic mt-4 max-w-2xl text-[clamp(18px,2vw,26px)] text-chalk/90">
          Una silla, un barbero, un solo criterio. Tomás Buchett lleva el
          oficio con la seriedad de quien firma su trabajo.
        </p>
      </Reveal>

      <CutDivider className="mt-14" />

      {/* Retratos editoriales — filas, no cards */}
      <div>
        {artists.map((a, i) => (
          <ArtistRow key={a.id} artist={a} index={i} />
        ))}
      </div>

      {/* Clientes — el club */}
      <div className="mt-24 md:mt-32">
        <Slate>EL CLUB — CLIENTES</Slate>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:gap-10">
          <ClientCard
            src="/images/client-older.webp"
            alt="Raúl, cliente de Bardos desde 2019, con corte clásico"
            name="RAÚL, 63"
            since="CLIENTE DESDE 2019"
            quote="Vengo cada tres semanas hace seis años. Nunca me tuvieron que retocar dos veces el mismo lado."
          />
          <ClientCard
            src="/images/client-curly.webp"
            alt="Joaco, cliente de Bardos, con rizos voluminosos y barba perfilada"
            name="JOACO, 24"
            since="CLIENTE DESDE 2024"
            quote="La primera vez traje una foto de los Red Hot. Tomás me dijo que no. Tenía razón."
          />
        </div>
      </div>
    </section>
  );
}

function ArtistRow({
  artist,
  index,
}: {
  artist: {
    id: string;
    name: string;
    tag: string | null;
    specialty: string;
    bio: string;
    photoRef: string;
  };
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const setArtist = useBooking((s) => s.setArtist);
  const setService = useBooking((s) => s.setService);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], [26, -26]);

  const choose = () => {
    haptic(14);
    // pre-seleccionamos artista para el builder (el servicio se elige en el paso 01)
    useBooking.getState().reset({ keepCustomer: true });
    setArtist(artist.id);
    scrollToScene("book");
  };

  return (
    <div
      ref={ref}
      className="group relative border-b border-line py-12 first:pt-4 md:py-16"
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <p
        className={`scene-no absolute right-0 top-12 hidden transition-colors duration-300 md:block ${
          hover ? "text-red" : ""
        }`}
      >
        {String(index + 1).padStart(2, "0")} / {artist.name}
      </p>

      <div className="grid items-center gap-8 md:grid-cols-12 md:gap-12">
        {/* Retrato */}
        <motion.button
          onClick={choose}
          className="group/img relative block aspect-[3/4] w-full overflow-hidden md:col-span-4 lg:col-span-3"
          style={{ padding: 0, border: 0, background: "transparent" }}
          aria-label={`Reservar con ${artist.name}`}
        >
          <motion.div className="absolute inset-0" style={{ y: imgY, scale: 1.06 }}>
            <BImage
              src={artist.photoRef}
              alt={`${artist.name} — ${artist.specialty} — barbero de Bardos`}
              fill
              sizes="(max-width: 768px) 100vw, 30vw"
              imgClassName="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/img:scale-[1.045]"
            />
          </motion.div>
          <div className="absolute inset-0 bg-black/25 transition-opacity duration-500 group-hover/img:opacity-0" />
          {/* hairline de corte: aparece en el borde inferior al hover */}
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-red transition-transform duration-500 ease-[cubic-bezier(0.85,0,0.15,1)] group-hover/img:scale-x-100"
          />
          <span
            className={`type-micro absolute bottom-4 left-4 z-10 transition-colors duration-300 ${
              hover ? "text-red" : "text-bone"
            }`}
          >
            {hover ? "RESERVAR CON " + artist.name : "RETRATO / " + (artist.tag ?? "")}
          </span>
        </motion.button>

        {/* Datos */}
        <div className="md:col-span-8 lg:col-span-9">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <Reveal as="h3" className="font-display font-display-tight text-[clamp(40px,7vw,110px)] text-offwhite">
              {artist.name}
            </Reveal>
            {artist.tag && (
              <span className="type-mono-label text-red">{artist.tag}</span>
            )}
          </div>
          <Reveal delay={0.1}>
            <p className="type-mono-label mt-3 text-bone">{artist.specialty}</p>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="font-editorial-italic mt-6 max-w-2xl text-[clamp(16px,1.5vw,22px)] leading-[1.5] text-chalk/85">
              {artist.bio}
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <button onClick={choose} className="b-link mt-8 inline-block">
              RESERVAR CON {artist.name} <span className="text-red" aria-hidden="true">→</span>
            </button>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

function ClientCard({
  src,
  alt,
  name,
  since,
  quote,
}: {
  src: string;
  alt: string;
  name: string;
  since: string;
  quote: string;
}) {
  return (
    <motion.figure
      className="relative"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <BImage src={src} alt={alt} fill sizes="(max-width: 640px) 100vw, 40vw" imgClassName="object-cover" />
      </div>
      <figcaption className="mt-4">
        <p className="type-mono-label text-offwhite">{name}</p>
        <p className="type-micro mt-1 text-smoke">{since}</p>
        <p className="font-editorial-italic mt-3 text-[17px] leading-[1.45] text-chalk/85">“{quote}”</p>
      </figcaption>
    </motion.figure>
  );
}
