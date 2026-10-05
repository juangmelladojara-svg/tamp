import Link from "next/link";
import { sesionPanel } from "@/lib/admin/sesion";
import { clp, dominio, ESTADOS_LEAD, fecha, hace, hoy, opcion } from "@/lib/admin/formato";
import { Encabezado, Insignia, Kpi, Nota, Tarjeta, Vacio } from "../_ui/ui";

export const metadata = { title: "Inicio" };

const ACTIVOS = ["nuevo", "contactado", "conversando", "propuesta"];

export default async function Inicio() {
  const { supabase, perfil } = await sesionPanel();

  const hace7 = new Date(Date.now() - 7 * 86400000).toISOString();
  const en7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const [nuevos, activos, diag7, clientes, pendientes, ultimosLeads, seguimiento, ultimosDiag] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("estado", "nuevo"),
    supabase.from("leads").select("id", { count: "exact", head: true }).in("estado", ACTIVOS),
    supabase.from("diagnosticos").select("id", { count: "exact", head: true }).gte("creado_en", hace7),
    supabase.from("clientes").select("plan_mensual, monto_mensual").eq("estado", "activo"),
    supabase.from("pagos").select("monto").eq("estado", "pendiente"),
    supabase
      .from("leads")
      .select("id, nombre, empresa, sitio_web, estado, creado_en")
      .order("creado_en", { ascending: false })
      .limit(6),
    supabase
      .from("leads")
      .select("id, nombre, empresa, sitio_web, estado, proximo_contacto")
      .in("estado", ACTIVOS)
      .not("proximo_contacto", "is", null)
      .lte("proximo_contacto", en7)
      .order("proximo_contacto", { ascending: true })
      .limit(6),
    supabase.from("diagnosticos").select("id, url, url_final, nota, creado_en").order("creado_en", { ascending: false }).limit(6),
  ]);

  const clientesActivos = clientes.data ?? [];
  const mrr = clientesActivos.reduce((s, c) => s + (c.plan_mensual ? c.monto_mensual ?? 0 : 0), 0);
  const porCobrar = (pendientes.data ?? []).reduce((s, p) => s + p.monto, 0);
  const hoyStr = hoy();

  return (
    <>
      <Encabezado titulo={`Hola, ${perfil!.nombre.split(" ")[0]}`} bajada="Así va TAMP hoy." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi etiqueta="Leads nuevos" valor={nuevos.count ?? 0} nota="sin contactar" href="/leads?estado=nuevo" />
        <Kpi etiqueta="En curso" valor={activos.count ?? 0} nota="leads abiertos" href="/leads" />
        <Kpi etiqueta="Diagnósticos" valor={diag7.count ?? 0} nota="últimos 7 días" href="/diagnosticos" />
        <Kpi etiqueta="Clientes activos" valor={clientesActivos.length} nota={`${clp(mrr)} / mes`} href="/clientes" />
        <Kpi etiqueta="Por cobrar" valor={clp(porCobrar)} nota="pagos pendientes" href="/clientes" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Tarjeta titulo="Para contactar" accion={<Link href="/leads" className="text-sm text-ink-400 hover:text-ink-900">Ver leads</Link>}>
          {seguimiento.data?.length ? (
            <ul className="divide-y divide-black/5">
              {seguimiento.data.map((l) => (
                <li key={l.id}>
                  <Link href={`/leads/${l.id}`} className="flex items-center justify-between gap-3 py-3">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{l.empresa || l.nombre || dominio(l.sitio_web)}</span>
                      <span className="text-xs text-ink-400">{opcion(ESTADOS_LEAD, l.estado).etiqueta}</span>
                    </span>
                    <Insignia tono={l.proximo_contacto! < hoyStr ? "rojo" : l.proximo_contacto === hoyStr ? "ambar" : "gris"}>
                      {l.proximo_contacto! < hoyStr ? "Atrasado · " : l.proximo_contacto === hoyStr ? "Hoy · " : ""}
                      {fecha(l.proximo_contacto)}
                    </Insignia>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Vacio>Nada agendado para esta semana. Ponle fecha de próximo contacto a tus leads y aparecen acá.</Vacio>
          )}
        </Tarjeta>

        <Tarjeta titulo="Últimos leads" accion={<Link href="/leads/nuevo" className="text-sm text-ink-400 hover:text-ink-900">+ Nuevo</Link>}>
          {ultimosLeads.data?.length ? (
            <ul className="divide-y divide-black/5">
              {ultimosLeads.data.map((l) => {
                const e = opcion(ESTADOS_LEAD, l.estado);
                return (
                  <li key={l.id}>
                    <Link href={`/leads/${l.id}`} className="flex items-center justify-between gap-3 py-3">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{l.empresa || l.nombre || dominio(l.sitio_web)}</span>
                        <span className="text-xs text-ink-400">{hace(l.creado_en)}</span>
                      </span>
                      <Insignia tono={e.tono}>{e.etiqueta}</Insignia>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Vacio>Todavía no hay leads. Llegan solos desde el Diagnóstico de tamp.cl.</Vacio>
          )}
        </Tarjeta>

        <Tarjeta
          titulo="Últimos diagnósticos"
          className="lg:col-span-2"
          accion={<Link href="/diagnosticos" className="text-sm text-ink-400 hover:text-ink-900">Ver todos</Link>}
        >
          {ultimosDiag.data?.length ? (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ultimosDiag.data.map((d) => (
                <li key={d.id}>
                  <Link href={`/diagnosticos/${d.id}`} className="flex items-center gap-3 rounded-2xl border border-black/5 p-3 transition-colors hover:border-black/15">
                    <Nota valor={d.nota} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{dominio(d.url_final ?? d.url)}</span>
                      <span className="text-xs text-ink-400">{hace(d.creado_en)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Vacio>Aún nadie usa el Diagnóstico. Compártelo: tamp.cl/diagnostico</Vacio>
          )}
        </Tarjeta>
      </div>
    </>
  );
}
