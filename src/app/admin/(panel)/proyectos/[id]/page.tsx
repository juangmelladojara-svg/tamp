import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { sesionPanel } from "@/lib/admin/sesion";
import { ESTADOS_PROYECTO, opcion, TIPOS_PROYECTO } from "@/lib/admin/formato";
import { actualizarProyecto } from "../../acciones";
import { Encabezado, Insignia, Tarjeta } from "../../../_ui/ui";
import BotonEnviar from "../../../_ui/BotonEnviar";
import CamposProyecto from "../CamposProyecto";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata = { title: "Proyecto" };

export default async function FichaProyecto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase } = await sesionPanel();

  const { data: p } = await supabase.from("proyectos").select("*, clientes(id, nombre)").eq("id", id).maybeSingle();
  if (!p) notFound();

  const e = opcion(ESTADOS_PROYECTO, p.estado);
  const t = opcion(TIPOS_PROYECTO, p.tipo);

  return (
    <>
      <Encabezado
        titulo={p.nombre}
        volver={p.clientes ? { href: `/clientes/${p.clientes.id}`, texto: p.clientes.nombre } : { href: "/proyectos", texto: "Proyectos" }}
        bajada={
          <span className="inline-flex flex-wrap items-center gap-2">
            <Insignia tono={e.tono}>{e.etiqueta}</Insignia>
            <Insignia tono={t.tono}>{t.etiqueta}</Insignia>
          </span>
        }
        accion={
          <div className="flex gap-2">
            {p.url_produccion && (
              <a
                href={p.url_produccion}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium transition-colors hover:border-black/25"
              >
                Sitio <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
              </a>
            )}
            {p.repositorio && (
              <a
                href={p.repositorio}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium transition-colors hover:border-black/25"
              >
                Repo <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
              </a>
            )}
          </div>
        }
      />
      <Tarjeta>
        <form action={actualizarProyecto} className="grid gap-6">
          <input type="hidden" name="id" value={p.id} />
          <CamposProyecto proyecto={p} />
          <div className="flex items-center justify-between gap-3">
            {p.clientes && (
              <Link href={`/clientes/${p.clientes.id}`} className="text-sm text-ink-400 hover:text-ink-900">
                Pagos y otros proyectos de {p.clientes.nombre} →
              </Link>
            )}
            <BotonEnviar>Guardar cambios</BotonEnviar>
          </div>
        </form>
      </Tarjeta>
    </>
  );
}
