import Link from "next/link";
import type { ReactNode } from "react";
import type { Tono } from "@/lib/admin/formato";

// Piezas visuales del panel. Mismo sistema que tamp.cl: tinta cálida, acento
// índigo, Outfit para títulos.

const TONOS: Record<Tono, string> = {
  azul: "bg-indigo-50 text-indigo-700 ring-indigo-600/15",
  ambar: "bg-amber-50 text-amber-800 ring-amber-600/20",
  verde: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  rojo: "bg-rose-50 text-rose-700 ring-rose-600/20",
  gris: "bg-ink-100 text-ink-500 ring-ink-900/5",
  tinta: "bg-ink-900 text-ink-50 ring-ink-900",
};

export function Insignia({ tono, children }: { tono: Tono; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONOS[tono]}`}>
      {children}
    </span>
  );
}

export function Encabezado({
  titulo,
  bajada,
  volver,
  accion,
}: {
  titulo: ReactNode;
  bajada?: ReactNode;
  volver?: { href: string; texto: string };
  accion?: ReactNode;
}) {
  return (
    <header className="mb-8">
      {volver && (
        <Link href={volver.href} className="mb-3 inline-block text-sm text-ink-400 transition-colors hover:text-ink-900">
          ← {volver.texto}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{titulo}</h1>
          {bajada && <p className="mt-2 text-ink-500">{bajada}</p>}
        </div>
        {accion}
      </div>
    </header>
  );
}

export function Tarjeta({ titulo, accion, children, className = "" }: { titulo?: ReactNode; accion?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgba(11,11,12,0.04)] md:p-6 ${className}`}>
      {(titulo || accion) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {titulo && <h2 className="font-display text-lg font-semibold tracking-tight">{titulo}</h2>}
          {accion}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ etiqueta, valor, nota, href }: { etiqueta: string; valor: ReactNode; nota?: ReactNode; href?: string }) {
  const contenido = (
    <>
      <p className="label">{etiqueta}</p>
      <p className="mt-3 font-display text-3xl font-semibold tracking-tight">{valor}</p>
      {nota && <p className="mt-1 text-sm text-ink-400">{nota}</p>}
    </>
  );
  const clase = "block rounded-3xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgba(11,11,12,0.04)]";
  return href ? (
    <Link href={href} className={`${clase} transition-colors hover:border-black/15`}>
      {contenido}
    </Link>
  ) : (
    <div className={clase}>{contenido}</div>
  );
}

/** Nota del diagnóstico (0–100) con el mismo semáforo que ve el prospecto. */
export function Nota({ valor, grande = false }: { valor: number; grande?: boolean }) {
  const color = valor >= 80 ? "bg-emerald-50 text-emerald-700" : valor >= 50 ? "bg-amber-50 text-amber-800" : "bg-rose-50 text-rose-700";
  const tam = grande ? "h-16 w-16 text-2xl rounded-2xl" : "h-11 w-11 text-lg rounded-xl";
  return <span className={`grid shrink-0 place-items-center font-display font-semibold ${tam} ${color}`}>{valor}</span>;
}

export function Vacio({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-black/10 px-5 py-8 text-center text-sm text-ink-400">{children}</p>;
}

export function BotonLink({ href, children, variante = "primario" }: { href: string; children: ReactNode; variante?: "primario" | "secundario" }) {
  const estilos =
    variante === "primario"
      ? "bg-ink-900 text-ink-50 hover:bg-ink-700"
      : "border border-black/10 bg-white text-ink-900 hover:border-black/25";
  return (
    <Link href={href} className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${estilos}`}>
      {children}
    </Link>
  );
}

/** Fila "etiqueta: valor" para fichas de detalle. */
export function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-3 py-2 text-sm">
      <dt className="text-ink-400">{etiqueta}</dt>
      <dd className="min-w-0 break-words text-ink-800">{children}</dd>
    </div>
  );
}

// ------------------------------------------------------------- formularios

const CAMPO =
  "w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-300 focus:border-ink-900";

type BaseCampo = { nombre: string; etiqueta: string; ayuda?: string; className?: string };

export function Campo({
  nombre,
  etiqueta,
  ayuda,
  className = "",
  ...input
}: BaseCampo & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name">) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium text-ink-500">{etiqueta}</span>
      <input name={nombre} className={CAMPO} {...input} />
      {ayuda && <span className="mt-1 block text-xs text-ink-400">{ayuda}</span>}
    </label>
  );
}

export function AreaTexto({
  nombre,
  etiqueta,
  ayuda,
  className = "",
  ...area
}: BaseCampo & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "name">) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium text-ink-500">{etiqueta}</span>
      <textarea name={nombre} rows={4} className={`${CAMPO} resize-y`} {...area} />
      {ayuda && <span className="mt-1 block text-xs text-ink-400">{ayuda}</span>}
    </label>
  );
}

export function Selector({
  nombre,
  etiqueta,
  opciones,
  ayuda,
  className = "",
  conVacio,
  ...select
}: BaseCampo & {
  opciones: Record<string, { etiqueta: string }> | [string, string][];
  conVacio?: string;
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "name">) {
  const pares = Array.isArray(opciones) ? opciones : Object.entries(opciones).map(([v, o]) => [v, o.etiqueta] as [string, string]);
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium text-ink-500">{etiqueta}</span>
      <select name={nombre} className={CAMPO} {...select}>
        {conVacio !== undefined && <option value="">{conVacio}</option>}
        {pares.map(([valor, texto]) => (
          <option key={valor} value={valor}>
            {texto}
          </option>
        ))}
      </select>
      {ayuda && <span className="mt-1 block text-xs text-ink-400">{ayuda}</span>}
    </label>
  );
}
