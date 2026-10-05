"use client";

import { useActionState } from "react";
import { iniciarSesion } from "./acciones";

export default function FormularioLogin() {
  const [error, accion, pendiente] = useActionState(iniciarSesion, null);

  const campo =
    "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-ink-900 outline-none transition-colors placeholder:text-ink-300 focus:border-ink-900";

  return (
    <form action={accion} className="grid gap-4">
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-ink-500">Correo</span>
        <input name="email" type="email" required autoComplete="username" autoFocus className={campo} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-ink-500">Contraseña</span>
        <input name="password" type="password" required autoComplete="current-password" className={campo} />
      </label>
      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pendiente}
        className="mt-2 rounded-full bg-ink-900 py-3.5 font-medium text-ink-50 transition-colors hover:bg-ink-700 disabled:opacity-60"
      >
        {pendiente ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
