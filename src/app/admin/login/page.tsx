import type { Metadata } from "next";
import Logo from "@/components/Logo";
import FormularioLogin from "./FormularioLogin";

export const metadata: Metadata = { title: "Entrar" };

export default function PaginaLogin() {
  return (
    <main className="grid min-h-dvh place-items-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <Logo className="text-3xl" />
          <p className="label mt-3">Panel de administración</p>
        </div>
        <div className="rounded-3xl border border-black/[0.06] bg-white p-7 shadow-[0_1px_2px_rgba(11,11,12,0.04)]">
          <FormularioLogin />
        </div>
        <p className="mt-6 text-center text-xs text-ink-400">Acceso solo para el equipo de TAMP.</p>
      </div>
    </main>
  );
}
