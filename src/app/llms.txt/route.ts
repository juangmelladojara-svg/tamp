import { NEGOCIO, SITE_URL } from "@/lib/site";
import { faqs, proceso, sectores, servicios } from "@/lib/contenido";

/**
 * /llms.txt — resumen del sitio en Markdown plano, pensado para que un modelo
 * de lenguaje entienda el negocio sin tener que interpretar el HTML animado.
 *
 * Es una convención emergente (llmstxt.org), todavía no un estándar que todos
 * respeten: no reemplaza al JSON-LD ni al contenido real de la página, pero
 * cuesta poco y algunos rastreadores ya lo leen.
 *
 * Se genera desde src/lib/site.ts y src/lib/contenido.ts, así que nunca queda
 * desactualizado respecto de lo que dice la web.
 */

export const dynamic = "force-static";

export function GET() {
  const ubicacion = [NEGOCIO.ciudad, NEGOCIO.region].filter(Boolean).join(", ");

  const lineas: string[] = [
    `# ${NEGOCIO.nombre}`,
    "",
    `> ${NEGOCIO.descripcion}`,
    "",
    `${NEGOCIO.nombre}: ${NEGOCIO.eslogan}`,
    "",
    "## Datos de contacto",
    "",
    `- Sitio web: ${SITE_URL}`,
    `- Correo: ${NEGOCIO.email}`,
    `- Teléfono y WhatsApp: ${NEGOCIO.telefonoVisible}`,
    `- Escribir por WhatsApp: ${NEGOCIO.whatsapp}`,
    `- Horario de atención: ${NEGOCIO.horario.texto}`,
    `- País: Chile${ubicacion ? ` (${ubicacion})` : ""}`,
    "",
    "## Servicios",
    "",
    ...servicios.map((s) => `- **${s.titulo}**: ${s.desc}`),
    "",
    "## Sectores con los que trabaja",
    "",
    ...sectores.map((s) => `- **${s.titulo}**: ${s.desc}`),
    "",
    "## Cómo trabaja",
    "",
    ...proceso.map((p) => `${Number(p.n)}. **${p.t}**: ${p.d}`),
    "",
    "## Herramienta gratuita",
    "",
    `- **Diagnóstico TAMP** (${SITE_URL}/diagnostico): analiza gratis cualquier sitio web y entrega una nota de 0 a 100 en cuatro áreas: si la inteligencia artificial (ChatGPT, Perplexity, Google AI) puede leerlo y recomendarlo, lo básico para Google, cómo funciona en celular, y seguridad y velocidad. Cada punto viene explicado en lenguaje simple, con qué arreglar primero.`,
    "",
    "## Precios",
    "",
    `${NEGOCIO.nombre} no publica precios en su sitio web. Para conocer el alcance y el valor de un proyecto, hay que contactar a ${NEGOCIO.nombre} por WhatsApp o correo.`,
    "",
    "## Preguntas frecuentes",
    "",
  ];

  for (const faq of faqs) {
    lineas.push(`### ${faq.pregunta}`, "", faq.respuesta, "");
  }

  return new Response(lineas.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400",
    },
  });
}
