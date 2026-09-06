"use client";
// BARDOS — OPENING (Acto I: ENTER) — hero cinematográfico.
// Video macro (tijera, máquina, navaja, pelo cayendo) como material vivo:
// se mueve con el scroll (zoom, paneo, letterbox que se aprieta) + parallax
// de cursor. Sobre él, la coreografía tipográfica: BARDOS entra letra a letra
// (rotateX + blur), se parte por la línea de corte roja, hard cut a negro →
// BARBER. entra desde los costados (skew + blur + alternado) y se dispersa
// al salir, mientras un marquee cinético desliza la geografía del local.
// El primer scroll conduce la secuencia controlada (único scroll-jacking del sitio).
// Capa 2-c: el video REACCIONA A LA VELOCIDAD del scroll (playbackRate vivo,
// marquees con smear), REC + timecode, flicker de proyector y labels de letterbox.
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useMotionTemplate,
  useVelocity,
  type MotionValue,
} from "framer-motion";
import { BImage } from "./BImage";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

const LETTERS = ["B", "A", "R", "D", "O", "S"];
const BARBER = ["B", "A", "R", "B", "E", "R"];
const MARQUEE_LINE =
  "SAN MARTÍN DE LOS ANDES — PATAGONIA — BARBERÍA — EST. MMXIX — EL CORTE COMO EDICIÓN — ";
const MARQUEE_TOP = "BARDOS — BARBER — ";

/* El clip del hero (public/videos/hero.mp4): 10s · 24fps · 240 fotogramas,
   encodeado all-intra — cada fotograma es keyframe, así que el seek cae
   exactamente donde se lo manda en vez de saltar al keyframe más cercano.
   Ese encode es lo que hace posible el scrubbing; si se cambia el clip,
   este número tiene que acompañarlo. */
const HERO_FPS = 24;

function vh(factor: number): number {
  if (typeof window === "undefined") return 30 * factor;
  return window.innerHeight * 0.04 * factor;
}

