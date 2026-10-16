"use server";

import { revalidatePath } from "next/cache";
import { sesionPortal } from "@/lib/yo/sesion";
import { carpetaDeRuta, ignorarRuta, tituloDeRuta, type NotaVault } from "@/lib/yo/vault";

// Sincronización de la oficina virtual. El navegador lee la carpeta del vault
// y manda las notas ya procesadas en lotes; acá se validan y se guardan con la
// sesión del usuario (RLS: solo puede escribir sus propias filas).

const MAX_LOTE = 100;

const esTexto = (v: unknown, max: number): v is string => typeof v === "string" && v.length <= max;
const listaDeTextos = (v: unknown, maxItems: number, maxLargo: number) =>
  Array.isArray(v) && v.length <= maxItems && v.every((x) => esTexto(x, maxLargo));

function valida(n: NotaVault): boolean {
  return (
    esTexto(n?.ruta, 500) &&
    !ignorarRuta(n.ruta) &&
    n.titulo === tituloDeRuta(n.ruta) &&
    n.carpeta === carpetaDeRuta(n.ruta) &&
    esTexto(n.contenido, 300_000) &&
    typeof n.meta === "object" &&
    n.meta !== null &&
    !Array.isArray(n.meta) &&
    JSON.stringify(n.meta).length <= 20_000 &&
    listaDeTextos(n.etiquetas, 200, 200) &&
    listaDeTextos(n.enlaces, 1000, 500) &&
    Array.isArray(n.tareas) &&
    n.tareas.length <= 1000 &&
    n.tareas.every((t) => esTexto(t?.texto, 2000) && (t.fecha === undefined || esTexto(t.fecha, 10))) &&
    (n.modificado === null || (esTexto(n.modificado, 40) && !Number.isNaN(Date.parse(n.modificado))))
  );
}

export async function guardarNotas(notas: NotaVault[]): Promise<{ error?: string }> {
  if (!Array.isArray(notas) || notas.length > MAX_LOTE) return { error: "Lote inválido." };
  const invalida = notas.find((n) => !valida(n));
  if (invalida) return { error: `La nota "${String(invalida?.ruta).slice(0, 80)}" no se pudo leer.` };

  const { supabase, userId } = await sesionPortal();
  const ahora = new Date().toISOString();
  const { error } = await supabase.from("vault_notas").upsert(
    notas.map((n) => ({
      user_id: userId,
      ruta: n.ruta,
      titulo: n.titulo,
      carpeta: n.carpeta,
      contenido: n.contenido,
      meta: n.meta,
      etiquetas: n.etiquetas,
      tareas: n.tareas,
      enlaces: n.enlaces,
      modificado: n.modificado,
      sincronizado_en: ahora,
    })),
    { onConflict: "user_id,ruta" },
  );
  return error ? { error: "No se pudieron guardar las notas. Inténtalo de nuevo." } : {};
}

/** Borra de la oficina las notas que ya no están en el vault (borradas o movidas). */
export async function podarVault(vigentes: string[]): Promise<{ error?: string; borradas?: number }> {
  if (!listaDeTextos(vigentes, 20_000, 500) || vigentes.length === 0) return { error: "Lista de notas inválida." };

  const { supabase } = await sesionPortal();
  const { data, error } = await supabase.from("vault_notas").select("ruta");
  if (error) return { error: "No se pudo revisar la oficina." };

  const set = new Set(vigentes);
  const sobrantes = (data ?? []).map((f) => f.ruta).filter((r) => !set.has(r));
  for (let i = 0; i < sobrantes.length; i += 100) {
    const { error: e } = await supabase.from("vault_notas").delete().in("ruta", sobrantes.slice(i, i + 100));
    if (e) return { error: "No se pudieron quitar las notas borradas." };
  }

  revalidatePath("/yo", "layout");
  return { borradas: sobrantes.length };
}
