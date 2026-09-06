"use client";
// BARDOS — THE CUT (Acto III: CHOOSE)
// QUITAR. PULIR. DEFINIR. SER. + ¿QUÉ TE CORTAMOS?
// Lista editorial de servicios — no cards. La elección dispara el color.
import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence, useInView } from "framer-motion";
import { BImage } from "./BImage";
import { Slate, Reveal, CutDivider } from "./scene-utils";
import { useCatalog } from "./useCatalog";
import { scrollToScene } from "./providers";
import { useBooking, haptic } from "@/store/booking";
import { priceARS } from "@/lib/bardos/domain";

const THESIS = ["QUITAR", "PULIR", "DEFINIR", "SER"];

/** Cada palabra de la tesis: apagada al llegar, se enciende al cruzar el viewport.
 *  La jerarquía se mantiene (QUITAR más tenue → SER full). */
function ThesisWord({
  word,
  index,
  className,
}: {
  word: string;
  index: number;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { margin: "-12% 0px -28% 0px", amount: 0.4 });
  const isLast = index === THESIS.length - 1;
  // intensidad de reposo vs. encendida: 40% → progresivo por palabra
  const rest = 0.42 + index * 0.06;
  const lit = 0.78 + index * 0.05;

  return (
    <p
      ref={ref}
      className={`${className ?? ""} ${isLast ? "text-offwhite" : "text-chalk"} transition-opacity duration-[900ms] ease-out`}
      style={{ opacity: isLast ? 1 : inView ? lit : rest }}
    >
      {word}
      {isLast && <span className="text-red">.</span>}
    </p>
  );
}

export function TheCut() {
  const { data } = useCatalog();
  const services = data?.services ?? [];
  const setService = useBooking((s) => s.setService);
  const setStep = useBooking((s) => s.goTo);
  const rescheduling = useBooking((s) => s.reschedulingId);

  const [preview, setPreview] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spx = useSpring(px, { stiffness: 250, damping: 30 });
  const spy = useSpring(py, { stiffness: 250, damping: 30 });

  const onMove = (e: React.PointerEvent) => {
    px.set(e.clientX);
    py.set(e.clientY);
  };

  const choose = (serviceId: string) => {
    if (rescheduling) return; // en reprogramación no se cambia el servicio
    haptic(14);
    setService(serviceId);
    setStep(2); // el servicio ya está elegido → paso artista
    scrollToScene("book");
  };

  return (
    <section
      id="the-cut"
      ref={sectionRef}
      onPointerMove={onMove}
      aria-label="El Corte — servicios"
      className="relative bg-black"
      style={{ padding: "var(--spacing-b8) var(--grid-margin)" }}
    >
      <Slate>ACTO III — EL CORTE</Slate>

      {/* Tesis como secuencia tipográfica — cada palabra más grande que la anterior.
          Se encienden al cruzar el viewport: lo que se corta se apaga, lo que sos no. */}
      <div className="mt-12 md:mt-16">
        {THESIS.map((word, i) => (
          <div key={word} className="flex items-baseline gap-6 md:gap-10">
            <span className="scene-no w-8 shrink-0">{String(i + 1).padStart(2, "0")}</span>
            <Reveal
              as="div"
              delay={i * 0.05}
              className={
                i === 0
                  ? "text-[clamp(38px,8vw,140px)]"
                  : i === 1
                  ? "text-[clamp(44px,9vw,160px)]"
                  : i === 2
                  ? "text-[clamp(50px,10vw,180px)]"
                  : "text-[clamp(56px,11vw,200px)]"
              }
            >
              <ThesisWord
                word={word}
                index={i}
                className="font-display font-display-tight leading-[0.95]"
              />
            </Reveal>
          </div>
        ))}
      </div>

      <CutDivider className="mt-16 md:mt-24" />

      {/* ¿QUÉ TE CORTAMOS? — lista de servicios */}
      <div className="mt-12 md:mt-16">
        <Reveal as="h2" className="font-display font-display-tight type-display-sm text-offwhite">
          ¿QUÉ TE CORTAMOS<span className="text-red">?</span>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="type-mono-label mt-3 text-smoke">
            {rescheduling ? "REPROGRAMANDO — EL SERVICIO YA ESTÁ ELEGIDO" : "ELEGÍ UN SERVICIO PARA EMPEZAR TU SESIÓN"}
          </p>
        </Reveal>

        <div role="list" aria-label="Servicios de Bardos" className="mt-10 md:mt-14">
          {services.map((s, i) => (
            <button
              key={s.id}
              role="listitem"
              onClick={() => choose(s.id)}
              onPointerEnter={() => setPreview(s.imageRef)}
              onPointerLeave={() => setPreview(null)}
              onFocus={() => setPreview(s.imageRef)}
              onBlur={() => setPreview(null)}
              className="group relative block w-full border-b border-line text-left first:border-t"
              aria-label={`${s.name} — ${s.nameEs} — ${s.durationMinutes} minutos — ${priceARS(s.price)}`}
            >
              <span className="pointer-events-none absolute inset-x-0 inset-y-0 -z-10 origin-left scale-y-0 bg-coal transition-transform duration-300 ease-[cubic-bezier(0.85,0,0.15,1)] group-hover:scale-y-100" />
              {/* LA LÍNEA DE CORTE: hairline roja vertical que entra con la elección */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-0 h-full w-[3px] origin-top scale-y-0 bg-red transition-transform duration-300 ease-[cubic-bezier(0.85,0,0.15,1)] group-hover:scale-y-100"
              />
              <span className="flex flex-wrap items-baseline gap-x-6 gap-y-2 py-7 md:py-9">
                <span className="scene-no w-10 shrink-0 transition-colors duration-300 group-hover:text-red">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-display font-display-tight text-[clamp(30px,5vw,72px)] text-chalk/70 transition-colors duration-300 group-hover:text-offwhite">
                  {s.name}
                </span>
                <span className="font-system hidden text-[13px] text-smoke lg:block">{s.nameEs}</span>
                <span className="ml-auto flex items-baseline gap-8">
                  <span className="type-mono-label text-bone">{s.durationMinutes}′</span>
                  <span className="font-display text-[clamp(18px,2vw,30px)] text-offwhite">
                    {priceARS(s.price)}
                  </span>
                  <span
                    aria-hidden="true"
                    className="font-display text-[clamp(20px,2.4vw,34px)] text-red opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
                  >
                    →
                  </span>
                </span>
              </span>
              {/* descripción visible en hover/keyboard (progressive disclosure) —
                  pl-16: alineada bajo el nombre (scene-no w-10 + gap-x-6 = 4rem) */}
              <span className="block max-w-xl pl-16 pb-6 font-editorial-italic text-[17px] leading-[1.4] text-chalk/0 transition-colors duration-500 group-hover:text-chalk/80 md:pb-7">
                {s.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Preview flotante que sigue al cursor — lenguaje editorial de lookbook */}
      <AnimatePresence>
        {preview && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none fixed z-40 hidden aspect-[3/4] w-[220px] overflow-hidden lg:block"
            style={{ x: spx, y: spy, left: 26, top: -160 }}
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <BImage src={preview} alt="" fill sizes="220px" imgClassName="object-cover" />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
