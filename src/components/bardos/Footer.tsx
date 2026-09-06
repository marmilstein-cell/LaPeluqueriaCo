"use client";
// LaPeluqueriaCo — FOOTER: créditos finales de la película, no un sitemap.
import { motion } from "framer-motion";
import { Slate, Reveal } from "./scene-utils";
import { scrollToScene } from "./providers";
import { SHOP } from "@/lib/bardos/domain";

const CREDITS: [string, string][] = [
  ["DIRECCIÓN", "EL OFICIO"],
  ["FOTOGRAFÍA", "FLASH DIRECTO / 35MM"],
  ["EDICIÓN", "EL CORTE"],
  ["SONIDO", "TIJERAS"],
  ["ROPA", "TRAJE DE TRABAJO"],
];

export function Footer() {
  return (
    <footer
      className="relative mt-auto border-t border-line bg-black"
      aria-label="Créditos y cierre"
    >
      <div style={{ padding: "var(--spacing-b7) var(--grid-margin) var(--spacing-b5)" }}>
        <Slate>ACTO FINAL — VUELTA</Slate>

        <Reveal as="h2" className="font-display font-display-tight type-display-md mt-8 text-offwhite">
          NOS VEMOS <span className="whitespace-nowrap">PRONTO<span className="text-red">.</span></span>
        </Reveal>

        {/* créditos */}
        <motion.dl
          className="mt-14 grid gap-x-12 gap-y-4 sm:grid-cols-2 lg:grid-cols-5"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-5% 0px" }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.07 } },
          }}
        >
          {CREDITS.map(([k, v]) => (
            <motion.div
              key={k}
              variants={{
                hidden: { opacity: 0, y: 12 },
                show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
              }}
            >
              <dt className="type-micro text-smoke">{k}</dt>
              <dd className="font-system mt-1 text-[12px] tracking-[0.08em] text-bone">{v}</dd>
            </motion.div>
          ))}
        </motion.dl>

        {/* línea final */}
        <div className="mt-14 flex flex-col gap-6 border-t border-line pt-6 md:flex-row md:items-center md:justify-between">
          <p className="type-micro text-smoke">
            LaPeluqueriaCo — {SHOP.address.toUpperCase()} — MAR–SÁB 10–20
          </p>
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Navegación de cierre">
            <button onClick={() => scrollToScene("the-cut")} className="b-link">
              EL CORTE
            </button>
            <button onClick={() => scrollToScene("artists")} className="b-link">
              EL BARBERO
            </button>
            <button onClick={() => scrollToScene("space")} className="b-link">
              EL CUARTO
            </button>
            <button onClick={() => scrollToScene("book")} className="b-link">
              TURNO
            </button>
          </nav>
          <p className="type-micro text-smoke">
            © LaPeluqueriaCo — HECHO A NAVAJA EN CABA
          </p>
        </div>
      </div>
    </footer>
  );
}
