"use client";
// LaPeluqueriaCo — THE ARCHIVE (préstamo de The Archive: profundidad de marca)
// Tira infinita del archivo fotográfico + DE LA SILLA (columna editorial:
// la historia del local, el método, el club) + Instagram integrado narrativamente.
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BImage } from "./BImage";
import { Slate, Reveal, CutDivider } from "./scene-utils";
import { joinClub } from "@/lib/bardos/client";
import { haptic } from "@/store/booking";

const STRIP = [
  { src: "/images/hero-portrait.webp", alt: "Retrato de cliente con fade fresco" },
  { src: "/images/craft-fade.webp", alt: "Macro de skin fade" },
  { src: "/images/artist-tomas.webp", alt: "Tomás, barbero de Bardos" },
  { src: "/images/space-chair.webp", alt: "Sillón vintage de Bardos" },
  { src: "/images/craft-razor.webp", alt: "Navaja sobre espuma" },
  { src: "/images/client-older.webp", alt: "Raúl, cliente desde 2019" },
  { src: "/images/service-ritual.webp", alt: "Toalla negra y navaja" },
  { src: "/images/space-mirror.webp", alt: "Espejo con lamparitas" },
  { src: "/images/craft-scissors.webp", alt: "Tijeras en corte" },
  { src: "/images/client-curly.webp", alt: "Joaco, cliente con rizos" },
];

/** DE LA SILLA — la columna editorial: profundidad de marca (DISCOVERY).
 *  Tres piezas de archivo: el origen, el método, el club. */
const STORIES = [
  {
    n: "01",
    kicker: "MMXIX — EL ORIGEN",
    title: "EL LOCAL QUE NO IBA A SER BARBERÍA",
    teaser: "Av. San Martín 2123 era un local de la Galería Los Nogales con años de vidrio molido en el piso.",
    body: [
      "Cuando lo encontramos, el local de la galería llevaba meses con la persiana baja. Pisos de pinotea, una pared de ladrillo que nadie había pintado todavía, y una luz que entraba a las cuatro de la tarde como una bendición.",
      "La idea original era un estudio de fotografía. Después fue un café. Recién cuando trajimos el primer sillón —un Koken de 1940 rescatado de un galpón de Junín de los Andes— entendimos lo que el local estaba pidiendo desde siempre: tijeras.",
      "No rompimos nada. La pared siguió de ladrillo, el pinotea siguió siendo pinotea. Cortamos lo que sobraba y dejamos lo que era. La barbería que abrimos en 2019 no la construimos: la editamos.",
    ],
    meta: "ARCHIVO — PIEZA 01 / AV. SAN MARTÍN 2123 / 2019",
  },
  {
    n: "02",
    kicker: "EL OFICIO — EL MÉTODO",
    title: "CÓMO SE CORTA UNA CABEZA",
    teaser: "Cuatro tiempos: escuchar, diagnosticar, cortar, editar. El resto es ruido.",
    body: [
      "Primero se escucha. Antes de tocar una máquina hay que dejar que el otro cuente cómo llegó a esa cabeza: qué le gusta, qué lo cansa, qué pintó su novia o su vieja o su jefe. Ese relato es la mitad del trabajo.",
      "Después viene el diagnóstico: qué se puede hacer con la forma real del cráneo, con el crecimiento real del pelo, con el tiempo real que tiene la persona para mantenerlo. La honestidad acá es una forma de respeto — si algo no se sostiene en tres semanas, se dice.",
      "Recién entonces se corta. Tijera y máquina, sin apuro, en silencio. Y al final, la edición: el espejo, la nuca, el detalle que nadie ve pero todos notan. Un corte no termina cuando cae el último pelo: termina cuando el otro se reconoce.",
    ],
    meta: "ARCHIVO — PIEZA 02 / EL OFICIO / MÉTODO BARDO",
  },
  {
    n: "03",
    kicker: "EL CLUB — LOS VIERNES",
    title: "EL VIERNES A LA NOCHE",
    teaser: "A las 19:30 bajan las cortinas, sube el whisky y el local cambia de película.",
    body: [
      "Hay un Bardos que solo existe los viernes a la noche. A las 19:30 bajamos las cortinas de la vidriera, la música pasa de jazz a algo con más tierra, y aparece la gente que viene hace años.",
      "Raúl, que entra cada dos semanas desde 2019 y pide siempre lo mismo. El equipo de fútbol del barrio que reserva la hora muerta de las 18:00 para cortarse todos juntos antes de la cena. El pibe que a los quince años vino por su primer corte serio y hoy trae a su viejo.",
      "No lo anunciamos, no lo vendemos. El club no se promociona: se acumula. Siete años de viernes hacen una película que no se puede filmar dos veces.",
    ],
    meta: "ARCHIVO — PIEZA 03 / EL CLUB / VIERNES 19:30",
  },
];

