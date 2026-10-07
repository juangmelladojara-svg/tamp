"use server";

import { revalidatePath } from "next/cache";
import { sesionPortal } from "@/lib/yo/sesion";
import { fechaHoy } from "@/lib/yo/fecha";

// Todas las escrituras van con la sesión del usuario: RLS (user_id = auth.uid())
// garantiza que solo toca sus propias filas.

const texto = (d: FormData, k: string) => String(d.get(k) ?? "").trim();

// ---- Tareas -------------------------------------------------------------

export async function crearTarea(datos: FormData) {
  const titulo = texto(datos, "titulo").slice(0, 300);
  if (!titulo) return;
  const prioridad = Math.min(3, Math.max(1, Number(datos.get("prioridad")) || 2));
  const { supabase } = await sesionPortal();
  await supabase.from("tareas").insert({ titulo, prioridad, foco: datos.get("foco") === "on" });
  revalidatePath("/yo/hoy");
}

export async function alternarTarea(datos: FormData) {
  const id = texto(datos, "id");
  const hecha = datos.get("hecha") === "1";
  const { supabase } = await sesionPortal();
  await supabase
    .from("tareas")
    .update({ hecha: !hecha, hecha_en: hecha ? null : new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/yo/hoy");
}

export async function alternarFoco(datos: FormData) {
  const id = texto(datos, "id");
  const foco = datos.get("foco") === "1";
  const { supabase } = await sesionPortal();
  await supabase.from("tareas").update({ foco: !foco }).eq("id", id);
  revalidatePath("/yo/hoy");
}

export async function borrarTarea(datos: FormData) {
  const { supabase } = await sesionPortal();
  await supabase.from("tareas").delete().eq("id", texto(datos, "id"));
  revalidatePath("/yo/hoy");
}

// ---- Seguimiento --------------------------------------------------------

export async function guardarAnimo(datos: FormData) {
  const animo = Number(datos.get("animo"));
  if (!(animo >= 1 && animo <= 5)) return;
  const energia = Number(datos.get("energia")) || null;
  const sueno = datos.get("sueno") ? Number(datos.get("sueno")) : null;
  const nota = texto(datos, "nota").slice(0, 2000) || null;
  const { supabase, userId } = await sesionPortal();
  await supabase.from("animo").upsert(
    {
      user_id: userId,
      fecha: fechaHoy(),
      animo,
      energia: energia && energia >= 1 && energia <= 5 ? energia : null,
      sueno_horas: sueno !== null && sueno >= 0 && sueno <= 24 ? sueno : null,
      nota,
    },
    { onConflict: "user_id,fecha" },
  );
  revalidatePath("/yo/seguimiento");
}

export async function crearHabito(datos: FormData) {
  const nombre = texto(datos, "nombre").slice(0, 100);
  if (!nombre) return;
  const { supabase } = await sesionPortal();
  await supabase.from("habitos").insert({ nombre });
  revalidatePath("/yo/seguimiento");
}

export async function alternarHabito(datos: FormData) {
  const habitoId = texto(datos, "id");
  const hecho = datos.get("hecho") === "1";
  const { supabase, userId } = await sesionPortal();
  if (hecho) {
    await supabase.from("habitos_registro").delete().eq("habito_id", habitoId).eq("fecha", fechaHoy());
  } else {
    await supabase
      .from("habitos_registro")
      .upsert({ habito_id: habitoId, user_id: userId, fecha: fechaHoy() }, { onConflict: "habito_id,fecha" });
  }
  revalidatePath("/yo/seguimiento");
}

export async function archivarHabito(datos: FormData) {
  const { supabase } = await sesionPortal();
  await supabase.from("habitos").update({ activo: false }).eq("id", texto(datos, "id"));
  revalidatePath("/yo/seguimiento");
}
