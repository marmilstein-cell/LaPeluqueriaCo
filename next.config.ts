import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const nextConfig: NextConfig = {
  turbopack: {
    // Sin esto Turbopack infiere la raíz sola y se va para arriba: encontraba un
    // package-lock.json suelto en C:\Users\marmi y avisaba que lo ignoraba.
    // Se calcula desde la ubicación de este archivo, no se hardcodea, así el
    // proyecto sigue andando en cualquier máquina.
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
  // typescript.ignoreBuildErrors quedó fuera a propósito: tapaba errores de tipo
  // reales en el build de producción. Lo único que fallaba era examples/, que es
  // scaffolding muerto — ahora está excluido en tsconfig.json.
  //
  // StrictMode va prendido: en dev monta, desmonta y vuelve a montar cada
  // componente para delatar effects sin cleanup. En un sitio hecho de scroll,
  // observers y video, ese es exactamente el bug que uno quiere que salte.
  reactStrictMode: true,
  // allowedDevOrigins tenía *.space-z.ai y *.z.ai, restos del entorno donde se
  // generó el proyecto. Fuera: dejaba orígenes ajenos hablando con el dev server.
};

export default nextConfig;
