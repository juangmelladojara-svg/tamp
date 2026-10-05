import "server-only";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * Sesión del panel. Sin sesión, redirige a /login. Devuelve el perfil del
 * equipo, o null si el usuario existe pero no es parte del equipo (en ese
 * caso RLS igual le devuelve todo vacío).
 */
export async function sesionPanel() {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id, nombre, rol")
    .eq("id", claims.sub)
    .maybeSingle();

  return { supabase, email: (claims.email as string | undefined) ?? null, perfil };
}

/** Para server actions: exige ser miembro del equipo. */
export async function sesionMiembro() {
  const sesion = await sesionPanel();
  if (!sesion.perfil) throw new Error("Tu cuenta no tiene acceso al panel.");
  return sesion;
}
