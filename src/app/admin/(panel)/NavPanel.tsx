"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULOS } from "@/lib/admin/modulos";

/** Menú del panel: vertical en escritorio, fila deslizable en celular. */
export default function NavPanel({ horizontal = false }: { horizontal?: boolean }) {
  // En admin.tamp.cl la ruta visible es /leads, pero el render del servidor
  // puede ver la reescrita (/admin/leads): se normaliza para comparar igual.
  const ruta = usePathname().replace(/^\/admin(?=\/|$)/, "") || "/";
  const activo = (href: string) => (href === "/" ? ruta === "/" : ruta === href || ruta.startsWith(`${href}/`));

  const grupos = [...new Set(MODULOS.map((m) => m.grupo))];

  if (horizontal) {
    return (
      <nav aria-label="Secciones" className="-mx-5 flex gap-1 overflow-x-auto px-5 pb-3">
        {MODULOS.map(({ href, titulo, icono: Icono }) => (
          <Link
            key={href}
            href={href}
            aria-current={activo(href) ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm transition-colors ${
              activo(href) ? "bg-ink-900 text-ink-50" : "text-ink-500 hover:bg-black/5"
            }`}
          >
            <Icono className="h-4 w-4" strokeWidth={1.5} />
            {titulo}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav aria-label="Secciones" className="grid gap-6">
      {grupos.map((grupo) => (
        <div key={grupo}>
          {grupos.length > 1 && <p className="label mb-2 px-3">{grupo}</p>}
          <ul className="grid gap-0.5">
            {MODULOS.filter((m) => m.grupo === grupo).map(({ href, titulo, icono: Icono }) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={activo(href) ? "page" : undefined}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
                    activo(href) ? "bg-ink-900 text-ink-50" : "text-ink-600 hover:bg-black/5"
                  }`}
                >
                  <Icono className="h-4 w-4" strokeWidth={1.5} />
                  {titulo}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
