"use client";
// BARDOS — THE CRAFT (Acto II — close-up / macro)
// El proceso en primer plano: video sin editar + macro shots del oficio.
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BImage } from "./BImage";
import { Slate, Reveal, CutDivider } from "./scene-utils";

/** Video con autoplay confiable: solo cuando entra al viewport (y muted). */
function VideoAutoplay({ onFail }: { onFail: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            v.play().catch(() => {
              /* autoplay bloqueado: queda el primer frame */
            });
          } else {
            v.pause();
          }
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(v);
    return () => obs.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className="b-img h-full w-full object-cover"
      muted
      loop
      playsInline
      preload="auto"
      onError={onFail}
      aria-label="Video en cámara lenta de una máquina cortando un fade"
    >
      <source src="/videos/craft.mp4" type="video/mp4" />
    </video>
  );
}

const MACROS: { src: string; alt: string; caption: string; frame: string; span: string }[] = [
  {
    src: "/images/craft-clippers.webp",
    alt: "Macro de máquina cortando el fade, cabello cayendo",
    caption: "MÁQUINA — EL FADE, CAPA POR CAPA",
    frame: "FR 041",
    span: "md:col-span-7 md:row-span-2 aspect-[4/3]",
  },
  {
    src: "/images/craft-razor.webp",
    alt: "Navaja libre deslizando sobre espuma en la mejilla",
    caption: "NAVAJA — LA LÍNEA DEFINITIVA",
    frame: "FR 112",
    span: "md:col-span-5 aspect-[3/4]",
  },
  {
    src: "/images/craft-foam.webp",
    alt: "Brocha batiendo espuma en un bol de metal",
    caption: "ESPUMA — EL RITUAL ANTES DEL CORTE",
    frame: "FR 007",
    span: "md:col-span-5 aspect-square",
  },
  {
    src: "/images/craft-fade.webp",
    alt: "Macro de la transición piel-cabello de un skin fade",
    caption: "MACRO — PIEL A CABELLO, 0.5 MM",
    frame: "FR 098",
    span: "md:col-span-4 aspect-square",
  },
  {
    src: "/images/craft-scissors.webp",
    alt: "Tijeras de barbería cortando mechón a mechón",
    caption: "TIJERA — LA PRECISIÓN LENTA",
    frame: "FR 071",
    span: "md:col-span-8 aspect-[16/9]",
  },
];

