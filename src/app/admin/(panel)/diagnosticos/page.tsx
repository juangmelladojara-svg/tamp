import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { sesionPanel } from "@/lib/admin/sesion";
import { dominio, fechaHora } from "@/lib/admin/formato";
import { SITE_URL } from "@/lib/site";
import { CATEGORIAS, type CategoriaId } from "@/lib/diagnostico/tipos";
import { BotonLink, Encabezado, Insignia, Nota, Vacio } from "../../_ui/ui";

export const metadata = { title: "Diagnósticos" };

export default async function Diagnosticos() {
  const { supabase } = await sesionPanel();
  const { data } = await supabase
    .from("diagnosticos")
    .select("id, url, url_final, nota, por_categoria, creado_en, leads(id)")
    .order("creado_en", { ascending: false })
    .limit(200);

  const categorias = Object.keys(CATEGORIAS) as CategoriaId[];

  return (
    <>
      <Encabezado
        titulo="Diagnósticos"
        bajada="Cada análisis hecho en tamp.cl/diagnostico, tuyo o de un visitante."
        accion={
          <BotonLink href={`${SITE_URL}/diagnostico`} variante="secundario">
            Hacer un diagnóstico <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
          </BotonLink>
        }
      />

      {data?.length ? (
        <div className="overflow-x-auto rounded-3xl border border-black/[0.06] bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-black/5 text-xs text-ink-400">
              <tr>
                <th className="px-5 py-3 font-medium">Sitio</th>
                <th className="px-3 py-3 font-medium">Nota</th>
                {categorias.map((c) => (
                  <th key={c} className="px-3 py-3 font-medium">
                    {CATEGORIAS[c].titulo}
                  </th>
                ))}
                <th className="px-5 py-3 font-medium">Lead</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {data.map((d) => {
                const pc = (d.por_categoria ?? {}) as Partial<Record<CategoriaId, number>>;
                return (
                  <tr key={d.id} className="transition-colors hover:bg-ink-50">
                    <td className="px-5 py-3">
                      <Link href={`/diagnosticos/${d.id}`} className="block">
                        <span className="block font-medium">{dominio(d.url_final ?? d.url)}</span>
                        <span className="text-xs text-ink-400">{fechaHora(d.creado_en)}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <Nota valor={d.nota} />
                    </td>
                    {categorias.map((c) => (
                      <td key={c} className="px-3 py-3 font-mono text-ink-500">
                        {pc[c] ?? "—"}
                      </td>
                    ))}
                    <td className="px-5 py-3">
                      {d.leads.length ? <Insignia tono="verde">Sí</Insignia> : <span className="text-ink-300">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Vacio>Todavía no hay diagnósticos guardados.</Vacio>
      )}
    </>
  );
}
