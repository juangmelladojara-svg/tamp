import Link from "next/link";
import { Plus } from "lucide-react";
import { sesionPanel } from "@/lib/admin/sesion";
import { dominio, ESTADOS_LEAD, fecha, hace, hoy, opcion, ORIGENES_LEAD } from "@/lib/admin/formato";
import { BotonLink, Encabezado, Insignia, Nota, Vacio } from "../../_ui/ui";

export const metadata = { title: "Leads" };

const ACTIVOS = ["nuevo", "contactado", "conversando", "propuesta"];

export default async function Leads({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { estado = "activos" } = await searchParams;
  const { supabase } = await sesionPanel();

  let consulta = supabase
    .from("leads")
    .select("id, nombre, empresa, whatsapp, email, sitio_web, origen, estado, proximo_contacto, creado_en, diagnosticos(nota)")
    .order("creado_en", { ascending: false })
    .limit(300);
  if (estado === "activos") consulta = consulta.in("estado", ACTIVOS);
  else if (Object.hasOwn(ESTADOS_LEAD, estado)) consulta = consulta.eq("estado", estado);

  const [{ data: leads }, { data: todos }] = await Promise.all([consulta, supabase.from("leads").select("estado")]);

  const conteo = (todos ?? []).reduce<Record<string, number>>((acc, l) => ({ ...acc, [l.estado]: (acc[l.estado] ?? 0) + 1 }), {});
  const filtros: [string, string, number][] = [
    ["activos", "En curso", ACTIVOS.reduce((s, e) => s + (conteo[e] ?? 0), 0)],
    ...Object.entries(ESTADOS_LEAD).map(([k, v]) => [k, v.etiqueta, conteo[k] ?? 0] as [string, string, number]),
    ["todos", "Todos", (todos ?? []).length],
  ];
  const hoyStr = hoy();

  return (
    <>
      <Encabezado
        titulo="Leads"
        bajada="Prospectos que llegaron por el Diagnóstico, WhatsApp, referidos o que agregaste tú."
        accion={
          <BotonLink href="/leads/nuevo">
            <Plus className="h-4 w-4" strokeWidth={1.75} /> Nuevo lead
          </BotonLink>
        }
      />

      <nav aria-label="Filtrar por estado" className="-mx-5 mb-5 flex gap-1.5 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
        {filtros.map(([valor, texto, n]) => (
          <Link
            key={valor}
            href={valor === "activos" ? "/leads" : `/leads?estado=${valor}`}
            aria-current={estado === valor ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors ${
              estado === valor ? "bg-ink-900 text-ink-50" : "bg-white text-ink-600 ring-1 ring-black/5 hover:ring-black/15"
            }`}
          >
            {texto}
            <span className={`text-xs ${estado === valor ? "text-ink-300" : "text-ink-400"}`}>{n}</span>
          </Link>
        ))}
      </nav>

      {leads?.length ? (
        <div className="overflow-x-auto rounded-3xl border border-black/[0.06] bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-black/5 text-xs text-ink-400">
              <tr>
                <th className="px-5 py-3 font-medium">Lead</th>
                <th className="px-3 py-3 font-medium">Contacto</th>
                <th className="px-3 py-3 font-medium">Origen</th>
                <th className="px-3 py-3 font-medium">Diag.</th>
                <th className="px-3 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Próximo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {leads.map((l) => {
                const e = opcion(ESTADOS_LEAD, l.estado);
                const o = opcion(ORIGENES_LEAD, l.origen);
                const atrasado = l.proximo_contacto && l.proximo_contacto < hoyStr && ACTIVOS.includes(l.estado);
                return (
                  <tr key={l.id} className="transition-colors hover:bg-ink-50">
                    <td className="px-5 py-3">
                      <Link href={`/leads/${l.id}`} className="block">
                        <span className="block font-medium">{l.empresa || l.nombre || dominio(l.sitio_web)}</span>
                        <span className="text-xs text-ink-400">
                          {l.empresa && l.nombre ? `${l.nombre} · ` : ""}
                          {hace(l.creado_en)}
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-ink-600">{l.whatsapp || l.email}</td>
                    <td className="px-3 py-3">
                      <Insignia tono={o.tono}>{o.etiqueta}</Insignia>
                    </td>
                    <td className="px-3 py-3">{l.diagnosticos ? <Nota valor={l.diagnosticos.nota} /> : <span className="text-ink-300">—</span>}</td>
                    <td className="px-3 py-3">
                      <Insignia tono={e.tono}>{e.etiqueta}</Insignia>
                    </td>
                    <td className={`px-5 py-3 ${atrasado ? "font-medium text-rose-600" : "text-ink-500"}`}>{fecha(l.proximo_contacto)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Vacio>No hay leads en este filtro.</Vacio>
      )}
    </>
  );
}
