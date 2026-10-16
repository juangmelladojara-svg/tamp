import "server-only";
import { sesionPortal } from "@/lib/yo/sesion";
import type { FilaDV } from "@/lib/yo/dataview";
import type { Meta, Tarea } from "@/lib/yo/vault";

// Lecturas de la oficina virtual. RLS deja ver solo las notas del dueño.

export type FilaOficina = FilaDV & { enlaces: string[]; sincronizado_en: string };

const COLUMNAS = "ruta, titulo, carpeta, meta, etiquetas, tareas, enlaces, modificado, sincronizado_en";

type Cruda = Omit<FilaOficina, "meta" | "tareas"> & { meta: unknown; tareas: unknown };

const limpiar = (f: Cruda): FilaOficina => ({
  ...f,
  meta: (f.meta ?? {}) as Meta,
  tareas: (Array.isArray(f.tareas) ? f.tareas : []) as Tarea[],
});

/** Todas las notas, sin contenido (para la recepción, las salas, los enlaces y Dataview). */
export async function cargarVault(): Promise<FilaOficina[]> {
  const { supabase } = await sesionPortal();
  const { data } = await supabase.from("vault_notas").select(COLUMNAS).order("ruta");
  return (data ?? []).map((f) => limpiar(f as Cruda));
}

/** Una nota con su contenido, o null si no existe. */
export async function cargarNota(ruta: string): Promise<(FilaOficina & { contenido: string }) | null> {
  const { supabase } = await sesionPortal();
  const { data } = await supabase.from("vault_notas").select(`${COLUMNAS}, contenido`).eq("ruta", ruta).maybeSingle();
  if (!data) return null;
  return { ...limpiar(data as Cruda), contenido: (data as { contenido: string }).contenido };
}

/** La primera sincronización con contenido deja `modificado`; las filas viejas (solo grafo) no lo tienen. */
export const vaultConContenido = (filas: FilaOficina[]) => filas.some((f) => f.modificado);

// ---- Formatos ----------------------------------------------------------------

export function fechaCorta(iso: string): string {
  const d = iso.length === 10 ? new Date(`${iso}T12:00:00Z`) : new Date(iso);
  return new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", year: "numeric", timeZone: iso.length === 10 ? "UTC" : "America/Santiago" }).format(d);
}

export function haceCuanto(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `hace ${d} día${d === 1 ? "" : "s"}`;
  return fechaCorta(iso);
}

export const pesos = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

/** "03 - Proyectos" → "Proyectos"; "📥 Inbox" queda igual. */
export const nombreSala = (carpeta: string) => carpeta.replace(/^\d+\s*-\s*/, "");
