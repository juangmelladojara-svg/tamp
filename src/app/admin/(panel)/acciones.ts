"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sesionMiembro } from "@/lib/admin/sesion";
import {
  ESTADOS_CLIENTE,
  ESTADOS_LEAD,
  ESTADOS_PAGO,
  ESTADOS_PROYECTO,
  ORIGENES_LEAD,
  TIPOS_PROYECTO,
} from "@/lib/admin/formato";

// ---------------------------------------------------------------------------
// Server actions del panel. Todas exigen ser miembro del equipo; además RLS
// rechaza en la base cualquier escritura de alguien que no lo sea.
// Los errores se lanzan y los muestra src/app/admin/(panel)/error.tsx.
// ---------------------------------------------------------------------------

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function texto(d: FormData, campo: string, max: number): string | null {
  const v = String(d.get(campo) ?? "").trim();
  return v ? v.slice(0, max) : null;
}

function requerido(d: FormData, campo: string, max: number, nombre: string): string {
  const v = texto(d, campo, max);
  if (!v) throw new Error(`Falta ${nombre}.`);
  return v;
}

/** "$1.400.000", "1400000" o "1.4M" mal escrito → solo dígitos. */
function entero(d: FormData, campo: string): number | null {
  const digitos = String(d.get(campo) ?? "").replace(/[^\d]/g, "");
  return digitos ? Math.min(Number(digitos), 2_000_000_000) : null;
}

