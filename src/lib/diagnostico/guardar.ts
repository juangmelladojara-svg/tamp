import "server-only";
import { clienteServicio } from "@/lib/supabase/servicio";
import { huellaIp } from "@/lib/limite";
import type { ResultadoDiagnostico } from "./tipos";

/**
 * Guarda el diagnóstico para verlo en admin.tamp.cl. Devuelve su id, o null si
 * no se pudo (sin clave secreta o error de base): guardar nunca debe romper
 * el diagnóstico que ve el visitante.
 */
export async function guardarDiagnostico(
  r: ResultadoDiagnostico,
  ip: string,
  userAgent: string | null
): Promise<string | null> {
  const db = clienteServicio();
  if (!db) return null;

  const { data, error } = await db
    .from("diagnosticos")
    .insert({
      url: r.url.slice(0, 300),
      url_final: r.urlFinal.slice(0, 2000),
      nota: r.nota,
      por_categoria: r.porCategoria,
      resultado: r,
      ip_hash: huellaIp(ip),
      user_agent: userAgent?.slice(0, 500) ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[diagnostico] no se pudo guardar:", error.message);
    return null;
  }
  return data.id as string;
}
