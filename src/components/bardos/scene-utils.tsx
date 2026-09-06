"use client";
// LaPeluqueriaCo — primitivas de escena: slate, reveal, parallax
import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

/** Etiqueta claqueta: ACT N — SCENE / metadata */
export function Slate({
  children,
  className = "",
  left = false,
}: {
  children: ReactNode;
  className?: string;
  left?: boolean;
}) {
  return (
    <p className={`slate ${left ? "slate-left" : ""} ${className}`}>
      <span className="shrink-0">{children}</span>
    </p>
  );
}

/** REVEAL — texto que queda descubierto tras un mask (500–900ms, ease-out) */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "h2" | "h3" | "p" | "span" | "li";
}) {
  const Tag = motion[as] as typeof motion.div;
  return (
    <Tag
      className={`mask-line ${className}`}
      initial={{ y: "110%" }}
      whileInView={{ y: "0%" }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Tag>
  );
}

/** DRIFT — parallax sutil de fondo/fotografía */
export function Drift({
  children,
  className = "",
  amount = 60,
}: {
  children: ReactNode;
  className?: string;
  amount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionSafe();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [amount, -amount]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={reduced ? undefined : { y }} className="relative h-full w-full">
        {children}
      </motion.div>
    </div>
  );
}

/** Corte de sección: hairline que se extiende al entrar en viewport */
export function CutDivider({ className = "" }: { className?: string }) {
  return (
    <motion.div
      aria-hidden="true"
      className={`cut-line ${className}`}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.9, ease: [0.85, 0, 0.15, 1] }}
    />
  );
}

/** Marco editorial de sección con padding consistente */
export function Scene({
  id,
  children,
  className = "",
  label,
}: {
  id: string;
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <section
      id={id}
      aria-label={label}
      className={`relative ${className}`}
      style={{ padding: "var(--spacing-b8) var(--grid-margin)" }}
    >
      {children}
    </section>
  );
}
