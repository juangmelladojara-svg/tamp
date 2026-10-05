"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

/** Botón de formulario que se deshabilita mientras la server action corre. */
export default function BotonEnviar({
  children,
  pendiente = "Guardando…",
  variante = "primario",
  confirmar,
  className = "",
}: {
  children: ReactNode;
  pendiente?: string;
  variante?: "primario" | "secundario" | "peligro";
  /** Si se indica, pide confirmación antes de enviar. */
  confirmar?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  const estilos = {
    primario: "bg-ink-900 text-ink-50 hover:bg-ink-700",
    secundario: "border border-black/10 bg-white text-ink-900 hover:border-black/25",
    peligro: "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50",
  }[variante];
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (confirmar && !window.confirm(confirmar)) e.preventDefault();
      }}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 ${estilos} ${className}`}
    >
      {pending ? pendiente : children}
    </button>
  );
}