export function Opening() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const reduced = useReducedMotionSafe();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  /* --- L9 · (capa 2-c) la velocidad del scroll: el impulso del visitante --- */
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);

  /* --- L1 · VIDEO: el encuadre vive con el scroll --- */
  // el piso es 1.06 y no 1: en 1 el parallax de cursor (±14px) despega el
  // video del borde del encuadre y asoma el negro de atrás.
  const videoScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.32, 1.06, 1.14]);
  const videoX = useTransform(scrollYProgress, [0, 1], ["-3.5vw", "3.5vw"]);
  const videoRotate = useTransform(scrollYProgress, [0, 1], [-1.2, 1.2]);
  const videoOpacity = useTransform(scrollYProgress, [0.3, 0.5], [0.75, 1]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0.55]); // 45% → ~25%
  const letterbox = useTransform(scrollYProgress, [0.5, 0.75], [0, 1]);

  /* --- L2 · BARDOS: el corte abre la palabra --- */
  const gap = useTransform(scrollYProgress, [0.28, 0.45], [0, 1]); // apertura de la palabra
  const topShift = useTransform(gap, (g) => -vh(g));
  const bottomShift = useTransform(gap, (g) => vh(g));
  const lineScale = useTransform(scrollYProgress, [0.26, 0.4], [0, 1]);
  const lineOpacity = useTransform(scrollYProgress, [0.24, 0.3, 0.5, 0.6], [0.9, 1, 1, 0]);
  const wordOpacity = useTransform(scrollYProgress, [0.42, 0.55], [1, 0]);
  const wordBlur = useTransform(scrollYProgress, [0.42, 0.55], [0, 8]);
  const wordFilter = useMotionTemplate`blur(${wordBlur}px)`;

  /* --- L3 · BARBER.: la tesis --- */
  const thesisScale = useTransform(scrollYProgress, [0.55, 0.66], [1.05, 1]);
  const serifOpacity = useTransform(scrollYProgress, [0.62, 0.68, 0.75, 0.8], [0, 1, 1, 0]);
  const serifY = useTransform(scrollYProgress, [0.62, 0.72], [24, 0]);
  const serifBlur = useTransform(scrollYProgress, [0.62, 0.72], [8, 0]);
  const serifTracking = useTransform(scrollYProgress, [0.62, 0.72], ["0.3em", "0.04em"]);
  const serifFilter = useMotionTemplate`blur(${serifBlur}px)`;

  /* --- L4 · marquees cinéticos (textura de motion graphics) --- */
  const marqueeX = useTransform(scrollYProgress, [0.5, 1], ["6%", "-34%"]);
  const marqueeOpacity = useTransform(scrollYProgress, [0.58, 0.66, 0.85, 0.95], [0, 1, 1, 0]);
  const marqueeTopX = useTransform(scrollYProgress, [0.5, 1], ["-20%", "4%"]);
  const marqueeTopOpacity = useTransform(scrollYProgress, [0.6, 0.68, 0.82, 0.9], [0, 1, 1, 0]);

  /* --- L7 · invitación al scroll --- */
  const inviteOpacity = useTransform(scrollYProgress, [0.74, 0.82, 0.86, 0.9], [0, 1, 1, 0]);
  const inviteScaleY = useTransform(scrollYProgress, [0.74, 0.88], [0, 1]);

  /* --- L8 · hard cuts --- */
  // el hard cut es un parpadeo, no un fundido: cuanto más angosto, menos
  // clip se come. Y el fundido final entra recién en el 96% para que los
  // últimos fotogramas del pelo cayendo lleguen a verse antes del negro.
  const blackFrame = useTransform(scrollYProgress, [0.47, 0.5, 0.53], [0, 1, 0]);
  const outroBlack = useTransform(scrollYProgress, [0.96, 1], [0, 1]);

  /* --- L9 · smear de los marquees: el impulso del scroll los inclina.
     Un spring sobre la velocidad que framer-motion ya calcula: se relaja
     solo al frenar y no necesita un rAF propio corriendo de fondo. --- */
  const smear = useSpring(scrollVelocity, { stiffness: 120, damping: 40, restDelta: 1 });
  const marqueeSkew = useTransform(smear, (v) => Math.max(-2, Math.min(2, v * 0.001)));
  const marqueeSkewTop = useTransform(marqueeSkew, (s) => -s);

  /* --- letterbox labels: ocultos mientras la barra mide < 4% --- */
  const barLabelOpacity = useTransform(letterbox, [0.44, 0.6], [0, 1]);

  /* --- parallax (reacción a la presencia del cursor) --- */
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const wordShiftX = useTransform(sx, [0, 1], [-12, 12]);
  const wordShiftY = useTransform(sy, [0, 1], [-6, 6]);
  const videoShiftX = useTransform(sx, [0, 1], [14, -14]);
  const videoShiftY = useTransform(sy, [0, 1], [8, -8]);

  const onPointer = (e: React.PointerEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };

  /* --- El video no se reproduce nunca: el scroll elige el fotograma.
     Safari/iOS ignora currentTime hasta que el clip "reprodujo" al menos una
     vez, así que un play()→pause() inmediato lo desbloquea sin que se vea
     moverse. --- */
  useEffect(() => {
    const v = videoRef.current;
    if (!v || videoFailed) return;
    v.muted = true;
    v.play().then(() => v.pause()).catch(() => {});
  }, [videoFailed]);

  /* --- L9 · SCRUBBING: cada pixel de scroll elige un fotograma.
     fotograma = round(progress × 239) → currentTime = centro de ese fotograma.
     Matemática directa y reversible: si subís el scroll, el pelo sube.

     Dos cosas que el rAF ingenuo no hacía, y son las que se notan:
       · Cuantizar a fotograma. Pedir un currentTime arbitrario 60 veces por
         segundo dispara ~60 seeks/s sobre un clip que solo tiene 24 fotogramas
         por segundo: más de la mitad es trabajo tirado a la basura.
       · Un solo seek en vuelo. Si le pisás un seek al browser mientras todavía
         está buscando, aborta el anterior — con scroll rápido eso es un video
         que se traba. Acá el objetivo nuevo queda pendiente y se aplica cuando
         el anterior termina ('seeked'): el último pedido siempre gana.

     Además cuelga de scrollYProgress — el mismo valor que mueve la tipografía —
     en vez de un rAF propio. Si nadie scrollea no corre nada, no se lee layout
     en cada frame, y el fotograma queda clavado en sincronía con las letras.

     Esto NO se apaga con prefers-reduced-motion, a diferencia del resto del
     acto. Reduced-motion existe para el movimiento que le pasa al visitante
     sin que lo pida; acá el visitante ES el motor: mueve mientras scrollea,
     frena cuando frena, vuelve atrás si sube. Lo que sí se apaga para ellos
     es todo lo autónomo — flicker, parallax de cursor, vuelo de las letras,
     los cortes a negro — y queda el clip scrubeando detrás de tipografía
     quieta. Apagarlo entero dejaba a esos visitantes sin hero. --- */
  useEffect(() => {
    const v = videoRef.current;
    if (!v || videoFailed) return;

    let frames = 0;
    let pending: number | null = null;

    const flush = () => {
      if (pending === null || v.seeking) return;
      const t = pending;
      pending = null;
      // ya estamos dentro de ese fotograma: el seek no cambiaría un pixel
      if (Math.abs(v.currentTime - t) < 0.5 / HERO_FPS) return;
      v.currentTime = t;
    };

    const seekTo = (p: number) => {
      if (!frames) return;
      const frame = Math.round(Math.min(1, Math.max(0, p)) * (frames - 1));
      pending = (frame + 0.5) / HERO_FPS; // centro del fotograma, nunca el borde
      flush();
    };

    const onMeta = () => {
      frames = Math.round(v.duration * HERO_FPS);
      seekTo(scrollYProgress.get()); // recarga a media página: arranca en el fotograma que toca
    };

    if (v.readyState >= 1 /* HAVE_METADATA */) onMeta();
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("seeked", flush);
    const unsubscribe = scrollYProgress.on("change", seekTo);

    return () => {
      unsubscribe();
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("seeked", flush);
    };
  }, [videoFailed, scrollYProgress]);

  return (
    <section
      id="opening"
      ref={sectionRef}
      onPointerMove={onPointer}
      className="relative h-[400vh]"
      aria-label="Bardos — apertura"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
        {/* --- L1 · FONDO: el video macro, encuadre vivo --- */}
        <motion.div
          className="absolute inset-0 vignette will-change-transform"
          style={{
            opacity: reduced ? 1 : videoOpacity,
            scale: reduced ? 1 : videoScale,
            x: reduced ? 0 : videoX,
            rotate: reduced ? 0 : videoRotate,
          }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ x: reduced ? 0 : videoShiftX, y: reduced ? 0 : videoShiftY }}
          >
            {videoFailed ? (
              <BImage
                src="/images/hero-scrub-poster.webp"
                alt="Primer plano del corte: mechones de pelo cayendo, luz dura, blanco y negro"
                fill
                priority
                sizes="100vw"
                imgClassName="object-cover object-center"
              />
            ) : (
              <video
                ref={videoRef}
                src="/videos/hero.mp4"
                poster="/images/hero-scrub-poster.webp"
                muted
                playsInline
                preload="auto"
                disablePictureInPicture
                onError={() => setVideoFailed(true)}
                aria-hidden="true"
                className="b-img h-full w-full object-cover object-center"
              />
            )}
          </motion.div>

          {/* velo de legibilidad: se aclara a medida que el corte abre el plano */}
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/25"
            style={{ opacity: reduced ? 0.35 : overlayOpacity }}
          />

          {/* letterbox: el fotograma se aprieta al profundizar */}
          <motion.span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 block h-[9%] bg-black"
            style={{ scaleY: reduced ? 1 : letterbox, transformOrigin: "top" }}
          />
          <motion.span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 block h-[9%] bg-black"
            style={{ scaleY: reduced ? 1 : letterbox, transformOrigin: "bottom" }}
          />

          {/* labels del letterbox (capa 2-c): la copia y el origen, dentro del fotograma */}
          <motion.span
            aria-hidden="true"
            className="type-micro absolute inset-x-0 top-0 z-[1] flex h-[9%] items-center text-bone/60"
            style={{ opacity: reduced ? 1 : barLabelOpacity, paddingInline: "var(--grid-margin)" }}
          >
            BARDOS
          </motion.span>
          <motion.span
            aria-hidden="true"
            className="type-micro absolute inset-x-0 bottom-0 z-[1] flex h-[9%] items-center justify-end text-bone/60"
            style={{ opacity: reduced ? 1 : barLabelOpacity, paddingInline: "var(--grid-margin)" }}
          >
            SAN MARTÍN DE LOS ANDES — PATAGONIA
          </motion.span>
        </motion.div>

        {/* --- L9 · flicker de proyector (capa 2-c): la proyección respira,
             sobre el video, bajo el texto — jamás strobe (máx 0.05) --- */}
        {!reduced && <div aria-hidden="true" className="projector-flicker z-[2]" />}

        {/* --- L9 · REC + timecode (capa 2-c): metadata viva del fotograma --- */}
        <RecCluster progress={scrollYProgress} videoRef={videoRef} reduced={reduced} />

        {/* --- L4 · marquee cinético: la geografía desliza con el scroll --- */}
        {reduced ? (
          <div className="marquee-mask absolute inset-x-0 top-[76px] z-[5] overflow-hidden">
            <div className="flex w-max whitespace-nowrap">
              <span className="type-micro text-bone/45">{MARQUEE_LINE}</span>
            </div>
          </div>
        ) : (
          <>
            <motion.div
              className="marquee-mask absolute inset-x-0 top-[72%] z-[5] overflow-hidden"
              style={{ opacity: marqueeOpacity }}
            >
              <motion.div
                className="marquee-smear flex w-max whitespace-nowrap"
                style={{ x: marqueeX, skewX: marqueeSkew }}
              >
                <span className="type-micro text-bone/45">{MARQUEE_LINE.repeat(3)}</span>
              </motion.div>
            </motion.div>
            <motion.div
              className="marquee-mask absolute inset-x-0 top-[76px] z-[5] hidden overflow-hidden md:block"
              style={{ opacity: marqueeTopOpacity }}
            >
              <motion.div
                className="marquee-smear flex w-max whitespace-nowrap"
                style={{ x: marqueeTopX, skewX: marqueeSkewTop }}
              >
                <span className="type-micro text-bone/30">{MARQUEE_TOP.repeat(12)}</span>
              </motion.div>
            </motion.div>
          </>
        )}

        {/* --- L2 · LA PALABRA, partida en dos mitades --- */}
        <motion.div
          className="absolute inset-0 z-10 flex items-center justify-center"
          style={{
            opacity: reduced ? 1 : wordOpacity,
            x: reduced ? 0 : wordShiftX,
            y: reduced ? "-15vh" : wordShiftY,
            filter: reduced ? undefined : wordFilter,
          }}
        >
          <div className="relative select-none" aria-label="BARDOS" style={{ perspective: 900 }}>
            <span aria-hidden="true" className="block">
              <HalfWord clip="inset(0 0 50% 0)" y={reduced ? undefined : topShift} sx={sx} reduced={reduced} />
            </span>
            <span aria-hidden="true" className="absolute inset-0 block">
              <HalfWord clip="inset(50% 0 0 0)" y={reduced ? undefined : bottomShift} sx={sx} reduced={reduced} />
            </span>

            {/* la línea de corte (firma visual) */}
            <motion.span
              aria-hidden="true"
              className="cut-line absolute left-0 top-1/2"
              style={{ scaleX: reduced ? 1 : lineScale, opacity: reduced ? 1 : lineOpacity }}
            />
          </div>
        </motion.div>

        {/* --- L3 · LA TESIS: BARBER. --- */}
        <motion.div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center"
          style={{ scale: reduced ? 1 : thesisScale, y: reduced ? "12vh" : 0 }}
        >
          <h1
            aria-label="BARBER."
            className="font-display font-display-tight type-display-md px-4 text-center text-offwhite"
          >
            <span aria-hidden="true" className="flex items-baseline justify-center will-change-transform">
              {BARBER.map((l, i) => (
                <BarberLetter key={i} char={l} index={i} progress={scrollYProgress} reduced={reduced} />
              ))}
              <BarberDot progress={scrollYProgress} reduced={reduced} />
            </span>
          </h1>
          <motion.p
            className="font-editorial-italic mt-4 px-6 text-center text-[clamp(18px,2.4vw,30px)] text-chalk/90 sm:mt-6"
            style={{
              opacity: reduced ? 1 : serifOpacity,
              y: reduced ? 0 : serifY,
              letterSpacing: reduced ? "0.04em" : serifTracking,
              filter: reduced ? undefined : serifFilter,
            }}
          >
            Cortar es quitar.
          </motion.p>
        </motion.div>

        {/* --- L5 · slates de esquina: metadata del fotograma --- */}
        <CornerSlate index={0} progress={scrollYProgress} reduced={reduced} className="left-0 top-24">
          BARDOS®
        </CornerSlate>
        <CornerSlate index={1} progress={scrollYProgress} reduced={reduced} className="right-0 top-24 text-right">
          SAN MARTÍN DE LOS ANDES
        </CornerSlate>
        <CornerSlate index={2} progress={scrollYProgress} reduced={reduced} className="bottom-28 left-0">
          PATAGONIA — ARGENTINA
        </CornerSlate>
        <CornerSlate index={3} progress={scrollYProgress} reduced={reduced} className="bottom-28 right-0 text-right">
          ESCENA 01 — ENTRADA
        </CornerSlate>

        {/* --- L7 · invitación al scroll: la línea que corta hacia abajo --- */}
        <motion.div
          className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-4"
          style={{ opacity: reduced ? 1 : inviteOpacity }}
        >
          <motion.span
            className="type-micro text-bone"
            animate={reduced ? undefined : { opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            DESLIZÁ
          </motion.span>
          <motion.span
            className="block w-[1px] bg-red"
            style={{ height: 56, scaleY: reduced ? 1 : inviteScaleY, transformOrigin: "top" }}
          />
        </motion.div>

        {/* --- L8 · hard cut con frame negro (1-2 frames) + fundido final del acto --- */}
        {!reduced && (
          <>
            <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 bg-black" style={{ opacity: blackFrame }} />
            <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 bg-black" style={{ opacity: outroBlack }} />
          </>
        )}

        {/* --- L6 · metadata claqueta (secuencia temporizada de apertura) --- */}
        {!reduced && <IntroMeta />}
      </div>
    </section>
  );
}

