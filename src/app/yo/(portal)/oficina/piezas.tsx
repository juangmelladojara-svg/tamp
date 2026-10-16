import Link from "next/link";
import { ChevronRight, FileText, Folder, ListChecks } from "lucide-react";
import { colorCarpeta } from "@/lib/yo/colores";
import { fechaCorta, nombreSala } from "@/lib/yo/oficina";
import { directorioDeRuta, hrefNota, hrefSala, RAIZ } from "@/lib/yo/vault";
import type { FilaDV } from "@/lib/yo/dataview";

// Piezas compartidas de la oficina: migas, tarjetas de sala y filas de nota.

export function Migas({ ruta }: { ruta: string[] }) {
  return (
    <nav aria-label="Ubicación" className="flex flex-wrap items-center gap-1 text-sm text-slate-400">
      <Link href="/oficina" className="hover:text-white">
        Oficina
      </Link>
      <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
      {ruta.length ? (
        <Link href="/oficina/archivo" className="hover:text-white">
          Archivo
        </Link>
      ) : (
        <span className="text-slate-200">Archivo</span>
      )}
      {ruta.map((seg, i) => {
        const dir = ruta.slice(0, i + 1).join("/");
        const ultimo = i === ruta.length - 1;
        return (
          <span key={dir} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            {ultimo ? (
              <span className="text-slate-200">{seg}</span>
            ) : (
              <Link href={hrefSala(dir)} className="hover:text-white">
                {seg}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function TarjetaSala({ dir, notas, etiqueta }: { dir: string; notas: number; etiqueta?: string }) {
  const color = colorCarpeta(dir.split("/")[0] || RAIZ);
  const nombre = etiqueta ?? nombreSala(dir.split("/").pop()!);
  return (
    <Link
      href={hrefSala(dir || RAIZ)}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
    >
      <span className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40" style={{ background: color }} />
      <Folder className="h-8 w-8" strokeWidth={1.5} style={{ color }} />
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-100">{nombre}</p>
        <p className="text-xs text-slate-500">
          {notas} nota{notas === 1 ? "" : "s"}
        </p>
      </div>
    </Link>
  );
}

const CHIP_ESTADO: Record<string, string> = {
  activo: "bg-emerald-400/15 text-emerald-200",
  "en curso": "bg-emerald-400/15 text-emerald-200",
  pausado: "bg-amber-400/15 text-amber-200",
  "en pausa": "bg-amber-400/15 text-amber-200",
  completado: "bg-sky-400/15 text-sky-200",
  terminado: "bg-sky-400/15 text-sky-200",
  pagado: "bg-sky-400/15 text-sky-200",
  archivado: "bg-slate-400/15 text-slate-300",
  idea: "bg-fuchsia-400/15 text-fuchsia-200",
};

export function Chip({ children, estado }: { children: React.ReactNode; estado?: string }) {
  const cls = (estado && CHIP_ESTADO[estado.toLowerCase()]) ?? "bg-white/5 text-slate-400";
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${cls}`}>{children}</span>;
}

export function FilaNota({ n, mostrarCarpeta = false }: { n: FilaDV; mostrarCarpeta?: boolean }) {
  const tipo = typeof n.meta.tipo === "string" ? n.meta.tipo : null;
  const estado = typeof n.meta.estado === "string" ? n.meta.estado : null;
  return (
    <Link href={hrefNota(n.ruta)} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.04]">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5 text-slate-400">
        <FileText className="h-4 w-4" strokeWidth={1.5} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-100">{n.titulo}</p>
        <p className="truncate text-xs text-slate-500">
          {mostrarCarpeta ? `${directorioDeRuta(n.ruta) || RAIZ} · ` : ""}
          {n.modificado ? `Editada ${fechaCorta(n.modificado)}` : "Sin fecha"}
        </p>
      </div>
      <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
        {n.tareas.length > 0 && (
          <Chip>
            <ListChecks className="mr-1 h-3 w-3" /> {n.tareas.length}
          </Chip>
        )}
        {tipo && <Chip>{tipo}</Chip>}
        {estado && <Chip estado={estado}>{estado}</Chip>}
      </div>
    </Link>
  );
}

export function Panel({ titulo, children, accion }: { titulo: string; children: React.ReactNode; accion?: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0d22]/60 backdrop-blur">
      <header className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3">
        <h2 className="text-xs uppercase tracking-[0.2em] text-indigo-200/70">{titulo}</h2>
        {accion}
      </header>
      {children}
    </section>
  );
}
