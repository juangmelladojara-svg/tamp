import { sesionPortal } from "@/lib/yo/sesion";
import Galaxia, { type NodoGalaxia } from "../Galaxia";
import GrafoVault from "../GrafoVault";

export const metadata = { title: "Mapa" };

// Respaldo si el vault aún no se ha sincronizado: mapa fijo de espacios del portal.
const NODOS: NodoGalaxia[] = [
  { id: "yo", titulo: "Juan", nota: "Centro del mapa", color: "#a5b4fc", x: 0.5, y: 0.46, radio: 30, enlaces: ["hoy", "tamp", "seguimiento"] },
  { id: "hoy", titulo: "Foco del día", nota: "Tareas y prioridades de hoy", href: "/hoy", color: "#38bdf8", x: 0.26, y: 0.3, radio: 22 },
  { id: "tamp", titulo: "TAMP", nota: "Leads, clientes y proyectos", color: "#f472b6", href: "https://admin.tamp.cl", x: 0.75, y: 0.3, radio: 24 },
  { id: "seguimiento", titulo: "Seguimiento", nota: "Ánimo, hábitos y rutina", href: "/seguimiento", color: "#c084fc", x: 0.45, y: 0.74, radio: 22 },
];

export default async function Inicio() {
  const { supabase } = await sesionPortal();
  const { data } = await supabase.from("vault_notas").select("ruta, titulo, carpeta, enlaces").order("ruta");

  if (!data?.length) return <Galaxia nodos={NODOS} />;
  return <GrafoVault notas={data} />;
}
