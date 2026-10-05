import Link from "next/link";
import { LogOut } from "lucide-react";
import Logo from "@/components/Logo";
import { sesionPanel } from "@/lib/admin/sesion";
import { cerrarSesion } from "../login/acciones";
import NavPanel from "./NavPanel";

// Todo lo que está bajo (panel) exige sesión y ser parte del equipo. El proxy
// ya filtra sin sesión; esta es la segunda barrera (y RLS la tercera).
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { perfil, email } = await sesionPanel();

  const salir = (
    <form action={cerrarSesion}>
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-500 transition-colors hover:bg-black/5 hover:text-ink-900"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.5} />
        Salir
      </button>
    </form>
  );

  if (!perfil) {
    return (
      <main className="grid min-h-dvh place-items-center px-5">
        <div className="max-w-sm text-center">
          <Logo className="text-3xl" />
          <h1 className="mt-8 font-display text-2xl font-semibold tracking-tight">Tu cuenta no tiene acceso</h1>
          <p className="mt-3 text-ink-500">
            {email ? `${email} inició sesión, pero no es parte del equipo.` : "Esta cuenta no es parte del equipo."} Pídele a un
            administrador que te agregue.
          </p>
          <div className="mt-6 flex justify-center">{salir}</div>
        </div>
      </main>
    );
  }

  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-black/5 bg-white/60 px-4 py-6 lg:flex">
        <Link href="/" className="mb-8 flex items-baseline gap-2 px-3">
          <Logo className="text-xl" />
          <span className="label">Panel</span>
        </Link>
        <NavPanel />
        <div className="mt-auto border-t border-black/5 pt-4">
          <p className="truncate px-3 text-sm font-medium">{perfil.nombre}</p>
          <p className="mb-2 truncate px-3 text-xs text-ink-400">{email}</p>
          {salir}
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-black/5 bg-ink-50/90 px-5 pt-4 backdrop-blur-xl lg:hidden">
        <div className="mb-3 flex items-center justify-between">
          <Link href="/" className="flex items-baseline gap-2">
            <Logo className="text-lg" />
            <span className="label">Panel</span>
          </Link>
          {salir}
        </div>
        <NavPanel horizontal />
      </header>

      <main className="min-w-0 px-5 py-8 md:px-8 lg:px-12 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
