import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { sesionPanel } from "@/lib/admin/sesion";
import { dominio, ESTADOS_LEAD, fechaHora, opcion } from "@/lib/admin/formato";
import { CATEGORIAS, type CategoriaId, type Chequeo, type ResultadoDiagnostico } from "@/lib/diagnostico/tipos";
import { crearLeadDesdeDiagnostico } from "../../acciones";
import { Campo, Encabezado, Insignia, Nota, Tarjeta } from "../../../_ui/ui";
import BotonEnviar from "../../../_ui/BotonEnviar";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ORDEN = { falta: 0, mejorable: 1, ok: 2 } as const;

export const metadata = { title: "Diagnóstico" };

export default async function InformeDiagnostico({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase } = await sesionPanel();

  const [{ data: d }, { data: leads }] = await Promise.all([
    supabase.from("diagnosticos").select("*").eq("id", id).maybeSingle(),
    supabase.from("leads").select("id, nombre, empresa, estado").eq("diagnostico_id", id),
  ]);
  if (!d) notFound();

  const r = d.resultado as unknown as ResultadoDiagnostico;
  const sitio = dominio(d.url_final ?? d.url);
  const pendientes = (r.chequeos ?? [])
    .filter((c) => c.estado !== "ok")
    .sort((a, b) => ORDEN[a.estado] - ORDEN[b.estado] || b.max - b.puntos - (a.max - a.puntos));
  const bien = (r.chequeos ?? []).filter((c) => c.estado === "ok");

  // Borrador para la prospección por WhatsApp (plan de marketing: diagnóstico + outbound).
  const urgentes = pendientes.slice(0, 3).map((c) => `• ${c.titulo}: ${c.detalle}`);
  const borrador =
    `Hola, soy Juan de TAMP. Revisé ${sitio} con nuestro diagnóstico y sacó ${d.nota}/100.\n` +
    (urgentes.length ? `Lo más urgente:\n${urgentes.join("\n")}\n` : "") +
    `¿Te muestro en 15 minutos cómo mejorarlo? Sin compromiso.`;

  return (
    <>
      <Encabezado
        titulo={sitio}
        volver={{ href: "/diagnosticos", texto: "Diagnósticos" }}
        bajada={`Analizado el ${fechaHora(d.creado_en)}`}
        accion={
          <a
            href={d.url_final ?? d.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-medium transition-colors hover:border-black/25"
          >
            Abrir sitio <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
          </a>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="grid content-start gap-6">
          <Tarjeta>
            <div className="flex flex-wrap items-center gap-6">
              <Nota valor={d.nota} grande />
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                {(Object.keys(CATEGORIAS) as CategoriaId[]).map((c) => {
                  const n = r.porCategoria?.[c] ?? 0;
                  return (
                    <div key={c}>
                      <div className="flex justify-between text-sm">
                        <span className="text-ink-600">{CATEGORIAS[c].titulo}</span>
                        <span className="font-mono text-ink-500">{n}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100">
                        <div
                          className={`h-full rounded-full ${n >= 80 ? "bg-emerald-500" : n >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                          style={{ width: `${n}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Tarjeta>

          <Tarjeta titulo={`Para mejorar (${pendientes.length})`}>
            {pendientes.length ? (
              <ul className="divide-y divide-black/5">
                {pendientes.map((c) => (
                  <ChequeoFila key={c.id} c={c} />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-500">Todo en orden.</p>
            )}
          </Tarjeta>

          {bien.length > 0 && (
            <Tarjeta titulo={`Bien (${bien.length})`}>
              <ul className="flex flex-wrap gap-2">
                {bien.map((c) => (
                  <li key={c.id}>
                    <Insignia tono="verde">{c.titulo}</Insignia>
                  </li>
                ))}
              </ul>
            </Tarjeta>
          )}
          {r.omitidos?.length > 0 && <p className="text-sm text-ink-400">No se pudo medir: {r.omitidos.join(" · ")}.</p>}
        </div>

        <div className="grid content-start gap-6">
          <Tarjeta titulo="Lead">
            {leads?.length ? (
              <ul className="grid gap-2">
                {leads.map((l) => {
                  const e = opcion(ESTADOS_LEAD, l.estado);
                  return (
                    <li key={l.id}>
                      <Link href={`/leads/${l.id}`} className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">{l.empresa || l.nombre || "Lead"}</span>
                        <Insignia tono={e.tono}>{e.etiqueta}</Insignia>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <form action={crearLeadDesdeDiagnostico} className="grid gap-3">
                <input type="hidden" name="diagnostico_id" value={d.id} />
                <p className="text-sm text-ink-500">¿Sabes de quién es? Regístralo como lead.</p>
                <Campo nombre="nombre" etiqueta="Nombre" maxLength={120} />
                <Campo nombre="empresa" etiqueta="Empresa" maxLength={160} />
                <Campo nombre="whatsapp" etiqueta="WhatsApp" maxLength={40} placeholder="+56 9…" />
                <Campo nombre="email" etiqueta="Correo" type="email" maxLength={200} />
                <BotonEnviar pendiente="Creando…">Crear lead</BotonEnviar>
              </form>
            )}
          </Tarjeta>

          <Tarjeta titulo="Mensaje para enviar">
            <textarea
              readOnly
              defaultValue={borrador}
              rows={9}
              aria-label="Borrador de mensaje para el prospecto"
              className="w-full resize-y rounded-xl border border-black/10 bg-ink-50 p-3 text-sm leading-relaxed text-ink-700 outline-none"
            />
            <p className="mt-2 text-xs text-ink-400">Cópialo y ajústalo antes de mandarlo.</p>
          </Tarjeta>
        </div>
      </div>
    </>
  );
}

function ChequeoFila({ c }: { c: Chequeo }) {
  return (
    <li className="py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{c.titulo}</p>
          <p className="mt-0.5 text-sm text-ink-500">{c.detalle}</p>
          <p className="mt-2 text-sm text-ink-600">
            <span className="font-medium text-ink-900">Cómo se arregla: </span>
            {c.comoArreglar}
          </p>
        </div>
        <Insignia tono={c.estado === "falta" ? "rojo" : "ambar"}>
          {c.puntos}/{c.max}
        </Insignia>
      </div>
    </li>
  );
}
