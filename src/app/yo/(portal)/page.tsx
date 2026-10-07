import { sesionPortal } from "@/lib/yo/sesion";
import Galaxia, { type NodoGalaxia } from "../Galaxia";

export const metadata = { title: "Inicio" };

// Mapa de la portada. Cada nodo es un espacio del portal; los que no tienen
// href aún no existen. Para sumar uno: agregarlo acá y crear su carpeta.
const NODOS: NodoGalaxia[] = [
  { id: "yo", titulo: "Juan", nota: "Centro del mapa", color: "#a5b4fc", x: 0.5, y: 0.46, radio: 30, enlaces: ["hoy", "tamp", "seguimiento"] },
  { id: "hoy", titulo: "Foco del día", nota: "Tareas y prioridades de hoy", href: "/hoy", color: "#38bdf8", x: 0.26, y: 0.3, radio: 22, enlaces: ["tareas"] },
  { id: "tareas", titulo: "Tareas", nota: "Todo lo pendiente", href: "/hoy", color: "#7dd3fc", x: 0.14, y: 0.55, radio: 15 },
  { id: "tamp", titulo: "TAMP", nota: "Leads, clientes y proyectos", color: "#f472b6", href: "https://admin.tamp.cl", x: 0.75, y: 0.3, radio: 24, enlaces: ["leads", "clientes"] },
  { id: "leads", titulo: "Leads", nota: "Prospectos en curso", href: "https://admin.tamp.cl/leads", color: "#f9a8d4", x: 0.88, y: 0.5, radio: 14 },
  { id: "clientes", titulo: "Clientes", nota: "Planes y pagos", href: "https://admin.tamp.cl/clientes", color: "#fbcfe8", x: 0.68, y: 0.58, radio: 14 },
  { id: "seguimiento", titulo: "Seguimiento", nota: "Ánimo, hábitos y rutina", href: "/seguimiento", color: "#c084fc", x: 0.45, y: 0.74, radio: 22, enlaces: ["animo", "habitos"] },
  { id: "animo", titulo: "Ánimo", nota: "Registro diario", href: "/seguimiento", color: "#d8b4fe", x: 0.3, y: 0.82, radio: 14 },
  { id: "habitos", titulo: "Hábitos", nota: "Rutina y constancia", href: "/seguimiento", color: "#e9d5ff", x: 0.6, y: 0.86, radio: 14 },
];

export default async function Inicio() {
  await sesionPortal();
  return <Galaxia nodos={NODOS} />;
}
