import Link from "next/link";
import { sesionPanel } from "@/lib/admin/sesion";
import { clp, ESTADOS_PROYECTO, fecha, hoy, opcion, TIPOS_PROYECTO } from "@/lib/admin/formato";
import { Encabezado, Insignia, Vacio } from "../../_ui/ui";

export const metadata = { title: "Proyectos" };

// Orden del tablero: lo que está en marcha primero.
const COLUMNAS = ["en_desarrollo", "propuesta", "en_mantencion", "entregado", "cerrado"] as const;

export default async function Proyectos() {
  const { supabase } = await sesionPanel();
  const { data } = await supabase
    .from("proyectos")
    .select("id, nombre, tipo, estado, monto, entrega, clientes(id, nombre)")
    .order("entrega", { ascending: true, nullsFirst: false });

  const hoyStr = hoy();

  return (
    <>
      <Encabezado titulo="Proyectos" bajada="Todos los proyectos por estado. Para crear uno, entra a la ficha del cliente." />
      {data?.length ? (
        <div className="grid gap-6">
          {COLUMNAS.map((estado) => {
            const lista = data.filter((p) => p.estado === estado);
            if (!lista.length) return null;
            const e = opcion(ESTADOS_PROYECTO, estado);
            return (
              <section key={estado}>
                <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
                  {e.etiqueta} <span className="text-sm font-normal text-ink-400">{lista.length}</span>
                </h2>
                <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {lista.map((p) => {
                    const vencido = p.entrega && p.entrega < hoyStr && ["propuesta", "en_desarrollo"].includes(p.estado);
                    return (
                      <li key={p.id}>
                        <Link
                          href={`/proyectos/${p.id}`}
                          className="block h-full rounded-3xl border border-black/[0.06] bg-white p-5 transition-colors hover:border-black/15"
                        >
                          <p className="font-medium">{p.nombre}</p>
                          <p className="text-sm text-ink-400">{p.clientes?.nombre}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                            <Insignia tono={opcion(TIPOS_PROYECTO, p.tipo).tono}>{opcion(TIPOS_PROYECTO, p.tipo).etiqueta}</Insignia>
                            {p.monto ? <span>{clp(p.monto)}</span> : null}
                            {p.entrega && (
                              <span className={vencido ? "font-medium text-rose-600" : ""}>
                                {vencido ? "Atrasado · " : "Entrega "}
                                {fecha(p.entrega)}
                              </span>
                            )}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      ) : (
        <Vacio>Sin proyectos todavía. Créalos desde la ficha de cada cliente.</Vacio>
      )}
    </>
  );
}
