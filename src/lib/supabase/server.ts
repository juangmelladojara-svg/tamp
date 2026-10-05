import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";
import type { Database } from "./tipos-db";

/**
 * Cliente de Supabase para componentes de servidor y server actions del panel.
 * Usa la sesión del usuario (cookies), así que RLS decide qué puede ver.
 */
export async function crearClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Llamado desde un componente de servidor, que no puede escribir
          // cookies. No importa: src/proxy.ts refresca la sesión en cada request.
        }
      },
    },
  });
}
