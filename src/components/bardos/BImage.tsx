"use client";
// LaPeluqueriaCo — imagen editorial con pipeline unificado:
// next/image + manifest de blur placeholders generados con sharp.
import Image, { type ImageProps } from "next/image";
import manifest from "@/lib/bardos/images-manifest";

type ManifestEntry = { w: number; h: number; blur: string };
const images = manifest as Record<string, ManifestEntry>;

type BImageProps = Omit<ImageProps, "placeholder" | "blurDataURL"> & {
  imgClassName?: string;
};

export function BImage({
  src,
  alt,
  imgClassName,
  className,
  ...rest
}: BImageProps) {
  const key = typeof src === "string" ? src : "";
  const entry = images[key];
  return (
    <Image
      src={src}
      alt={alt}
      placeholder={entry ? "blur" : undefined}
      blurDataURL={entry?.blur}
      className={`${className ?? ""} b-img ${imgClassName ?? ""}`}
      {...rest}
    />
  );
}
