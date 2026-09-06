import type { Metadata, Viewport } from "next";
import { Archivo, Instrument_Serif, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// DISPLAY — Archivo (variable, eje de ancho 62–125; uso expandido 125)
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  axes: ["wdth"],
  display: "swap",
});

// EDITORIAL — Instrument Serif (400 + italic), voz narrativa
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

// SYSTEM — IBM Plex Mono, precisión de catálogo
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0A0A0B",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://bardos.barber"),
  title: {
    default: "BARDOS — Barbería · San Martín de los Andes",
    template: "%s — BARDOS",
  },
  description:
    "El corte como acto de edición. Bardos no es una barbería: es una película editorial sobre identidad, estilo y oficio. Reservá tu sesión en San Martín de los Andes, Patagonia.",
  keywords: [
    "barbería San Martín de los Andes",
    "barbería Neuquén Patagonia",
    "corte de pelo hombre",
    "barba navaja",
    "Bardos",
  ],
  openGraph: {
    title: "BARDOS — BARBER. San Martín de los Andes.",
    description:
      "Una barbería editada como una película. Elegí tu servicio y tu hora. CORTÁ EL RUIDO.",
    type: "website",
    locale: "es_AR",
    siteName: "BARDOS",
    images: [{ url: "/images/og-cover.webp", width: 1344, height: 768 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BARDOS — BARBER. San Martín de los Andes.",
    description: "El corte como acto de edición. Reservá tu sesión.",
  },
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR" suppressHydrationWarning>
      <body
        className={`${archivo.variable} ${instrument.variable} ${plexMono.variable} antialiased bg-black text-chalk`}
      >
        {children}
      </body>
    </html>
  );
}