export function TheArchive() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section
      id="archive"
      aria-label="El Archivo — el archivo de Bardos"
      className="relative overflow-hidden bg-black"
      style={{ paddingTop: "var(--spacing-b7)", paddingBottom: "var(--spacing-b7)" }}
    >
      <div style={{ paddingInline: "var(--grid-margin)" }}>
        <Slate>ARCHIVO — DESDE MMXIX</Slate>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
          <Reveal as="h2" className="font-display font-display-tight type-display-sm text-offwhite">
            EL ARCHIVO<span className="text-red">.</span>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="font-editorial-italic max-w-sm text-[clamp(16px,1.6vw,22px)] text-chalk/85">
              Lo que no se edita, se archiva. Siete años de cabezas,
              navajas y viernes a la noche.
            </p>
          </Reveal>
        </div>
      </div>

      {/* Tira infinita — máscara de bordes: entra y sale de la nada */}
      <div className="marquee-mask mt-12 md:mt-16" aria-hidden="true">
        <div className="marquee-track gap-4 md:gap-6">
          {[...STRIP, ...STRIP].map((img, i) => (
            <div
              key={i}
              className={`relative w-[38vw] shrink-0 overflow-hidden sm:w-[26vw] md:w-[17vw] ${
                i % 3 === 1 ? "aspect-[3/4] translate-y-4" : "aspect-square"
              }`}
            >
              <BImage
                src={img.src}
                alt={img.alt}
                fill
                sizes="(max-width: 640px) 38vw, (max-width: 768px) 26vw, 17vw"
                imgClassName="object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* DE LA SILLA — la columna editorial */}
      <div
        className="mt-20 md:mt-28"
        style={{ paddingInline: "var(--grid-margin)" }}
      >
        <CutDivider />
        <div className="mt-10 flex flex-wrap items-end justify-between gap-6">
          <Reveal as="h3" className="font-display font-display-tight type-display-sm text-offwhite">
            DE LA SILLA<span className="text-red">.</span>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="font-editorial-italic max-w-xs text-[clamp(15px,1.5vw,20px)] text-chalk/80">
              Tres piezas del archivo: el origen, el método, el club.
            </p>
          </Reveal>
        </div>

        <div className="mt-10 md:mt-14">
          {STORIES.map((story, i) => {
            const isOpen = open === i;
            return (
              <div key={story.n} className="border-b border-line first:border-t">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={isOpen ? `story-${story.n}` : undefined}
                  className="group grid w-full grid-cols-[auto_1fr_auto] items-baseline gap-4 py-5 text-left md:grid-cols-[auto_1fr_auto] md:gap-8 md:py-7"
                >
                  <span
                    className={`font-system text-[10px] tracking-[0.3em] transition-colors duration-300 ${
                      isOpen ? "text-red" : "text-smoke group-hover:text-bone"
                    }`}
                  >
                    {story.n}
                  </span>
                  <span>
                    <span className="type-micro block text-smoke">{story.kicker}</span>
                    <span
                      className={`font-display font-display-tight mt-2 block text-[clamp(22px,3.2vw,44px)] leading-[0.95] transition-colors duration-300 ${
                        isOpen
                          ? "text-offwhite"
                          : "text-chalk/75 group-hover:text-offwhite"
                      }`}
                    >
                      {story.title}
                    </span>
                    {!isOpen && (
                      <span className="font-editorial-italic mt-2 hidden max-w-xl text-[clamp(15px,1.4vw,19px)] text-smoke transition-colors duration-300 group-hover:text-chalk/80 md:block">
                        {story.teaser}
                      </span>
                    )}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`font-display text-[clamp(18px,2vw,28px)] leading-none transition-all duration-300 ${
                      isOpen
                        ? "rotate-45 text-red"
                        : "text-smoke group-hover:text-red group-hover:translate-x-1"
                    }`}
                  >
                    +
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`story-${story.n}`}
                      key="body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-6 pb-10 md:grid-cols-[auto_1fr] md:gap-8 md:pl-[calc(10px+2rem)]">
                        {/* hairline de corte vertical: la columna */}
                        <span aria-hidden="true" className="cut-line hidden w-px self-stretch md:block" style={{ width: 1 }} />
                        <div className="max-w-2xl">
                          <p className="font-editorial-italic text-[clamp(18px,2vw,26px)] text-chalk/90 md:hidden">
                            {story.teaser}
                          </p>
                          {story.body.map((p, j) => (
                            <p
                              key={j}
                              className={`font-editorial text-balance ${
                                j === 0
                                  ? "mt-0 md:mt-0"
                                  : "mt-5"
                              } text-[clamp(17px,1.7vw,23px)] leading-[1.5] text-chalk/90`}
                            >
                              {p}
                            </p>
                          ))}
                          <p className="type-micro mt-8 text-smoke">{story.meta}</p>
                          {/* el club tiene lista: signup solo en la pieza 03 */}
                          {i === 2 && <ClubSignup />}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Instagram narrativo — no un ícono de footer */}
      <div className="mt-14" style={{ paddingInline: "var(--grid-margin)" }}>
        <a
          href="https://instagram.com/bardos.bbca"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex flex-wrap items-baseline gap-x-4 gap-y-1"
          aria-label="Instagram de Bardos — bardos.bbca"
        >
          <span className="font-editorial-italic text-[clamp(22px,3vw,40px)] text-chalk transition-colors duration-300 group-hover:text-offwhite">
            Lo de cada día está en
          </span>
          <span className="font-display font-display-tight text-[clamp(22px,3vw,40px)] text-offwhite transition-colors duration-300 group-hover:text-red">
            @LaPeluqueriaCo.BBCA
          </span>
          <span
            aria-hidden="true"
            className="font-display text-[clamp(22px,3vw,40px)] text-red opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
          >
            →
          </span>
        </a>
      </div>
    </section>
  );
}

/** EL CLUB — sumate a la lista de los viernes.
 *  El club no se promociona: se acumula. Pero la puerta se anuncia. */
function ClubSignup() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "already" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setError(null);
    try {
      const res = await joinClub(name, contact);
      haptic(14);
      setState(res.already ? "already" : "done");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Algo se cortó en el camino.");
    }
  };

  if (state === "done" || state === "already") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mt-10 border border-red/40 bg-coal p-6"
        role="status"
      >
        <p className="font-display font-display-tight text-[clamp(20px,2.4vw,30px)] text-offwhite">
          {state === "already" ? "YA ESTABAS EN LA LISTA" : "ESTÁS EN LA LISTA"}<span className="text-red">.</span>
        </p>
        <p className="font-editorial-italic mt-2 text-[clamp(15px,1.5vw,19px)] text-chalk/80">
          {state === "already"
            ? "El club reconoce a los suyos. Nos vemos un viernes."
            : `Te avisamos cuando la puerta se abre, ${
                name.trim().split(" ")[0] || "bienvenido"
              }. Nos vemos un viernes.`}
        </p>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mt-10 border border-line bg-coal/60 p-6"
      aria-label="Sumate a la lista del club"
    >
      <p className="type-micro text-red">SUMATE A LA LISTA</p>
      <p className="font-editorial-italic mt-2 max-w-md text-[clamp(15px,1.5vw,19px)] text-chalk/80">
        Te avisamos cuando abrimos la puerta un viernes. Sin spam: solo whisky y tijeras.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="sr-only">Tu nombre</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="TU NOMBRE"
            required
            minLength={2}
            maxLength={60}
            autoComplete="name"
            className="b-input w-full py-2.5 text-[12px]"
          />
        </label>
        <label className="block">
          <span className="sr-only">Tu mail o teléfono</span>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="MAIL O TELÉFONO"
            required
            minLength={5}
            maxLength={120}
            inputMode="text"
            className="b-input w-full py-2.5 text-[12px]"
          />
        </label>
      </div>
      {state === "error" && error && (
        <p className="type-micro mt-3 text-red" role="alert">
          {error}
        </p>
      )}
      <div className="mt-5 flex items-center gap-5">
        <button type="submit" disabled={state === "sending"} className="b-btn">
          {state === "sending" ? "ANOTANDO…" : "ENTRAR AL CLUB"}
        </button>
        <span className="type-micro text-smoke/70">VIERNES 19:30 · AV. SAN MARTÍN 2123</span>
      </div>
    </form>
  );
}
