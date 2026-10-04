import { Plus, Minus } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import { faqs } from "@/lib/contenido";
import { faqJsonLd } from "@/lib/site";

const STROKE = 1.25;

/**
 * Preguntas frecuentes.
 *
 * Es la pieza central del AEO: un motor de respuesta cita mucho mejor un bloque
 * "pregunta → respuesta completa" que un párrafo de marketing, y el texto tiene
 * que ir en el HTML, no detrás de JavaScript.
 *
 * Se usa <details> nativo: acordeón sin estado de React, accesible y con las
 * respuestas presentes en el HTML prerenderizado aunque estén cerradas. La
 * apertura animada vive en globals.css (.faq-item) y es mejora progresiva.
 *
 * Mantiene el diseño del acordeón anterior: mismas clases, ícono +/− en
 * círculo, el primer ítem abierto y uno abierto a la vez.
 */
export default function FaqSection() {
  return (
    <section id="faq" className="px-5 py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
        <div>
          <p className="label mb-4">Preguntas</p>
          <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Lo que suelen preguntarnos.
          </h2>
        </div>
        <div className="flex flex-col">
          {faqs.map((f, i) => (
            <details
              key={f.pregunta}
              // Mismo `name` en todos: acordeón exclusivo nativo (abrir una cierra
              // la otra), igual que el comportamiento anterior, sin JavaScript.
              name="faq"
              open={i === 0}
              className="faq-item group border-t border-black/8 last:border-b"
            >
              <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-6 py-6 text-left [&::-webkit-details-marker]:hidden">
                <h3 className="font-display text-lg font-medium tracking-tight md:text-xl">
                  {f.pregunta}
                </h3>
                <span
                  aria-hidden
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-black/10"
                >
                  <Plus className="h-4 w-4 group-open:hidden" strokeWidth={STROKE} />
                  <Minus className="hidden h-4 w-4 group-open:block" strokeWidth={STROKE} />
                </span>
              </summary>
              <p className="max-w-xl pb-6 text-ink-500">{f.respuesta}</p>
            </details>
          ))}
        </div>
      </div>

      {/* Mismas preguntas y respuestas, en formato schema.org. */}
      <JsonLd data={faqJsonLd()} />
    </section>
  );
}
