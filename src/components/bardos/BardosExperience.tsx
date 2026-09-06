"use client";
// LaPeluqueriaCo — la experiencia completa en una sola película scrolleable.
// Actos: ENTER → TU TURNO (book) → EL BARBERO (people) → EL OFICIO (craft)
//        → EL CORTE (cut) → ARCHIVO → EL CUARTO (space) → RETURN (footer).
import { BardosProviders } from "@/components/bardos/providers";
import { Cursor, Grain } from "@/components/bardos/cursor";
import { Nav } from "@/components/bardos/Nav";
import { Opening } from "@/components/bardos/Opening";
import { ThePeople } from "@/components/bardos/ThePeople";
import { TheCraft, TheResult } from "@/components/bardos/TheCraft";
import { TheCut } from "@/components/bardos/TheCut";
import { TheArchive } from "@/components/bardos/TheArchive";
import { TheSpace } from "@/components/bardos/TheSpace";
import { YourSession } from "@/components/bardos/booking/YourSession";
import { TheManifesto } from "@/components/bardos/TheManifesto";
import { SessionPass } from "@/components/bardos/SessionPass";
import { Cabina } from "@/components/bardos/cabina/Cabina";
import { Footer } from "@/components/bardos/Footer";

export default function BardosExperience() {
  return (
    <BardosProviders>
      <div className="cursor-host relative flex min-h-screen flex-col bg-black">
        <Grain />
        <Cursor />
        <Nav />

        <main className="relative flex-1">
          <Opening />
          <YourSession />
          <TheResult />
          <TheManifesto />
          <ThePeople />
          <TheCraft />
          <TheCut />
          <TheArchive />
          <TheSpace />
        </main>

        <Footer />
        <SessionPass />
        <Cabina />
      </div>
    </BardosProviders>
  );
}
