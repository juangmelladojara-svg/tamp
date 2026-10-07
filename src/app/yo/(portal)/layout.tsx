import Link from "next/link";
import { LogOut } from "lucide-react";
import { cerrarSesion } from "@/app/admin/login/acciones";
import { sesionPortal } from "@/lib/yo/sesion";

const ENLACES = [
  { href: "/", texto: "Mapa" },
  { href: "/hoy", texto: "Foco del día" },
  { href: "/seguimiento", texto: "Seguimiento" },
];

// Todo bajo (portal) exige sesión. El proxy ya filtra; esta es la segunda barrera.
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { perfil, email } = await sesionPortal();

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex flex-wrap items-center justify-between gap-3 px-5 py-4 md:px-8">
        <nav className="flex items-center gap-1 rounded-full border border-white/10 bg-[#0b0d22]/60 p-1 backdrop-blur">
          {ENLACES.map((e) => (
            <Link key={e.href} href={e.href} className="rounded-full px-3.5 py-1.5 text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white">
              {e.texto}
            </Link>
          ))}
          <a href="https://admin.tamp.cl" className="rounded-full px-3.5 py-1.5 text-sm text-pink-300 transition-colors hover:bg-white/10">
            TAMP
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs uppercase tracking-[0.2em] text-indigo-200/60 sm:inline">{perfil?.nombre ?? email}</span>
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm text-slate-300 backdrop-blur transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
              Salir
            </button>
          </form>
        </div>
      </header>
      {children}
    </>
  );
}
