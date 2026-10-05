import { Building2, FolderKanban, Gauge, Inbox, LayoutDashboard, type LucideIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// Menú del panel. Cada módulo es una carpeta en src/app/admin/(panel)/ y una
// entrada acá; el menú lateral y el de celular se arman solos desde esta lista.
//
// Para sumar un panel personal:
//   1. crear src/app/admin/(panel)/<ruta>/page.tsx
//   2. agregar { href: "/<ruta>", titulo, icono, grupo: "Personal" } abajo.
// ---------------------------------------------------------------------------

export type Modulo = {
  href: string;
  titulo: string;
  icono: LucideIcon;
  grupo: "Negocio" | "Personal";
};

export const MODULOS: Modulo[] = [
  { href: "/", titulo: "Inicio", icono: LayoutDashboard, grupo: "Negocio" },
  { href: "/leads", titulo: "Leads", icono: Inbox, grupo: "Negocio" },
  { href: "/diagnosticos", titulo: "Diagnósticos", icono: Gauge, grupo: "Negocio" },
  { href: "/clientes", titulo: "Clientes", icono: Building2, grupo: "Negocio" },
  { href: "/proyectos", titulo: "Proyectos", icono: FolderKanban, grupo: "Negocio" },
  // Paneles personales: agregar acá.
];
