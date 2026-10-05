import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { sesionPanel } from "@/lib/admin/sesion";
import {
  clp,
  enlaceWhatsApp,
  ESTADOS_CLIENTE,
  ESTADOS_PAGO,
  ESTADOS_PROYECTO,
  fecha,
  hoy,
  opcion,
  TIPOS_PROYECTO,
} from "@/lib/admin/formato";
import { actualizarCliente, cambiarEstadoPago, crearPago, crearProyecto } from "../../acciones";
import { Campo, Encabezado, Insignia, Selector, Tarjeta, Vacio } from "../../../_ui/ui";
import BotonEnviar from "../../../_ui/BotonEnviar";
import CamposCliente from "../CamposCliente";
import CamposProyecto from "../../proyectos/CamposProyecto";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata = { title: "Cliente" };

export default async function FichaCliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase } = await sesionPanel();

  const [{ data: cliente }, { data: proyectos }, { data: pagos }] = await Promise.all([
    supabase.from("clientes").select("*").eq("id", id).maybeSingle(),
    supabase.from("proyectos").select("*").eq("cliente_id", id).order("creado_en", { ascending: false }),
    supabase.from("pagos").select("*, proyectos(nombre)").eq("cliente_id", id).order("fecha", { ascending: false }),
  ]);
  if (!cliente) notFound();

  const e = opcion(ESTADOS_CLIENTE, cliente.estado);
  const pagado = (pagos ?? []).filter((p) => p.estado === "pagado").reduce((s, p) => s + p.monto, 0);
  const pendiente = (pagos ?? []).filter((p) => p.estado === "pendiente").reduce((s, p) => s + p.monto, 0);

  return (
    <>
      <Encabezado
        titulo={cliente.nombre}
        volver={{ href: "/clientes", texto: "Clientes" }}
        bajada={
          <span className="inline-flex flex-wrap items-center gap-2">
            <Insignia tono={e.tono}>{e.etiqueta}</Insignia>
            {cliente.plan_mensual && <Insignia tono="tinta">Plan {clp(cliente.monto_mensual)}/mes</Insignia>}
            {cliente.rubro && <span className="text-sm">{cliente.rubro}</span>}
          </span>
        }
        accion={
          cliente.whatsapp ? (
            <a
              href={enlaceWhatsApp(cliente.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={1.75} /> WhatsApp
            </a>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="grid content-start gap-6">
          <Tarjeta titulo="Proyectos">
            {proyectos?.length ? (
              <ul className="divide-y divide-black/5">
                {proyectos.map((p) => {
                  const ep = opcion(ESTADOS_PROYECTO, p.estado);
                  return (
                    <li key={p.id}>
                      <Link href={`/proyectos/${p.id}`} className="flex items-center justify-between gap-3 py-3">
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{p.nombre}</span>
                          <span className="text-xs text-ink-400">
                            {opcion(TIPOS_PROYECTO, p.tipo).etiqueta}
                            {p.monto ? ` · ${clp(p.monto)}` : ""}
                            {p.entrega ? ` · entrega ${fecha(p.entrega)}` : ""}
                          </span>
                        </span>
                        <Insignia tono={ep.tono}>{ep.etiqueta}</Insignia>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Vacio>Sin proyectos todavía.</Vacio>
            )}
            <details className="mt-4 rounded-2xl border border-black/5 p-4 [&_summary]:cursor-pointer">
              <summary className="text-sm font-medium">+ Nuevo proyecto</summary>
              <form action={crearProyecto} className="mt-4 grid gap-4">
                <input type="hidden" name="cliente_id" value={cliente.id} />
                <CamposProyecto compacto />
                <div className="flex justify-end">
                  <BotonEnviar pendiente="Creando…">Crear proyecto</BotonEnviar>
                </div>
              </form>
            </details>
          </Tarjeta>

          <Tarjeta titulo="Datos del cliente">
            <form action={actualizarCliente} className="grid gap-6">
              <input type="hidden" name="id" value={cliente.id} />
              <CamposCliente cliente={cliente} />
              <div className="flex justify-end">
                <BotonEnviar>Guardar cambios</BotonEnviar>
              </div>
            </form>
          </Tarjeta>
        </div>

        <Tarjeta titulo="Pagos" className="content-start self-start">
          <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-emerald-50 p-3">
              <p className="text-xs text-emerald-700">Pagado</p>
              <p className="font-display text-lg font-semibold text-emerald-800">{clp(pagado)}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3">
              <p className="text-xs text-amber-700">Pendiente</p>
              <p className="font-display text-lg font-semibold text-amber-800">{clp(pendiente)}</p>
            </div>
          </div>

          {pagos?.length ? (
            <ul className="divide-y divide-black/5">
              {pagos.map((p) => {
                const ep = opcion(ESTADOS_PAGO, p.estado);
                return (
                  <li key={p.id} className="py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{p.concepto}</p>
                        <p className="text-xs text-ink-400">
                          {fecha(p.fecha)}
                          {p.proyectos?.nombre ? ` · ${p.proyectos.nombre}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{clp(p.monto)}</p>
                        <Insignia tono={ep.tono}>{ep.etiqueta}</Insignia>
                      </div>
                    </div>
                    {p.estado === "pendiente" && (
                      <div className="mt-2 flex gap-2">
                        <form action={cambiarEstadoPago}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="estado" value="pagado" />
                          <BotonEnviar variante="secundario" pendiente="…" className="!px-3 !py-1 text-xs">
                            Marcar pagado
                          </BotonEnviar>
                        </form>
                        <form action={cambiarEstadoPago}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="estado" value="anulado" />
                          <BotonEnviar variante="peligro" pendiente="…" confirmar="¿Anular este pago?" className="!px-3 !py-1 text-xs">
                            Anular
                          </BotonEnviar>
                        </form>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <Vacio>Sin pagos registrados.</Vacio>
          )}

          <form action={crearPago} className="mt-5 grid gap-3 border-t border-black/5 pt-5">
            <input type="hidden" name="cliente_id" value={cliente.id} />
            <p className="text-sm font-medium">Registrar pago</p>
            <Campo nombre="concepto" etiqueta="Concepto *" required maxLength={200} placeholder="Mensualidad octubre, 50% inicio…" />
            <div className="grid grid-cols-2 gap-3">
              <Campo nombre="monto" etiqueta="Monto *" required inputMode="numeric" placeholder="150000" />
              <Campo nombre="fecha" etiqueta="Fecha" type="date" defaultValue={hoy()} />
            </div>
            {proyectos && proyectos.length > 0 && (
              <Selector
                nombre="proyecto_id"
                etiqueta="Proyecto"
                opciones={proyectos.map((p) => [p.id, p.nombre] as [string, string])}
                conVacio="(ninguno)"
              />
            )}
            <Selector nombre="estado" etiqueta="Estado" opciones={ESTADOS_PAGO} defaultValue="pendiente" />
            <BotonEnviar pendiente="Registrando…">Registrar pago</BotonEnviar>
          </form>
        </Tarjeta>
      </div>
    </>
  );
}