/** Secuencia de apertura temporizada (00:00 → 00:03): slate, hairline y metadata. */
function IntroMeta() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 2600);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <motion.div
        className="absolute inset-x-0 top-24 hidden justify-between md:top-28 md:flex"
        style={{ paddingInline: "var(--grid-margin)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: done ? 0 : 0.9 }}
        transition={{ duration: 1 }}
      >
        <span className="type-micro text-bone">SAN MARTÍN DE LOS ANDES</span>
        <span className="type-micro text-smoke">EST. MMXIX</span>
      </motion.div>

      {/* hairline roja latiendo en el silencio inicial */}
      <motion.div
        aria-hidden="true"
        className="cut-line absolute left-1/2 top-1/2 z-10 -translate-x-1/2"
        style={{ width: 48 }}
        initial={{ scaleX: 0.2, opacity: 0 }}
        animate={done ? { opacity: 0 } : { scaleX: [0.2, 1, 0.55], opacity: 1 }}
        transition={{ duration: 2.4, ease: [0.85, 0, 0.15, 1] }}
      />

      {/* slate inicial */}
      <motion.div
        className="absolute left-1/2 top-[38%] z-10 -translate-x-1/2"
        initial={{ opacity: 0, y: 8 }}
        animate={done ? { opacity: 0, y: 8 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="type-micro text-bone">BARDOS / SAN MARTÍN DE LOS ANDES</p>
      </motion.div>
    </>
  );
}

/**
 * Reloj en vivo (capa 2-c): muestra la fecha y hora real de San Martín de los Andes.
 * Reemplaza al antiguo timecode del video para dar una sensación de inmediatez.
 */
function RecCluster({
  progress,
  reduced,
}: {
  progress: MotionValue<number>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  reduced: boolean | null;
}) {
  const [timeStr, setTimeStr] = useState("—");
  const exitOpacity = useTransform(progress, [0.7, 0.78], [1, 0]);

  useEffect(() => {
    const update = () => {
      const d = new Date();
      const fmt = new Intl.DateTimeFormat("es-AR", {
        timeZone: "America/Buenos_Aires",
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      // Ej: "dom 06 sep 14:05" -> "DOM 06 SEP — 14:05"
      const parts = fmt.formatToParts(d);
      const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
      const day = get("weekday").toUpperCase().replace(".", "");
      const num = get("day");
      const month = get("month").toUpperCase().replace(".", "");
      const hh = get("hour");
      const mm = get("minute");
      setTimeStr(`${day} ${num} ${month} — ${hh}:${mm}`);
    };
    update();
    const id = setInterval(update, 10000); // actualiza cada 10 seg
    return () => clearInterval(id);
  }, []);

  const cluster = "type-micro absolute right-0 top-[76px] z-[6] flex items-center gap-2";
  const clusterStyle = { paddingInline: "var(--grid-margin)" };

  if (reduced) {
    return (
      <div aria-hidden="true" className={cluster} style={clusterStyle}>
        <span className="rec-dot" />
        <span className="text-bone">VIVO</span>
        <span className="text-bone/60">{timeStr}</span>
      </div>
    );
  }

  return (
    <motion.div
      aria-hidden="true"
      className={cluster}
      style={clusterStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.span className="flex items-center gap-2" style={{ opacity: exitOpacity }}>
        <span className="rec-dot" />
        <span className="text-bone">VIVO</span>
        <span className="text-bone/60 tabular-nums">
          {timeStr}
        </span>
      </motion.span>
    </motion.div>
  );
}

/** Una mitad de la palabra con clip-path; letras con micro-parallax individual. */
function HalfWord({
  clip,
  y,
  sx,
  reduced,
}: {
  clip: string;
  y?: MotionValue<number>;
  sx: MotionValue<number>;
  reduced: boolean | null;
}) {
  return (
    <motion.span
      className="font-display font-display-tight type-display block whitespace-nowrap text-offwhite"
      style={{ clipPath: clip, y }}
    >
      <span className="flex" style={{ perspective: 900 }}>
        {LETTERS.map((l, i) => (
          <Letter key={i} char={l} index={i} sx={sx} reduced={reduced} />
        ))}
      </span>
    </motion.span>
  );
}

function Letter({
  char,
  index,
  sx,
  reduced,
}: {
  char: string;
  index: number;
  sx: MotionValue<number>;
  reduced: boolean | null;
}) {
  const center = (index + 0.5) / LETTERS.length;
  const parallaxY = useTransform(sx, [0, center, 1], [5, -4, 5]);

  if (reduced) {
    return <span className="inline-block">{char}</span>;
  }

  return (
    <motion.span style={{ y: parallaxY }} className="inline-block">
      <motion.span
        className="inline-block"
        style={{ transformPerspective: 900 }}
        initial={{ y: "0.65em", opacity: 0, rotateX: 55, filter: "blur(12px)" }}
        animate={{ y: 0, opacity: 1, rotateX: 0, filter: "blur(0px)" }}
        transition={{ delay: 0.9 + index * 0.07, duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        {char}
      </motion.span>
    </motion.span>
  );
}

/**
 * Letra de BARBER. — coreografía scroll-driven:
 * ENTRADA [0.55 + i·0.025, +0.07]: vuela desde su costado (x ±90, skewX ∓14, blur 10→0).
 * SALIDA [0.74 + i·0.02, +0.09]: se dispersa arriba/abajo (y ∓110/+130, rotate ±6, blur 6).
 */
function BarberLetter({
  char,
  index,
  progress,
  reduced,
}: {
  char: string;
  index: number;
  progress: MotionValue<number>;
  reduced: boolean | null;
}) {
  const fromLeft = index % 2 === 0;
  const tIn = 0.55 + index * 0.025;
  const tInEnd = tIn + 0.07;
  const tOut = 0.74 + index * 0.02;
  const tOutEnd = tOut + 0.09;

  const x = useTransform(progress, [tIn, tInEnd], [fromLeft ? -90 : 90, 0]);
  const y = useTransform(progress, [tOut, tOutEnd], [0, fromLeft ? -110 : 130]);
  const skewX = useTransform(progress, [tIn, tInEnd], [fromLeft ? -14 : 14, 0]);
  const rotate = useTransform(progress, [tOut, tOutEnd], [0, fromLeft ? -6 : 6]);
  const opacity = useTransform(progress, [tIn, tInEnd, tOut, tOutEnd], [0, 1, 1, 0]);
  const blur = useTransform(progress, [tIn, tInEnd, tOut, tOutEnd], [10, 0, 0, 6]);

  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) rotate(${rotate}deg) skewX(${skewX}deg)`;
  const filter = useMotionTemplate`blur(${blur}px)`;

  if (reduced) {
    return <span className="inline-block">{char}</span>;
  }

  return (
    <motion.span className="inline-block" style={{ transform, opacity, filter }}>
      {char}
    </motion.span>
  );
}

/** El punto rojo: punch-in quirúrgico al final de la entrada de la palabra. */
function BarberDot({
  progress,
  reduced,
}: {
  progress: MotionValue<number>;
  reduced: boolean | null;
}) {
  const scale = useTransform(progress, [0.7, 0.74, 0.8, 0.88], [2.6, 1, 1, 1.25]);
  const opacity = useTransform(progress, [0.7, 0.74, 0.8, 0.88], [0, 1, 1, 0]);

  if (reduced) {
    return <span className="inline-block text-red">.</span>;
  }

  return (
    <motion.span className="inline-block text-red" style={{ scale, opacity }}>
      .
    </motion.span>
  );
}

/** Caption de esquina: entra tras el slate y deriva con el scroll. */
function CornerSlate({
  index,
  progress,
  reduced,
  className,
  children,
}: {
  index: number;
  progress: MotionValue<number>;
  reduced: boolean | null;
  className: string;
  children: React.ReactNode;
}) {
  const drift = useTransform(progress, [0, 1], [
    index % 2 === 0 ? -18 : 18,
    index % 2 === 0 ? 18 : -18,
  ]);

  return (
    <motion.div
      className={`type-micro absolute z-10 hidden text-bone/70 sm:block ${className}`}
      style={{ y: reduced ? 0 : drift, paddingInline: "var(--grid-margin)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: reduced ? 1 : 0.9 }}
      transition={
        reduced
          ? { duration: 0 }
          : { delay: 1.2 + index * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }
      }
    >
      {children}
    </motion.div>
  );
}
