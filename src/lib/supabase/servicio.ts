import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";
import type { Database, Json } from "./tipos-db";

export type { Json };

/**
 * Cliente con la clave secreta: se salta RLS. Solo lo usan las rutas públicas
 * de tamp.cl que guardan datos calculados en el servidor (el diagnóstico y el
 * formulario de lead), nunca el panel.
 *
 * Devuelve null si SUPABASE_SECRET_KEY no está configurada: en ese caso el
 * diagnóstico sigue funcionando, solo que no se guarda.
 */
export function clienteServicio() {
  const clave = process.env.SUPABASE_SECRET_KEY;
  if (!clave) return null;
  return createClient<Database>(SUPABASE_URL, clave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
