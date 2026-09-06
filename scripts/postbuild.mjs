// BARDOS — post-build de output:"standalone".
//
// Next deja en .next/standalone un server.js con sus node_modules mínimos, pero
// NO copia los assets estáticos: hay que llevarle .next/static y public/ al lado.
// Antes esto eran dos `cp -r` en el script de npm, que en Windows no existen
// (npm usa cmd.exe acá). fs.cp hace lo mismo en cualquier sistema operativo.
import { cp, access } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const STANDALONE = path.join(ROOT, ".next", "standalone");

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(STANDALONE))) {
  console.error(
    'postbuild: no existe .next/standalone. ¿Sigue output:"standalone" en next.config.ts?'
  );
  process.exit(1);
}

const copies = [
  [path.join(ROOT, ".next", "static"), path.join(STANDALONE, ".next", "static")],
  [path.join(ROOT, "public"), path.join(STANDALONE, "public")],
];

for (const [from, to] of copies) {
  if (!(await exists(from))) {
    console.warn(`postbuild: se saltea ${path.relative(ROOT, from)} (no existe)`);
    continue;
  }
  await cp(from, to, { recursive: true });
  console.log(`postbuild: ${path.relative(ROOT, from)} → ${path.relative(ROOT, to)}`);
}
