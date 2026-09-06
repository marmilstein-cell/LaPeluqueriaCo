"use client";
// LaPeluqueriaCo — EL MANIFIESTO (Acto I, después del turno) — la palabra de la casa.
// La copia textual de la tesis: "Una barbería editada como una película."
// El párrafo se revela palabra por palabra mientras cruza el viewport —
// leer es ver el montaje en vivo: lo que entra apagado se enciende al
// pasar la línea, y las palabras que mandan (el guion, el montaje, el
// silencio) se encienden en rojo. El primer plano de tijeras queda
// sticky a la izquierda: mirás el corte mientras leés el guion.
import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  type MotionValue,
} from "framer-motion";
import { BImage } from "./BImage";
import { Slate, Reveal, CutDivider, Drift } from "./scene-utils";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

/** La tesis, partida en tres líneas — cada una más grande que la anterior. */
const HEAD = [
  { text: "UN ESTILO", size: "text-[clamp(38px,8vw,140px)]" },
  { text: "QUE ES ÚNICO", size: "text-[clamp(44px,9vw,160px)]" },
  { text: "TODOS LOS DÍAS", size: "text-[clamp(50px,10vw,180px)]" },
];

/** La copia, textual. *palabra* → se enciende en rojo. */
const PARAS: { kicker: string; text: string }[] = [
  {
    kicker: "01 — LA MAGIA",
    text: "Cortes a tijera o *máquina,* estilos cortos y largos. Cada intercambio es único y la *magia* dice presente todos los días para hacer de la experiencia, una sensación única.",
  },
  {
    kicker: "02 — LA EXPERIENCIA",
    text: "¿Cuál es la mejor parte? *¡Todas!* Porque en la pelu tenemos pensado cada *movimiento* y cada *sensación* desde que entrás hasta que salís por la puerta.",
  },
  {
    kicker: "03 — LA ENERGÍA",
    text: "Te invitamos a ser parte y probar nuestros servicios. Todos los servicios los abordamos con la misma metodología de trabajo y la mejor *energía* para lograr una hermosa experiencia.",
  },
];

/** Una palabra del manifiesto: apagada hasta que la línea de lectura la cruza. */
function Word({
  progress,
  a,
  b,
  accent,
  reduced,
  children,
}: {
  progress: MotionValue<number>;
  a: number;
  b: number;
  accent: boolean;
  reduced: boolean;
  children: string;
}) {
  const opacity = useTransform(progress, [a, (a + b) / 2, b], [0.6, 0.8, 1]);
  return (
    <motion.span
      style={reduced ? undefined : { opacity }}
      className={accent ? "text-red" : undefined}
    >
      {children}{" "}
    </motion.span>
  );
}

/** Un párrafo: kicker de claqueta + copia que se edita al leerla. */
function ManifestoPara({
  kicker,
  text,
  reduced,
}: {
  kicker: string;
  text: string;
  reduced: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.5"],
  });
  const tokens = text.split(" ");

  return (
    <div ref={ref}>
      <Reveal as="p" className="type-micro text-red">
        {kicker}
      </Reveal>
      <p className="font-editorial mt-4 text-[clamp(19px,2.1vw,30px)] leading-[1.55] text-chalk/95">
        {tokens.map((raw, i) => {
          const accent = raw.startsWith("*");
          const word = accent ? raw.slice(1) : raw;
          return (
            <Word
              key={i}
              progress={scrollYProgress}
              a={i / tokens.length}
              b={(i + 1) / tokens.length}
              accent={accent}
              reduced={reduced}
            >
              {word}
            </Word>
          );
        })}
      </p>
    </div>
  );
}

/** Una línea de la tesis: apagada al llegar, encendida al cruzar el viewport. */
function HeadLine({
  text,
  size,
  index,
  reduced,
}: {
  text: string;
  size: string;
  index: number;
  reduced: boolean;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { margin: "-12% 0px -28% 0px", amount: 0.4 });
  const isLast = index === HEAD.length - 1;
  const rest = 0.42 + index * 0.06;

  return (
    <p
      ref={ref}
      className={`${size} ${
        isLast ? "text-offwhite" : "text-chalk"
      } font-display font-display-tight leading-[0.95] transition-opacity duration-[900ms] ease-out`}
      style={{ opacity: reduced ? 1 : inView ? 1 : rest }}
    >
      {text}
      {isLast && <span className="text-red">.</span>}
    </p>
  );
}

export function TheManifesto() {
  const reduced = useReducedMotionSafe();

  return (
    <section
      id="manifiesto"
      aria-label="El Manifiesto — la palabra de la casa"
      className="relative bg-black"
      style={{ padding: "var(--spacing-b8) var(--grid-margin)" }}
    >
      <Slate>ACTO I — EL MANIFIESTO</Slate>

      {/* La tesis: tres líneas que se encienden como un ajuste de exposición */}
      <div className="mt-12 md:mt-16">
        {HEAD.map((l, i) => (
          <div key={l.text} className="flex items-baseline gap-6 md:gap-10">
            <span className="scene-no w-8 shrink-0">{String(i + 1).padStart(2, "0")}</span>
            <HeadLine text={l.text} size={l.size} index={i} reduced={reduced} />
          </div>
        ))}
      </div>

      <CutDivider className="mt-16 md:mt-24" />

      {/* El guion + el primer plano: la imagen sticky mientras la copia scrollea */}
      <div className="mt-12 grid gap-12 md:mt-20 md:grid-cols-12 md:gap-0">
        {/* EL PRIMER PLANO — sticky: mirás el corte mientras leés */}
        <div className="md:col-span-4 md:pr-12">
          <div className="md:sticky md:top-32">
            <div className="relative aspect-[3/4] w-full overflow-hidden">
              <Drift className="absolute inset-0" amount={22}>
                <BImage
                  src="/images/craft-scissors.webp"
                  alt="Primer plano de tijeras cortando cabello"
                  fill
                  sizes="(max-width: 768px) 92vw, 32vw"
                  imgClassName="object-cover scale-[1.06]"
                />
              </Drift>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <p className="type-micro absolute bottom-4 left-4 text-bone">
                PRIMER PLANO — TIJERAS CORTANDO CABELLO
              </p>
            </div>
            <p className="type-micro mt-3 text-smoke">FR 071 — MACRO / 50MM</p>
          </div>
        </div>

        {/* LA PALABRA — cada párrafo se edita al leerlo */}
        <div className="flex flex-col gap-14 border-line md:col-span-8 md:gap-24 md:border-l md:pl-12">
          {PARAS.map((p) => (
            <ManifestoPara key={p.kicker} kicker={p.kicker} text={p.text} reduced={reduced} />
          ))}
        </div>
      </div>

      {/* Meta de cierre */}
      <CutDivider className="mt-16 md:mt-24" />
      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-4">
        <Reveal as="p" className="type-micro text-smoke">
          MANIFIESTO — PALABRA DE LA CASA
        </Reveal>
        <Reveal delay={0.08} as="p" className="type-micro text-smoke">
          CABA — BUENOS AIRES
        </Reveal>
      </div>
    </section>
  );
}
