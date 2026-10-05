import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Mail, MessageCircle } from "lucide-react";
import { sesionPanel } from "@/lib/admin/sesion";
import { dominio, enlaceWhatsApp, ESTADOS_LEAD, fechaHora, opcion, ORIGENES_LEAD } from "@/lib/admin/formato";
import { actualizarLead, cambiarEstadoLead, convertirEnCliente, eliminarLead } from "../../acciones";
import { Dato, Encabezado, Insignia, Nota, Selector, Tarjeta } from "../../../_ui/ui";
import BotonEnviar from "../../../_ui/BotonEnviar";
import CamposLead from "../CamposLead";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata = { title: "Lead" };

export default async function FichaLead({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase } = await sesionPanel();

  const { data: lead } = await supabase
    .from("leads")
    .select("*, diagnosticos(id, nota, url, url_final, creado_en), clientes(id, nombre)")
    .eq("id", id)
    .maybeSingle();
  if (!lead) notFound();

  const titulo = lead.empresa || lead.nombre || dominio(lead.sitio_web);
  const e = opcion(ESTADOS_LEAD, lead.estado);
  const o = opcion(ORIGENES_LEAD, lead.origen);
  const saludo = `Hola${lead.nombre ? ` ${lead.nombre.split(" ")[0]}` : ""}, te escribe Juan de TAMP.`;
  const diag = lead.diagnosticos;

  return (
    <>
      <Encabezado
        titulo={titulo}
        volver={{ href: "/leads", texto: "Leads" }}
        bajada={
          <span className="inline-flex flex-wrap items-center gap-2">
            <Insignia tono={e.tono}>{e.etiqueta}</Insignia>
            <Insignia tono={o.tono}>{o.etiqueta}</Insignia>
            <span className="text-sm">Llegó el {fechaHora(lead.creado_en)}</span>
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Tarjeta titulo="Datos">
          <form action={actualizarLead} className="grid gap-6">
            <input type="hidden" name="id" value={lead.id} />
            <CamposLead lead={lead} />
            <div className="flex justify-end">
              <BotonEnviar>Guardar cambios</BotonEnviar>
            </div>
          </form>
        </Tarjeta>

        <div className="grid content-start gap-6">
          <Tarjeta titulo="Contactar">
            <div className="grid gap-2">
              {lead.whatsapp && (
                <a
                  href={enlaceWhatsApp(lead.whatsapp, saludo)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={1.75} /> WhatsApp
                </a>
              )}
              {lead.email && (
                <a
                  href={`mailto:${lead.email}?subject=${encodeURIComponent("Tu sitio web · TAMP")}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium transition-colors hover:border-black/25"
                >
                  <Mail className="h-4 w-4" strokeWidth={1.75} /> {lead.email}
                </a>
              )}
              {lead.sitio_web && (
                <a
                  href={lead.sitio_web}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm text-ink-500 transition-colors hover:text-ink-900"
                >
                  Ver {dominio(lead.sitio_web)} <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
                </a>
              )}
            </div>
            <form action={cambiarEstadoLead} className="mt-5 flex items-end gap-2 border-t border-black/5 pt-5">
              <input type="hidden" name="id" value={lead.id} />
              <Selector nombre="estado" etiqueta="Cambiar estado" opciones={ESTADOS_LEAD} defaultValue={lead.estado} className="flex-1" />
              <BotonEnviar variante="secundario" pendiente="…">
                Cambiar
              </BotonEnviar>
            </form>
          </Tarjeta>

          {diag && (
            <Tarjeta titulo="Diagnóstico">
              <Link href={`/diagnosticos/${diag.id}`} className="flex items-center gap-3">
                <Nota valor={diag.nota} />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{dominio(diag.url_final ?? diag.url)}</span>
                  <span className="text-xs text-ink-400">Ver informe completo →</span>
                </span>
              </Link>
            </Tarjeta>
          )}

          <Tarjeta titulo="Cliente">
            {lead.clientes ? (
              <Link href={`/clientes/${lead.clientes.id}`} className="font-medium underline decoration-accent decoration-2 underline-offset-4">
                {lead.clientes.nombre}
              </Link>
            ) : (
              <form action={convertirEnCliente} className="grid gap-3">
                <input type="hidden" name="id" value={lead.id} />
                <p className="text-sm text-ink-500">¿Cerraste el trato? Crea el cliente con estos datos y el lead queda como ganado.</p>
                <BotonEnviar pendiente="Creando…">Convertir en cliente</BotonEnviar>
              </form>
            )}
          </Tarjeta>

          <dl className="px-1">
            <Dato etiqueta="Actualizado">{fechaHora(lead.actualizado_en)}</Dato>
          </dl>
          <form action={eliminarLead} className="px-1">
            <input type="hidden" name="id" value={lead.id} />
            <BotonEnviar variante="peligro" pendiente="Eliminando…" confirmar="¿Eliminar este lead? No se puede deshacer.">
              Eliminar lead
            </BotonEnviar>
          </form>
        </div>
      </div>
    </>
  );
}
