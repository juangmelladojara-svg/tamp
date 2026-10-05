"use server";

import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";

export async function iniciarSesion(_previo: string | null, datos: FormData): Promise<string | null> {
  const email = String(datos.get("email") ?? "").trim().toLowerCase();
  const password = String(datos.get("password") ?? "");
  if (!email || !password) return "Escribe tu correo y tu contraseña.";

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  // Mensaje genérico: no revelar si el correo existe.
  if (error) return "Correo o contraseña incorrectos.";

  redirect("/");
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}
