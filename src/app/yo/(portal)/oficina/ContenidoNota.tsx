import Link from "next/link";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles } from "lucide-react";
import { ejecutarDataview, valorEnLinea, type FilaDV } from "@/lib/yo/dataview";
import { destinoEnlace, hrefNota, normalizar, textoPlano } from "@/lib/yo/vault";

// Cuerpo de una nota del vault, renderizado como en Obsidian (lo que se pueda):
// Markdown + GFM, [[wikilinks]] a la oficina, `= this.campo` con su valor y los
// bloques ```dataview``` ejecutados sobre las notas sincronizadas.

const SIN_NOTA = "#sin-nota";

const componentes: Components = {
  h1: (p) => <h1 className="mb-4 mt-2 font-display text-3xl font-semibold tracking-tight text-white md:text-4xl" {...p} />,
  h2: (p) => <h2 className="mb-3 mt-10 font-display text-xl font-semibold text-white md:text-2xl" {...p} />,
  h3: (p) => <h3 className="mb-2 mt-7 text-lg font-semibold text-slate-100" {...p} />,
  h4: (p) => <h4 className="mb-2 mt-5 font-semibold text-slate-200" {...p} />,
  p: (p) => <p className="my-3 leading-relaxed text-slate-300" {...p} />,
  ul: ({ className, ...p }) => (
    <ul className={`my-3 space-y-1.5 pl-5 text-slate-300 ${className?.includes("contains-task-list") ? "list-none pl-1" : "list-disc marker:text-indigo-300/60"}`} {...p} />
  ),
  ol: (p) => <ol className="my-3 list-decimal space-y-1.5 pl-5 text-slate-300 marker:text-indigo-300/60" {...p} />,
  li: ({ className, ...p }) => <li className={`leading-relaxed ${className?.includes("task-list-item") ? "flex items-start gap-2" : ""}`} {...p} />,
  input: (p) => <input {...p} disabled className="mt-1.5 h-4 w-4 shrink-0 accent-sky-400" />,
  blockquote: (p) => <blockquote className="my-4 rounded-r-xl border-l-2 border-indigo-300/50 bg-white/[0.03] px-4 py-1 text-slate-300" {...p} />,
  hr: () => <hr className="my-8 border-white/10" />,
  strong: (p) => <strong className="font-semibold text-white" {...p} />,
  em: (p) => <em className="text-slate-200" {...p} />,
  code: (p) => <code className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em] text-indigo-100" {...p} />,
  pre: (p) => <pre className="my-4 overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-4 text-sm [&_code]:bg-transparent [&_code]:p-0" {...p} />,
  table: (p) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-left text-sm" {...p} />
    </div>
  ),
  th: (p) => <th className="border-b border-white/10 bg-white/5 px-3 py-2 font-medium text-slate-200" {...p} />,
  td: (p) => <td className="border-b border-white/5 px-3 py-2 text-slate-300" {...p} />,
  a: ({ href = "", children }) => {
    if (href === SIN_NOTA) return <span className="text-slate-400 underline decoration-dashed decoration-slate-500 underline-offset-4" title="Esta nota aún no existe">{children}</span>;
    if (href.startsWith("/")) return <Link href={href} className="text-indigo-300 underline decoration-indigo-300/30 underline-offset-4 hover:decoration-indigo-300">{children}</Link>;
    return <a href={href} target="_blank" rel="noopener noreferrer" className="text-sky-300 underline decoration-sky-300/30 underline-offset-4 hover:decoration-sky-300">{children}</a>;
  },
  img: ({ alt }) => <span className="text-sm text-slate-500">🖼 {alt || "imagen"} (solo en Obsidian)</span>,
};

