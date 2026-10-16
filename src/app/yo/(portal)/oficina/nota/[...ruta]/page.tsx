import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Link2 } from "lucide-react";
import { fechaHoy } from "@/lib/yo/fecha";
import { cargarNota, cargarVault, fechaCorta } from "@/lib/yo/oficina";
import { directorioDeRuta, hrefNota, segmentosATexto, type ValorMeta } from "@/lib/yo/vault";
import ContenidoNota from "../../ContenidoNota";
import { Chip, Migas } from "../../piezas";

export async function generateMetadata({ params }: PageProps<"/yo/oficina/nota/[...ruta]">) {
  return { title: segmentosATexto((await params).ruta).split("/").pop() };
}

// Propiedades que ya se muestran como chips (o no aportan) y no van al panel.
const OCULTAS = new Set(["tags", "tag", "tipo", "estado", "aliases", "cssclasses"]);

function mostrarValor(clave: string, v: ValorMeta, moneda: string | null): string {
  if (v === null || v === "") return "—";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (typeof v === "number") {
    const esDinero = moneda === "CLP" && /monto|saldo|cuota(?!s)|precio|valor|total/i.test(clave);
    return esDinero
      ? new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(v)
      : v.toLocaleString("es-CL");
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return fechaCorta(v);
  return v;
}

const etiquetaClave = (k: string) => (k.charAt(0).toUpperCase() + k.slice(1)).replace(/_/g, " ");

export default async function Nota({ params }: PageProps<"/yo/oficina/nota/[...ruta]">) {
  const ruta = `${segmentosATexto((await params).ruta)}.md`;
  const [nota, notas] = await Promise.all([cargarNota(ruta), cargarVault()]);
  if (!nota) notFound();

  const tipo = typeof nota.meta.tipo === "string" ? nota.meta.tipo : null;
  const estado = typeof nota.meta.estado === "string" ? nota.meta.estado : null;
  const moneda = typeof nota.meta.moneda === "string" ? nota.meta.moneda : null;
  const propiedades = Object.entries(nota.meta).filter(([k]) => !OCULTAS.has(k));

  const porRuta = new Map(notas.map((n) => [n.ruta, n]));
  const salientes = nota.enlaces.map((r) => porRuta.get(r)).filter((n) => n !== undefined);
  const entrantes = notas.filter((n) => n.enlaces.includes(nota.ruta));

  const dir = directorioDeRuta(nota.ruta);
  const tieneTitulo = /^#\s/.test(nota.contenido.trimStart());
  const obsidian = `obsidian://open?vault=${encodeURIComponent("Obsidian Vault")}&file=${encodeURIComponent(nota.ruta.replace(/\.md$/, ""))}`;

  return (
    <>
      <Migas ruta={[...(dir ? dir.split("/") : []), nota.titulo]} />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {tipo && <Chip>{tipo}</Chip>}
        {estado && <Chip estado={estado}>{estado}</Chip>}
        {nota.etiquetas.slice(0, 8).map((t) => (
          <Chip key={t}>#{t}</Chip>
        ))}
        <span className="text-xs text-slate-500">{nota.modificado ? `Editada ${fechaCorta(nota.modificado)}` : ""}</span>
        <a href={obsidian} className="ml-auto inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white" title="Abre la nota en Obsidian (en este computador)">
          Abrir en Obsidian <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <article className="min-w-0 rounded-3xl border border-white/10 bg-[#0b0d22]/70 px-5 py-6 backdrop-blur md:px-9 md:py-8">
          {!tieneTitulo && <h1 className="mb-4 font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">{nota.titulo}</h1>}
          <ContenidoNota cuerpo={nota.contenido} actual={nota} notas={notas} hoy={fechaHoy()} />
        </article>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {propiedades.length > 0 && (
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
              <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-indigo-200/70">Propiedades</h2>
              <dl className="space-y-2 text-sm">
                {propiedades.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-slate-500">{etiquetaClave(k)}</dt>
                    <dd className="text-right text-slate-200">{mostrarValor(k, v, moneda)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <ListaEnlaces titulo="Enlaza a" notas={salientes} />
          <ListaEnlaces titulo="Mencionada en" notas={entrantes} />
        </aside>
      </div>
    </>
  );
}

function ListaEnlaces({ titulo, notas }: { titulo: string; notas: { ruta: string; titulo: string }[] }) {
  if (!notas.length) return null;
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
      <h2 className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-indigo-200/70">
        <Link2 className="h-3.5 w-3.5" /> {titulo} <span className="text-slate-500">{notas.length}</span>
      </h2>
      <ul className="space-y-1.5 text-sm">
        {notas.map((n) => (
          <li key={n.ruta}>
            <Link href={hrefNota(n.ruta)} className="text-slate-300 hover:text-white">
              {n.titulo}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
