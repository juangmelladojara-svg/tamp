/**
 * Inyecta un bloque JSON-LD (schema.org) en el HTML.
 *
 * Va en el markup servido desde el servidor, no por JavaScript: la mayoría de
 * los rastreadores de motores de respuesta (GPTBot, ClaudeBot, PerplexityBot)
 * no ejecutan JS, así que el dato tiene que venir ya en el HTML.
 */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // El contenido es nuestro, no viene de usuarios. Igual se escapa "<" para
      // que ningún texto pueda cerrar el <script> antes de tiempo.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
