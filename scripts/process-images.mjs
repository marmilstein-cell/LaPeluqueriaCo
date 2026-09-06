// BARDOS — procesamiento fotográfico: PNG crudo → WebP + blur placeholder
// Genera: public/images/*.webp + src/lib/bardos/images-manifest.json
// Ejecutar con: bun scripts/process-images.mjs
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(process.cwd());
const RAW = path.join(ROOT, "public/images/raw");
const OUT = path.join(ROOT, "public/images");
const MANIFEST = path.join(ROOT, "src/lib/bardos/images-manifest.ts");

const files = fs.readdirSync(RAW).filter((f) => f.endsWith(".png"));
const manifest = {};
let done = 0;

for (const file of files) {
  const name = file.replace(".png", "");
  const inPath = path.join(RAW, file);
  const outPath = path.join(OUT, `${name}.webp`);
  try {
    const img = sharp(inPath);
    const meta = await img.metadata();
    await img.webp({ quality: 84, effort: 5 }).toFile(outPath);

    // blur placeholder: 10px de ancho, JPEG base64 (coincide con la estética grain)
    const blurBuf = await sharp(inPath)
      .resize({ width: 10 })
      .grayscale()
      .blur(2)
      .jpeg({ quality: 40 })
      .toBuffer();
    manifest[`/images/${name}.webp`] = {
      w: meta.width,
      h: meta.height,
      blur: `data:image/jpeg;base64,${blurBuf.toString("base64")}`,
    };
    done++;
    console.log(`✓ ${name}.webp (${meta.width}x${meta.height})`);
  } catch (e) {
    console.error(`✗ ${name}: ${e.message}`);
  }
}

fs.writeFileSync(
  MANIFEST,
  `// BARDOS — manifest de blur placeholders (generado por scripts/process-images.mjs)\n` +
    `// ${new Date().toISOString()}\n` +
    `const manifest: Record<string, { w: number; h: number; blur: string }> = ${JSON.stringify(manifest, null, 2)};\n` +
    `export default manifest;\n`
);
console.log(`\nBARDOS: ${done}/${files.length} imágenes procesadas → manifest actualizado.`);
