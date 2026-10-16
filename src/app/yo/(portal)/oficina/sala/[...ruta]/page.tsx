import Link from "next/link";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { cargarVault, nombreSala } from "@/lib/yo/oficina";
import { colorCarpeta } from "@/lib/yo/colores";
import { directorioDeRuta, hrefNota, RAIZ, segmentosATexto } from "@/lib/yo/vault";
import { FilaNota, Migas, Panel, TarjetaSala } from "../../piezas";

export async function generateMetadata({ params }: PageProps<"/yo/oficina/sala/[...ruta]">) {
  const dir = segmentosATexto((await params).ruta);
  return { title: nombreSala(dir.split("/").pop()!) };
}

// Sin emojis ni prefijo numérico, para reconocer la nota principal de una sala
// ("04 - Finanzas" → "Finanzas.md"; "Préstamos" → "💳 Préstamos.md").
const llave = (s: string) =>
  nombreSala(s)
    .replace(/[\p{Extended_Pictographic}️]/gu, "")
    .trim()
    .toLowerCase();

export default async function Sala({ params }: PageProps<"/yo/oficina/sala/[...ruta]">) {
  const pedido = segmentosATexto((await params).ruta);
  const dir = pedido === RAIZ ? "" : pedido;
  const notas = await cargarVault();

  const directas = notas.filter((n) => directorioDeRuta(n.ruta) === dir);
  // La "sala" raíz son solo las notas sueltas en la raíz del vault.
  const dentro = dir ? notas.filter((n) => n.ruta.startsWith(`${dir}/`)) : directas;
  if (!directas.length && !dentro.length) notFound();

  // Subcarpetas inmediatas, con cuántas notas tienen (en cualquier nivel).
  const sub = new Map<string, number>();
  if (dir) {
    for (const n of dentro) {
      const resto = n.ruta.slice(dir.length + 1).split("/");
      if (resto.length > 1) sub.set(`${dir}/${resto[0]}`, (sub.get(`${dir}/${resto[0]}`) ?? 0) + 1);
    }
  }

  const nombre = dir ? dir.split("/").pop()! : RAIZ;
  const principal = directas.find((n) => llave(n.titulo) === llave(nombre));
  const sonFechas = directas.length > 0 && directas.every((n) => /^\d{4}-\d{2}-\d{2}$/.test(n.titulo) || n === principal);
  const lista = directas
    .filter((n) => n !== principal)
    .sort((a, b) => (sonFechas ? b.titulo.localeCompare(a.titulo) : a.titulo.localeCompare(b.titulo, "es")));
  const color = colorCarpeta(dir.split("/")[0] || RAIZ);

  return (
    <>
      <Migas ruta={dir ? dir.split("/") : [RAIZ]} />
      <h1 className="mt-4 flex items-center gap-3 font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">
        <span className="h-3 w-3 rounded-full" style={{ background: color, boxShadow: `0 0 16px ${color}` }} />
        {dir ? nombreSala(nombre) : "Raíz del vault"}
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        {dentro.length} nota{dentro.length === 1 ? "" : "s"}
        {sub.size ? ` · ${sub.size} subcarpeta${sub.size === 1 ? "" : "s"}` : ""}
      </p>

      {principal && (
        <Link
          href={hrefNota(principal.ruta)}
          className="mt-8 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur transition-colors hover:bg-white/[0.07]"
        >
          <Star className="h-6 w-6 shrink-0" style={{ color }} strokeWidth={1.5} />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Nota principal de la sala</p>
            <p className="truncate text-lg font-semibold text-white">{principal.titulo}</p>
          </div>
        </Link>
      )}

      {sub.size > 0 && (
        <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[...sub].sort(([a], [b]) => a.localeCompare(b, "es")).map(([d, total]) => (
            <TarjetaSala key={d} dir={d} notas={total} />
          ))}
        </section>
      )}

      {lista.length > 0 && (
        <div className="mt-8">
          <Panel titulo="Notas">
            <div className="divide-y divide-white/5">
              {lista.map((n) => (
                <FilaNota key={n.ruta} n={n} />
              ))}
            </div>
          </Panel>
        </div>
      )}
    </>
  );
}
