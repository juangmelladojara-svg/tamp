import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { NEGOCIO, SITE_URL } from "@/lib/site";
import Diagnostico from "./Diagnostico";

const TITULO = "Diagnóstico web gratis: ¿te encuentran Google y la IA?";
const DESCRIPCION =
  "Analiza gratis tu sitio web en segundos: si ChatGPT y Google pueden encontrarte, cómo se ve en celular y qué tan seguro y rápido es. Con recomendaciones claras para pymes.";

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRIPCION,
  alternates: { canonical: "/diagnostico" },
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: `${SITE_URL}/diagnostico`,
    siteName: NEGOCIO.nombre,
    title: TITULO,
    description: DESCRIPCION,
  },
};

const herramientaJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Diagnóstico TAMP",
  url: `${SITE_URL}/diagnostico`,
  description: DESCRIPCION,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  inLanguage: "es-CL",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "CLP" },
  provider: { "@id": `${SITE_URL}/#negocio` },
};

export default function PaginaDiagnostico() {
  return (
    <>
      <Diagnostico />
      <JsonLd data={herramientaJsonLd} />
    </>
  );
}
