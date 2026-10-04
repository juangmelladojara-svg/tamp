import type { Metadata } from "next";
import { Outfit, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import JsonLd from "@/components/JsonLd";
import { NEGOCIO, SITE_URL, negocioJsonLd, sitioWebJsonLd } from "@/lib/site";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const TITULO = "TAMP | Desarrollo web a medida y automatización para pymes en Chile";

export const metadata: Metadata = {
  // metadataBase hace que Next resuelva solo las URLs absolutas de canonical y
  // Open Graph. Sin esto, los motores de respuesta no saben citar la página.
  metadataBase: new URL(SITE_URL),
  // Formato «qué hace + dónde»: es lo que se cita. El eslogan queda en el H1.
  title: {
    default: TITULO,
    template: "%s | TAMP",
  },
  description: NEGOCIO.descripcion,
  applicationName: NEGOCIO.nombre,
  authors: [{ name: NEGOCIO.nombre, url: SITE_URL }],
  creator: NEGOCIO.nombre,
  publisher: NEGOCIO.nombre,
  alternates: { canonical: "/" },
  // La imagen la genera src/app/opengraph-image.tsx y Next la enlaza sola.
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: SITE_URL,
    siteName: NEGOCIO.nombre,
    title: TITULO,
    description: NEGOCIO.descripcion,
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: NEGOCIO.descripcion,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      // Sin límite de fragmento: permite que Google cite párrafos completos
      // en AI Overviews en vez de recortar a dos líneas.
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  category: "Desarrollo web y automatización",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es-CL"
      className={`${outfit.variable} ${geist.variable} ${geistMono.variable}`}
    >
      <body className="font-sans antialiased grain">
        {children}
        {/* Identidad del negocio y del sitio, legible por máquinas. */}
        <JsonLd data={negocioJsonLd()} />
        <JsonLd data={sitioWebJsonLd()} />
      </body>
    </html>
  );
}
