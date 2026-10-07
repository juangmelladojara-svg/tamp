import "server-only";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";

/** Sesión del portal personal (yo.tamp.cl). Sin sesión, redirige a /login. */
export async function sesionPortal() {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id, nombre, rol")
    .eq("id", claims.sub)
    .maybeSingle();

  return { supabase, userId: claims.sub, email: (claims.email as string | undefined) ?? null, perfil };
}
