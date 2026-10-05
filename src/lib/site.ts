// ---------------------------------------------------------------------------
// AEO (Answer Engine Optimization) — fuente única de verdad del negocio.
//
// Todo lo que leen los motores de respuesta (ChatGPT, Perplexity, Claude,
// Google AI Overviews) sale de aquí: metadatos, JSON-LD y /llms.txt.
// Si cambia un dato del negocio, se cambia acá y se propaga solo.
// ---------------------------------------------------------------------------

import { faqs, servicios } from "./contenido";

/**
 * URL pública del sitio: el dominio propio tamp.cl (registrado en NIC Chile,
 * DNS en Vercel). NEXT_PUBLIC_SITE_URL permite sobrescribirla si hiciera falta.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://tamp.cl";

export const WHATSAPP_NUMBER = "56938940094";
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hola, quiero conversar sobre un proyecto con TAMP."
)}`;

export const NEGOCIO = {
  nombre: "TAMP",
  eslogan: "Más que una web, una herramienta.",
  descripcion:
    "Estudio de desarrollo y automatización web. Construimos sitios a medida y automatizamos los procesos que mueven tu negocio — para pymes y empresas consolidadas.",
  email: "jmellado@tamp.cl",
  telefono: "+56938940094",
  telefonoVisible: "+56 9 3894 0094",
  whatsapp: WHATSAPP_LINK,
  horario: {
    texto: "Lun a Vie, 9:00–18:00",
    dias: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    abre: "09:00",
    cierra: "18:00",
  },
  // TODO(TAMP): completar ciudad y región para competir en búsquedas locales
  // ("desarrollo web en <ciudad>"). Mientras estén vacías, el JSON-LD las omite.
  // No inventar: dejar vacío hasta tener el dato real.
  ciudad: "",
  region: "",
  pais: "CL",
  idioma: "es-CL",
  moneda: "CLP",
  // Sin `rangoPrecios`: el sitio no publica precios y no se inventan.
  // TODO(TAMP): agregar perfiles oficiales (Google Business, LinkedIn,
  // Instagram, GitHub). Refuerzan la identidad de la entidad ante los motores.
  sameAs: [] as string[],
};

// ---------------------------------------------------------------------------
// JSON-LD (schema.org)
// ---------------------------------------------------------------------------

const ID_NEGOCIO = `${SITE_URL}/#negocio`;
const CHILE = { "@type": "Country", name: "Chile" } as const;

/** La entidad: quién es, qué hace, cuándo atiende y cómo contactarla. */
export function negocioJsonLd() {
  const horario = {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: NEGOCIO.horario.dias,
    opens: NEGOCIO.horario.abre,
    closes: NEGOCIO.horario.cierra,
  };

  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": ID_NEGOCIO,
    name: NEGOCIO.nombre,
    slogan: NEGOCIO.eslogan,
    description: NEGOCIO.descripcion,
    url: SITE_URL,
    // Generadas por src/app/apple-icon.tsx y src/app/opengraph-image.tsx.
    logo: `${SITE_URL}/apple-icon`,
    image: `${SITE_URL}/opengraph-image`,
    email: NEGOCIO.email,
    telephone: NEGOCIO.telefono,
    currenciesAccepted: NEGOCIO.moneda,
    areaServed: CHILE,
    availableLanguage: "es",
    address: {
      "@type": "PostalAddress",
      addressCountry: NEGOCIO.pais,
      ...(NEGOCIO.ciudad ? { addressLocality: NEGOCIO.ciudad } : {}),
      ...(NEGOCIO.region ? { addressRegion: NEGOCIO.region } : {}),
    },
    openingHoursSpecification: [horario],
    ...(NEGOCIO.sameAs.length ? { sameAs: NEGOCIO.sameAs } : {}),
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: NEGOCIO.telefono,
        email: NEGOCIO.email,
        url: NEGOCIO.whatsapp,
        availableLanguage: ["es"],
        areaServed: NEGOCIO.pais,
        hoursAvailable: horario,
      },
    ],
    knowsAbout: [
      ...servicios.map((s) => s.titulo),
      "Next.js",
      "React",
      "n8n",
      "Automatización de procesos para pymes",
    ],
    // Sin precios: el sitio no los publica, así que las ofertas no llevan `price`.
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Servicios de TAMP",
      itemListElement: servicios.map((s) => ({
        "@type": "Offer",
        url: `${SITE_URL}/#servicios`,
        itemOffered: {
          "@type": "Service",
          name: s.titulo,
          description: s.desc,
          provider: { "@id": ID_NEGOCIO },
          areaServed: CHILE,
        },
      })),
    },
  };
}

/** El sitio como obra: ayuda a que el nombre del sitio se muestre bien en resultados. */
export function sitioWebJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#sitio`,
    url: SITE_URL,
    name: NEGOCIO.nombre,
    description: NEGOCIO.descripcion,
    inLanguage: NEGOCIO.idioma,
    publisher: { "@id": ID_NEGOCIO },
  };
}

/** Preguntas frecuentes: el formato que los motores de respuesta citan directo. */
export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faq`,
    inLanguage: NEGOCIO.idioma,
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.pregunta,
      acceptedAnswer: { "@type": "Answer", text: f.respuesta },
    })),
  };
}
