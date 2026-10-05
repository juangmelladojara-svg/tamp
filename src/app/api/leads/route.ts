import { NextResponse } from "next/server";
import { clienteServicio } from "@/lib/supabase/servicio";
import { crearLimitador, ipDe } from "@/lib/limite";

// Formulario "te mando el informe completo" del Diagnóstico TAMP.
// Crea un lead en el panel (admin.tamp.cl) ligado al diagnóstico.
export const runtime = "nodejs";

const excedeLimite = crearLimitador(10 * 60 * 1000, 5);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i;

/** Acepta "+56 9 1234 5678", "912345678", etc. Devuelve solo dígitos con prefijo, o null. */
function normalizarTelefono(texto: string): string | null {
  const digitos = texto.replace(/[^\d]/g, "");
  if (digitos.length < 8 || digitos.length > 15) return null;
  if (digitos.length === 9 && digitos.startsWith("9")) return `+56${digitos}`; // celular chileno sin prefijo
  return `+${digitos}`;
}

function error(mensaje: string, status = 400) {
  return NextResponse.json({ error: mensaje }, { status });
}

export async function POST(req: Request) {
  if (excedeLimite(ipDe(req))) {
    return error("Recibimos varios envíos seguidos. Espera unos minutos o escríbenos por WhatsApp.", 429);
  }

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = await req.json();
  } catch {
    return error("Solicitud inválida.");
  }

  // Trampa para bots: campo oculto que una persona nunca llena.
  if (typeof cuerpo.sitio === "string" && cuerpo.sitio.trim()) {
    return NextResponse.json({ ok: true });
  }

  const nombre = typeof cuerpo.nombre === "string" ? cuerpo.nombre.trim() : "";
  const contacto = typeof cuerpo.contacto === "string" ? cuerpo.contacto.trim() : "";
  const diagnosticoId = typeof cuerpo.diagnosticoId === "string" ? cuerpo.diagnosticoId : "";

  if (nombre.length < 2 || nombre.length > 120) return error("Escribe tu nombre.");
  if (!UUID.test(diagnosticoId)) return error("No encontramos tu diagnóstico. Vuelve a hacerlo.");

  const email = EMAIL.test(contacto) ? contacto.toLowerCase() : null;
  const whatsapp = email ? null : normalizarTelefono(contacto);
  if (!email && !whatsapp) return error("Escribe un WhatsApp o un correo válido.");

  const db = clienteServicio();
  if (!db) return error("No pudimos registrar tu solicitud. Escríbenos por WhatsApp.", 503);

  // Solo diagnósticos reales y recientes: evita colgar leads de ids inventados.
  const { data: diag } = await db
    .from("diagnosticos")
    .select("id, url_final, url, nota, creado_en")
    .eq("id", diagnosticoId)
    .gte("creado_en", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .maybeSingle();
  if (!diag) return error("Tu diagnóstico expiró. Vuelve a hacerlo para pedir el informe.", 404);

  const { error: errInsert } = await db.from("leads").insert({
    nombre,
    whatsapp,
    email,
    sitio_web: (diag.url_final ?? diag.url).slice(0, 300),
    origen: "diagnostico",
    diagnostico_id: diag.id,
    mensaje: `Pidió el informe completo del Diagnóstico TAMP (nota ${diag.nota}/100).`,
  });
  if (errInsert) {
    console.error("[leads] no se pudo guardar:", errInsert.message);
    return error("No pudimos registrar tu solicitud. Escríbenos por WhatsApp.", 500);
  }

  return NextResponse.json({ ok: true });
}
