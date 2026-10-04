import type { Metadata } from "next";
import { Outfit, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "TAMP — Más que una web, una herramienta",
  description:
    "Estudio de desarrollo y automatización web. Construimos sitios a medida y automatizamos los procesos que mueven tu negocio — para pymes y empresas consolidadas.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${outfit.variable} ${geist.variable} ${geistMono.variable}`}
    >
      <body className="font-sans antialiased grain">{children}</body>
    </html>
  );
}