const escaparTexto = (s: string) => s.replace(/([\\[\]*_`])/g, "\\$1");

/** Convierte la sintaxis propia de Obsidian a Markdown estándar. */
function prepararMarkdown(cuerpo: string, porTitulo: Map<string, string>, actual: FilaDV, hoy: string): string {
  return (
    cuerpo
      // Campos en línea de Dataview: `= this.saldo_actual`
      .replace(/`=\s*([^`]+)`/g, (_, expr: string) => escaparTexto(valorEnLinea(expr, actual, hoy)))
      // Incrustaciones ![[...]]: los adjuntos no se suben; si es una nota, se enlaza.
      .replace(/!\[\[([^\]]+)\]\]/g, (_, crudo: string) => {
        const ruta = porTitulo.get(normalizar(destinoEnlace(crudo)));
        return ruta ? `[↪ ${escaparTexto(destinoEnlace(crudo))}](<${hrefNota(ruta)}>)` : `*📎 ${escaparTexto(crudo.split("|")[0])} (adjunto, solo en Obsidian)*`;
      })
      // [[Nota|alias]] y [[Nota#sección]]
      .replace(/\[\[([^\]]+)\]\]/g, (_, crudo: string) => {
        const [destino, alias] = crudo.split("|");
        const texto = escaparTexto((alias ?? destino.split("/").pop()!.replace(/#/, " › ")).trim());
        const ruta = porTitulo.get(normalizar(destinoEnlace(crudo)));
        return `[${texto}](<${ruta ? hrefNota(ruta) : SIN_NOTA}>)`;
      })
      // ==resaltado== → negrita (sin HTML crudo)
      .replace(/==([^=\n]+)==/g, "**$1**")
  );
}

function VistaDataview({ consulta, notas, actual, hoy }: { consulta: string; notas: FilaDV[]; actual: FilaDV; hoy: string }) {
  const r = ejecutarDataview(consulta, notas, actual, hoy);
  const enlace = (n: FilaDV) => (
    <Link href={hrefNota(n.ruta)} className="text-indigo-300 underline decoration-indigo-300/30 underline-offset-4 hover:decoration-indigo-300">
      {n.titulo}
    </Link>
  );

  let cuerpo: React.ReactNode;
  if (r.tipo === "no-soportada") {
    cuerpo = <p className="text-sm text-slate-500">{r.motivo}</p>;
  } else if (r.tipo === "tabla") {
    cuerpo = r.filas.length ? (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {r.columnas.map((c) => (
                <th key={c} className="border-b border-white/10 px-3 py-2 font-medium text-slate-200">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {r.filas.map((fila, i) => (
              <tr key={i}>
                {fila.map((c, j) => (
                  <td key={j} className="border-b border-white/5 px-3 py-2 text-slate-300">{typeof c === "string" ? c : enlace(c.nota)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="px-3 text-sm text-slate-500">Sin resultados.</p>
    );
  } else if (r.tipo === "lista") {
    cuerpo = r.notas.length ? (
      <ul className="list-disc space-y-1 pl-8 text-sm marker:text-indigo-300/60">
        {r.notas.map((n) => <li key={n.ruta}>{enlace(n)}</li>)}
      </ul>
    ) : (
      <p className="px-3 text-sm text-slate-500">Sin resultados.</p>
    );
  } else {
    cuerpo = r.grupos.length ? (
      <div className="space-y-3 px-3">
        {r.grupos.map((g) => (
          <div key={g.nota.ruta}>
            <p className="text-sm font-medium">{enlace(g.nota)}</p>
            <ul className="mt-1 space-y-1">
              {g.tareas.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded border border-slate-500" />
                  <span>
                    {textoPlano(t.texto)}
                    {t.fecha && <span className="ml-2 text-xs text-amber-200/80">📅 {t.fecha}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    ) : (
      <p className="px-3 text-sm text-slate-500">Sin tareas pendientes.</p>
    );
  }

  return (
    <figure className="my-5 rounded-2xl border border-indigo-300/15 bg-indigo-400/[0.04] py-3">
      {cuerpo}
      {"aproximada" in r && r.aproximada && (
        <figcaption className="mt-2 px-3 text-xs text-slate-500">Vista aproximada: parte de la consulta solo la entiende Obsidian.</figcaption>
      )}
    </figure>
  );
}

export default function ContenidoNota({
  cuerpo,
  actual,
  notas,
  hoy,
}: {
  cuerpo: string;
  actual: FilaDV;
  notas: FilaDV[];
  hoy: string;
}) {
  const porTitulo = new Map(notas.map((n) => [normalizar(n.titulo), n.ruta]));

  // Se parte el cuerpo en tramos de Markdown y bloques de Dataview.
  const tramos: ({ tipo: "md"; texto: string } | { tipo: "dv"; consulta: string } | { tipo: "js" })[] = [];
  let ultimo = 0;
  for (const m of cuerpo.matchAll(/^```(dataviewjs|dataview)[ \t]*\n([\s\S]*?)^```[ \t]*$/gm)) {
    tramos.push({ tipo: "md", texto: cuerpo.slice(ultimo, m.index) });
    tramos.push(m[1] === "dataview" ? { tipo: "dv", consulta: m[2] } : { tipo: "js" });
    ultimo = m.index! + m[0].length;
  }
  tramos.push({ tipo: "md", texto: cuerpo.slice(ultimo) });

  return (
    <div>
      {tramos.map((t, i) => {
        if (t.tipo === "dv") return <VistaDataview key={i} consulta={t.consulta} notas={notas} actual={actual} hoy={hoy} />;
        if (t.tipo === "js")
          return (
            <p key={i} className="my-4 flex items-center gap-2 text-sm text-slate-500">
              <Sparkles className="h-4 w-4" strokeWidth={1.5} /> Vista con código (dataviewjs): solo se ve en Obsidian.
            </p>
          );
        return t.texto.trim() ? (
          <Markdown key={i} remarkPlugins={[remarkGfm]} components={componentes}>
            {prepararMarkdown(t.texto, porTitulo, actual, hoy)}
          </Markdown>
        ) : null;
      })}
    </div>
  );
}
