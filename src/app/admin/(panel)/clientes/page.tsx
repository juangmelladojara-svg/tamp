import Link from "next/link";
import { Plus } from "lucide-react";
import { sesionPanel } from "@/lib/admin/sesion";
import { clp, ESTADOS_CLIENTE, opcion } from "@/lib/admin/formato";
import { BotonLink, Encabezado, Insignia, Kpi, Vacio } from "../../_ui/ui";

export const metadata = { title: "Clientes" };

export default async function Clientes() {
  const { supabase } = await sesionPanel();
  const [{ data: clientes }, { data: pendientes }] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, nombre, rubro, estado, plan_mensual, monto_mensual, proyectos(id, estado)")
      .order("estado", { ascending: true })
      .order("nombre", { ascending: true }),
    supabase.from("pagos").select("monto, cliente_id").eq("estado", "pendiente"),
  ]);

  const activos = (clientes ?? []).filter((c) => c.estado === "activo");
  const mrr = activos.reduce((s, c) => s + (c.plan_mensual ? c.monto_mensual ?? 0 : 0), 0);
  const conPlan = activos.filter((c) => c.plan_mensual).length;
  const deuda = new Map<string, number>();
  (pendientes ?? []).forEach((p) => deuda.set(p.cliente_id, (deuda.get(p.cliente_id) ?? 0) + p.monto));
  const porCobrar = [...deuda.values()].reduce((a, b) => a + b, 0);

  return (
    <>
      <Encabezado
        titulo="Clientes"
        accion={
          <BotonLink href="/clientes/nuevo">
            <Plus className="h-4 w-4" strokeWidth={1.75} /> Nuevo cliente
          </BotonLink>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi etiqueta="Activos" valor={activos.length} />
        <Kpi etiqueta="Con plan mensual" valor={conPlan} nota="meta 2027: 10" />
        <Kpi etiqueta="Ingreso recurrente" valor={clp(mrr)} nota="por mes" />
        <Kpi etiqueta="Por cobrar" valor={clp(porCobrar)} />
      </div>

      {clientes?.length ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {clientes.map((c) => {
            const e = opcion(ESTADOS_CLIENTE, c.estado);
            const abiertos = c.proyectos.filter((p) => !["cerrado"].includes(p.estado)).length;
            return (
              <li key={c.id}>
                <Link
                  href={`/clientes/${c.id}`}
                  className="flex h-full flex-col rounded-3xl border border-black/[0.06] bg-white p-5 transition-colors hover:border-black/15"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-display text-lg font-semibold tracking-tight">{c.nombre}</p>
                      <p className="text-sm text-ink-400">{c.rubro || "Sin rubro"}</p>
                    </div>
                    <Insignia tono={e.tono}>{e.etiqueta}</Insignia>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-500">
                    <span>{c.plan_mensual ? `Plan ${clp(c.monto_mensual)}/mes` : "Sin plan mensual"}</span>
                    <span>
                      {abiertos} proyecto{abiertos === 1 ? "" : "s"} activo{abiertos === 1 ? "" : "s"}
                    </span>
                    {deuda.get(c.id) ? <span className="font-medium text-amber-700">Debe {clp(deuda.get(c.id)!)}</span> : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <Vacio>Todavía no hay clientes. Créalos acá o conviértelos desde un lead ganado.</Vacio>
      )}
    </>
  );
}
