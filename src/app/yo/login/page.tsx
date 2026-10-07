import type { Metadata } from "next";
import Logo from "@/components/Logo";
import FormularioLogin from "@/app/admin/login/FormularioLogin";
import Galaxia from "../Galaxia";

export const metadata: Metadata = { title: "Entrar" };

export default function PaginaLogin() {
  return (
    <main className="relative grid min-h-dvh place-items-center px-5 py-16">
      <Galaxia nodos={[]} />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-10 text-center text-white">
          <Logo className="text-3xl" />
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-indigo-300/70">Portal personal</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white p-7 text-ink-900 shadow-[0_0_80px_-20px_rgba(99,102,241,0.5)]">
          <FormularioLogin />
        </div>
      </div>
    </main>
  );
}