function fecha(d: FormData, campo: string): string | null {
  const v = String(d.get(campo) ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

function opcion(d: FormData, campo: string, mapa: Record<string, unknown>, porDefecto: string): string {
  const v = String(d.get(campo) ?? "");
  return Object.hasOwn(mapa, v) ? v : porDefecto;
}

function id(d: FormData, campo = "id"): string {
  const v = String(d.get(campo) ?? "");
  if (!UUID.test(v)) throw new Error("Identificador inválido.");
  return v;
}

function telefono(d: FormData, campo: string): string | null {
  const v = texto(d, campo, 40);
  if (!v) return null;
  const digitos = v.replace(/[^\d]/g, "");
  if (digitos.length === 9 && digitos.startsWith("9")) return `+56${digitos}`;
  return digitos.length >= 8 ? `+${digitos}` : v;
}

function falla(error: { message: string } | null) {
  if (error) throw new Error(`No se pudo guardar: ${error.message}`);
}

function refrescar() {
  revalidatePath("/admin", "layout");
}

// -------------------------------------------------------------------- leads

function datosLead(d: FormData) {
  const whatsapp = telefono(d, "whatsapp");
  const email = texto(d, "email", 200)?.toLowerCase() ?? null;
  if (!whatsapp && !email) throw new Error("Un lead necesita al menos un WhatsApp o un correo.");
  return {
    nombre: texto(d, "nombre", 120),
    empresa: texto(d, "empresa", 160),
    whatsapp,
    email,
    sitio_web: texto(d, "sitio_web", 300),
    mensaje: texto(d, "mensaje", 2000),
    origen: opcion(d, "origen", ORIGENES_LEAD, "manual"),
    estado: opcion(d, "estado", ESTADOS_LEAD, "nuevo"),
    proximo_contacto: fecha(d, "proximo_contacto"),
    notas: texto(d, "notas", 5000),
  };
}

export async function crearLead(d: FormData) {
  const { supabase } = await sesionMiembro();
  const { data, error } = await supabase.from("leads").insert(datosLead(d)).select("id").single();
  falla(error);
  refrescar();
  redirect(`/leads/${data!.id}`);
}

export async function actualizarLead(d: FormData) {
  const { supabase } = await sesionMiembro();
  const { error } = await supabase.from("leads").update(datosLead(d)).eq("id", id(d));
  falla(error);
  refrescar();
}

/** Cambio rápido de estado desde la ficha del lead. */
export async function cambiarEstadoLead(d: FormData) {
  const { supabase } = await sesionMiembro();
  const { error } = await supabase
    .from("leads")
    .update({ estado: opcion(d, "estado", ESTADOS_LEAD, "nuevo") })
    .eq("id", id(d));
  falla(error);
  refrescar();
}

export async function eliminarLead(d: FormData) {
  const { supabase } = await sesionMiembro();
  const { error } = await supabase.from("leads").delete().eq("id", id(d));
  falla(error);
  refrescar();
  redirect("/leads");
}

/** Crea el cliente con los datos del lead y deja el lead como "ganado". */
export async function convertirEnCliente(d: FormData) {
  const { supabase } = await sesionMiembro();
  const leadId = id(d);
  const { data: lead, error: errLead } = await supabase.from("leads").select("*").eq("id", leadId).single();
  falla(errLead);
  if (lead!.cliente_id) redirect(`/clientes/${lead!.cliente_id}`);

  const { data: cliente, error } = await supabase
    .from("clientes")
    .insert({
      nombre: lead!.empresa || lead!.nombre || lead!.sitio_web || "Cliente sin nombre",
      contacto_nombre: lead!.nombre,
      whatsapp: lead!.whatsapp,
      email: lead!.email,
      sitio_web: lead!.sitio_web,
      notas: lead!.notas,
    })
    .select("id")
    .single();
  falla(error);

  const { error: errUpd } = await supabase
    .from("leads")
    .update({ estado: "ganado", cliente_id: cliente!.id })
    .eq("id", leadId);
  falla(errUpd);
  refrescar();
  redirect(`/clientes/${cliente!.id}`);
}

/** Lead manual a partir de un diagnóstico (p. ej. cuando el prospecto escribió por WhatsApp). */
export async function crearLeadDesdeDiagnostico(d: FormData) {
  const { supabase } = await sesionMiembro();
  const diagId = id(d, "diagnostico_id");
  const { data: diag, error: errDiag } = await supabase
    .from("diagnosticos")
    .select("id, url, url_final, nota")
    .eq("id", diagId)
    .single();
  falla(errDiag);

  const whatsapp = telefono(d, "whatsapp");
  const email = texto(d, "email", 200)?.toLowerCase() ?? null;
  if (!whatsapp && !email) throw new Error("Un lead necesita al menos un WhatsApp o un correo.");

  const { data, error } = await supabase
    .from("leads")
    .insert({
      nombre: texto(d, "nombre", 120),
      empresa: texto(d, "empresa", 160),
      whatsapp,
      email,
      sitio_web: diag!.url_final ?? diag!.url,
      origen: "diagnostico",
      diagnostico_id: diag!.id,
      mensaje: `Hizo el Diagnóstico TAMP (nota ${diag!.nota}/100).`,
    })
    .select("id")
    .single();
  falla(error);
  refrescar();
  redirect(`/leads/${data!.id}`);
}

// ----------------------------------------------------------------- clientes

function datosCliente(d: FormData) {
  return {
    nombre: requerido(d, "nombre", 160, "el nombre del cliente"),
    rubro: texto(d, "rubro", 120),
    contacto_nombre: texto(d, "contacto_nombre", 120),
    whatsapp: telefono(d, "whatsapp"),
    email: texto(d, "email", 200)?.toLowerCase() ?? null,
    sitio_web: texto(d, "sitio_web", 300),
    estado: opcion(d, "estado", ESTADOS_CLIENTE, "activo"),
    plan_mensual: d.get("plan_mensual") === "on",
    monto_mensual: entero(d, "monto_mensual"),
    inicio: fecha(d, "inicio"),
    notas: texto(d, "notas", 5000),
  };
}

export async function crearCliente(d: FormData) {
  const { supabase } = await sesionMiembro();
  const { data, error } = await supabase.from("clientes").insert(datosCliente(d)).select("id").single();
  falla(error);
  refrescar();
  redirect(`/clientes/${data!.id}`);
}

export async function actualizarCliente(d: FormData) {
  const { supabase } = await sesionMiembro();
  const { error } = await supabase.from("clientes").update(datosCliente(d)).eq("id", id(d));
  falla(error);
  refrescar();
}

// ---------------------------------------------------------------- proyectos

function datosProyecto(d: FormData) {
  return {
    nombre: requerido(d, "nombre", 160, "el nombre del proyecto"),
    tipo: opcion(d, "tipo", TIPOS_PROYECTO, "web"),
    estado: opcion(d, "estado", ESTADOS_PROYECTO, "propuesta"),
    monto: entero(d, "monto"),
    url_produccion: texto(d, "url_produccion", 300),
    repositorio: texto(d, "repositorio", 300),
    inicio: fecha(d, "inicio"),
    entrega: fecha(d, "entrega"),
    notas: texto(d, "notas", 5000),
  };
}

export async function crearProyecto(d: FormData) {
  const { supabase } = await sesionMiembro();
  const clienteId = id(d, "cliente_id");
  const { data, error } = await supabase
    .from("proyectos")
    .insert({ ...datosProyecto(d), cliente_id: clienteId })
    .select("id")
    .single();
  falla(error);
  refrescar();
  redirect(`/proyectos/${data!.id}`);
}

export async function actualizarProyecto(d: FormData) {
  const { supabase } = await sesionMiembro();
  const { error } = await supabase.from("proyectos").update(datosProyecto(d)).eq("id", id(d));
  falla(error);
  refrescar();
}

// -------------------------------------------------------------------- pagos

export async function crearPago(d: FormData) {
  const { supabase } = await sesionMiembro();
  const monto = entero(d, "monto");
  if (!monto) throw new Error("Falta el monto del pago.");
  const proyecto = String(d.get("proyecto_id") ?? "");
  const { error } = await supabase.from("pagos").insert({
    cliente_id: id(d, "cliente_id"),
    proyecto_id: UUID.test(proyecto) ? proyecto : null,
    concepto: requerido(d, "concepto", 200, "el concepto"),
    monto,
    fecha: fecha(d, "fecha") ?? undefined,
    estado: opcion(d, "estado", ESTADOS_PAGO, "pendiente"),
  });
  falla(error);
  refrescar();
}

export async function cambiarEstadoPago(d: FormData) {
  const { supabase } = await sesionMiembro();
  const { error } = await supabase
    .from("pagos")
    .update({ estado: opcion(d, "estado", ESTADOS_PAGO, "pendiente") })
    .eq("id", id(d));
  falla(error);
  refrescar();
}
