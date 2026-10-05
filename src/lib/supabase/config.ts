// ---------------------------------------------------------------------------
// Proyecto Supabase de TAMP (panel admin.tamp.cl y captura de leads).
//
// La URL y la clave publicable están hechas para viajar al navegador: no son
// secretas. Lo que protege los datos son las políticas RLS de la base (solo
// los miembros del equipo, con fila en `perfiles`, leen o escriben).
// La clave secreta va aparte, solo en el servidor: ver servicio.ts.
// ---------------------------------------------------------------------------

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://smbypngcqeqcffbhjmyd.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_DiLNWbJz3sxYMAyGK7-mfQ_LStisFTV";