export function TheCraft() {
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <section
      id="craft"
      aria-label="El Oficio — el proceso"
      className="relative bg-black"
      style={{ padding: "var(--spacing-b8) var(--grid-margin)" }}
    >
      <Slate>ACTO II — EL OFICIO</Slate>

      <Reveal as="h2" className="font-display font-display-tight type-display-sm mt-8 text-offwhite">
        EL PROCESO<span className="text-red">.</span>
      </Reveal>
      <Reveal delay={0.12}>
        <p className="font-editorial-italic mt-4 max-w-2xl text-[clamp(18px,2vw,26px)] text-chalk/90">
          Primer plano. El detalle donde todo se decide: medio milímetro
          antes o después de la línea, y ya es otro hombre.
        </p>
      </Reveal>

      {/* --- VIDEO MOMENT: el proceso, sin edición --- */}
      <div className="relative mt-14 aspect-video w-full overflow-hidden md:mt-20">
        {!videoFailed ? (
          <VideoAutoplay onFail={() => setVideoFailed(true)} />
        ) : (
          <BImage
            src="/images/craft-clippers.webp"
            alt="Macro de máquina cortando el fade"
            fill
            sizes="100vw"
            imgClassName="object-cover"
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        <div className="absolute bottom-5 left-0 right-0 flex items-center justify-between px-5">
          <span className="type-micro text-bone">REC — FADE / CÁMARA LENTA</span>
          <span className="type-micro flex items-center gap-2 text-bone">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-[1px] bg-red" />
            SIN EDICIÓN
          </span>
        </div>
      </div>

      {/* --- Grilla macro editorial --- */}
      <div className="mt-14 grid gap-5 md:mt-20 md:grid-cols-12 md:gap-6">
        {MACROS.map((m, i) => (
          <motion.figure
            key={m.src}
            className={`relative ${m.span} aspect-square overflow-hidden`}
            initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            whileInView={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
            viewport={{ once: true, margin: "-8% 0px" }}
            transition={{ duration: 0.85, delay: (i % 2) * 0.12, ease: [0.85, 0, 0.15, 1] }}
          >
            <BImage
              src={m.src}
              alt={m.alt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              imgClassName="object-cover transition-transform duration-700 hover:scale-[1.03]"
            />
            <figcaption className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent p-4">
              <span className="type-micro text-bone">{m.caption}</span>
              <span className="type-micro text-smoke">{m.frame}</span>
            </figcaption>
          </motion.figure>
        ))}
      </div>

      {/* --- EL RESULTADO: movido a su propia sección (TheResult) --- */}
    </section>
  );
}

export function TheResult() {
  return (
    <section
      id="resultado"
      aria-label="El Resultado — antes y después"
      className="relative bg-black"
      style={{ padding: "var(--spacing-b5) var(--grid-margin)" }}
    >
      <CutReveal />
      <CutDivider className="mt-20" />
    </section>
  );
}

/** EL ANTES Y EL DESPUÉS — el reveal arrastrable.
 *  La línea roja ES el corte: arrastrala y editás al hombre.
 *  A la izquierda EL RUIDO (antes), a la derecha EL CORTE (después). */
function CutReveal() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(100); // arranca todo en "antes" — la intro hace el primer corte
  const [armed, setArmed] = useState(false); // intro played
  const [isDragging, setIsDragging] = useState(false); // durante drag: sin transición

  // intro: al entrar al viewport se arma (una sola vez)
  useEffect(() => {
    const el = frameRef.current;
    if (!el || armed) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setArmed(true);
          obs.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [armed]);

  // armado → la línea barre de 100 a 42: el primer corte
  // (efecto separado: su cleanup es del timer propio, no del observador)
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setPos(42), 350);
    return () => clearTimeout(t);
  }, [armed]);

  const setFromClientX = (clientX: number) => {
    const el = frameRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pct = ((clientX - r.left) / r.width) * 100;
    setPos(Math.min(96, Math.max(4, pct)));
  };

  // pointer: drag en todo el frame (no solo el grip)
  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setFromClientX(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setFromClientX(e.clientX);
  };
  const onPointerUp = () => {
    setIsDragging(false);
  };

  // teclado: flechas finas sobre el grip
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 15 : 5;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      setPos((p) => Math.max(4, p - step));
      e.preventDefault();
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      setPos((p) => Math.min(96, p + step));
      e.preventDefault();
    } else if (e.key === "Home") {
      setPos(4);
      e.preventDefault();
    } else if (e.key === "End") {
      setPos(96);
      e.preventDefault();
    }
  };

  return (
    <div className="mt-14 md:mt-20">
      <Reveal as="h3" className="font-display font-display-tight type-display-sm text-offwhite">
        EL RESULTADO<span className="text-red">.</span>
      </Reveal>
      <Reveal delay={0.1}>
        <p className="font-editorial-italic mt-3 max-w-xl text-[clamp(16px,1.8vw,22px)] text-chalk/85">
          El mismo hombre, cuarenta y cinco minutos de por medio.
          Arrastrá la línea y hacé el corte vos.
        </p>
      </Reveal>

      <div
        ref={frameRef}
        className="relative mt-8 aspect-[2/3] w-full max-w-md touch-none select-none md:aspect-[3/4] lg:max-w-lg"
        style={{ cursor: "ew-resize" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="group"
        aria-label="Antes y después del corte — arrastrá la línea para comparar"
      >
        {/* ANTES: capa base */}
        <BImage
          src="/images/cut-before.webp"
          alt="Antes: el mismo hombre con el pelo crecido y desprolijo"
          fill
          sizes="(max-width: 768px) 90vw, 560px"
          imgClassName="object-cover"
        />
        {/* DESPUÉS: capa recortada por la línea (visible a la derecha) */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
          aria-hidden="true"
        >
          <BImage
            src="/images/cut-after.webp"
            alt=""
            fill
            sizes="(max-width: 768px) 90vw, 560px"
            imgClassName="object-cover"
          />
        </div>

        {/* etiquetas */}
        <span
          className="type-micro pointer-events-none absolute left-4 top-4 bg-black/60 px-2 py-1 text-bone backdrop-blur-[2px]"
          style={{ opacity: pos > 14 ? 1 : 0, transition: "opacity 0.3s" }}
          aria-hidden="true"
        >
          EL RUIDO — ANTES
        </span>
        <span
          className="type-micro pointer-events-none absolute right-4 top-4 bg-black/60 px-2 py-1 text-red backdrop-blur-[2px]"
          style={{ opacity: pos < 86 ? 1 : 0, transition: "opacity 0.3s" }}
          aria-hidden="true"
        >
          EL CORTE — DESPUÉS
        </span>

        {/* LA LÍNEA: el corte arrastrable */}
        <div
          className="pointer-events-none absolute inset-y-0 z-10"
          style={{ left: `${pos}%`, transition: isDragging ? "none" : "left 0.9s cubic-bezier(0.16,1,0.3,1)" }}
          aria-hidden="true"
        >
          <div className="absolute inset-y-0 -left-px w-[2px] bg-red shadow-[0_0_12px_rgba(229,35,27,0.5)]" />
          {/* grip: teclado + touch */}
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ pointerEvents: "auto" }}
          >
            <div
              role="slider"
              tabIndex={0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pos)}
              aria-label="Línea de corte — arrastrá o usá las flechas para comparar antes y después"
              onKeyDown={onKeyDown}
              className="flex h-11 w-11 items-center justify-center border border-red bg-black/85 backdrop-blur-sm transition-transform duration-200 focus-visible:scale-110"
              style={{ cursor: "ew-resize" }}
            >
              <span className="font-system text-[10px] tracking-[0.2em] text-red">⇄</span>
            </div>
          </div>
        </div>

        {/* pie del frame */}
        <div className="type-micro pointer-events-none absolute bottom-3 left-0 right-0 flex items-center justify-between px-4">
          <span className="text-bone/70">FR 220 — ANTES / DESPUÉS</span>
          <span className="hidden text-smoke/80 md:block">ARRASTRÁ LA LÍNEA</span>
        </div>
      </div>
    </div>
  );
}
