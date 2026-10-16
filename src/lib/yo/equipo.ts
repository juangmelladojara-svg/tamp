// ---------------------------------------------------------------------------
// Equipo de la oficina virtual (yo.tamp.cl/oficina): un Jefe de Gabinete que
// reparte los encargos y un coordinador por cada tema general del vault.
// Cada coordinador "ve" las notas de sus carpetas (por prefijo numérico) y las
// que llevan sus etiquetas.
// ---------------------------------------------------------------------------

import type { FilaDV } from "./dataview";
import { RAIZ } from "./vault";

export type Look = {
  skin: string;
  hair: string;
  top: string;
  pants: string;
  peinado: "corto" | "largo" | "moño";
  shirt?: string;
};

export type IdCoordinador = "negocio" | "proyectos" | "finanzas" | "salud" | "aprendizaje" | "sistemas" | "vida";

export type Coordinador = {
  id: IdCoordinador;
  nombre: string;
  corto: string;
  titulo: string;
  ini: string;
  color: string;
  rol: string;
  /** Prefijos de carpeta de primer nivel ("04" → "04 - Finanzas"). */
  carpetas: string[];
  etiquetas: string[];
  /** Palabras (sin tildes) con que el Jefe de Gabinete reconoce un encargo de este tema. */
  palabras: string[];
  look: Look;
};

export const JEFE = {
  id: "jefe" as const,
  nombre: "Jefe de Gabinete",
  ini: "JG",
  color: "#119C8D",
  rol: "Recibe todos tus encargos, decide a qué coordinador le corresponden y se los lleva. Vigila tus avisos (pagos, metas, tareas con fecha) y te da el parte del día. Si un coordinador está ocupado, deja el encargo en su cola.",
  carpetas: ["00", "📥"],
  look: { skin: "#E2A985", hair: "#1F1A17", top: "#119C8D", pants: "#24303D", peinado: "corto", shirt: "#FFFFFF" } satisfies Look,
};

export const DIRECTOR = {
  id: "juan" as const,
  nombre: "Juan",
  ini: "JM",
  color: "#1C4173",
  rol: "Encargas el trabajo, revisas y apruebas. Los coordinadores preparan; nada sale de la oficina sin tu aprobación.",
  look: { skin: "#E8B896", hair: "#2B1D14", top: "#1C4173", pants: "#1B2B45", peinado: "corto", shirt: "#FFFFFF" } satisfies Look,
};

export const COORDINADORES: Coordinador[] = [
  {
    id: "negocio",
    nombre: "Negocio y TAMP",
    corto: "Negocio",
    titulo: "Coordinador de Negocio y TAMP",
    ini: "NE",
    color: "#E5675A",
    rol: "Lleva TAMP y tu trabajo: clientes, prospectos, propuestas, marketing y la Constructora García. Te dice en qué etapa va cada prospecto y qué tareas del negocio siguen abiertas.",
    carpetas: ["02"],
    etiquetas: ["tamp", "cliente", "prospecto", "negocio"],
    palabras: ["tamp", "cliente", "prospecto", "propuesta", "cotiza", "venta", "vender", "marketing", "landing", "lead", "diagnostico", "constructora", "garcia", "unysoft", "orden de compra", "trabajo", "empresa", "negocio", "maria", "captacion"],
    look: { skin: "#8D5A3B", hair: "#1A1412", top: "#E5675A", pants: "#2E3440", peinado: "corto" },
  },
  {
    id: "proyectos",
    nombre: "Proyectos",
    corto: "Proyectos",
    titulo: "Coordinador de Proyectos",
    ini: "PR",
    color: "#3B6FD8",
    rol: "Sigue cada proyecto activo: su meta, su estado y sus tareas abiertas. Te propone el siguiente paso concreto de cada uno.",
    carpetas: ["03"],
    etiquetas: ["proyecto"],
    palabras: ["proyecto", "avance", "plan", "entrega", "plazo", "meta", "hito", "prototipo", "bot", "telegram", "laboratorio", "plotter", "muebleria", "distribuidora", "framework", "convenios"],
    look: { skin: "#E9B994", hair: "#2B1D14", top: "#3B6FD8", pants: "#2C3442", peinado: "corto", shirt: "#FFFFFF" },
  },
  {
    id: "finanzas",
    nombre: "Finanzas",
    corto: "Finanzas",
    titulo: "Coordinadora de Finanzas",
    ini: "FI",
    color: "#2FA36B",
    rol: "Lleva tus préstamos y deudas: saldo, cuota mensual y próximos pagos. Te avisa de lo que vence y de las fechas que hay que actualizar en las notas.",
    carpetas: ["04"],
    etiquetas: ["finanzas", "prestamo"],
    palabras: ["deuda", "debo", "prestamo", "pago", "pagar", "cuota", "credito", "banco", "gasto", "presupuesto", "ahorro", "sueldo", "plata", "dinero", "caja", "finanza", "vence"],
    look: { skin: "#C98E68", hair: "#5A2E1A", top: "#2FA36B", pants: "#2B3340", peinado: "largo" },
  },
  {
    id: "salud",
    nombre: "Salud y Bienestar",
    corto: "Salud",
    titulo: "Coordinadora de Salud y Bienestar",
    ini: "SA",
    color: "#D9488B",
    rol: "Ordena tus notas de salud, hábitos y rutina. Te recuerda lo que anotaste; no da consejos médicos: eso queda con tu equipo tratante.",
    carpetas: ["05"],
    etiquetas: ["salud", "habito"],
    palabras: ["salud", "animo", "sueno", "dormir", "ejercicio", "habito", "medicacion", "medico", "terapia", "energia", "bienestar", "deporte", "rutina", "descanso"],
    look: { skin: "#F1CBA8", hair: "#8A5A2B", top: "#D9488B", pants: "#2A3140", peinado: "moño" },
  },
  {
    id: "aprendizaje",
    nombre: "Aprendizaje",
    corto: "Aprend.",
    titulo: "Coordinador de Aprendizaje y Conocimiento",
    ini: "AP",
    color: "#7B61D1",
    rol: "Cuida lo que estudias y lo que sabes: cursos, lecturas, ideas y notas de conocimiento. Te ayuda a retomar lo que dejaste a medias.",
    carpetas: ["06", "07"],
    etiquetas: ["idea", "semilla", "aprendizaje", "conocimiento"],
    palabras: ["aprender", "curso", "libro", "leer", "lectura", "estudiar", "idea", "concepto", "resumen", "investiga", "conocimiento", "ingles", "aprendizaje"],
    look: { skin: "#D7A47F", hair: "#B5532A", top: "#7B61D1", pants: "#2C3442", peinado: "largo", shirt: "#FFFFFF" },
  },
  {
    id: "sistemas",
    nombre: "Sistemas",
    corto: "Sistemas",
    titulo: "Coordinador de Sistemas y Automatización",
    ini: "SI",
    color: "#0EA5C6",
    rol: "Lleva tus automatizaciones, scripts, skills y herramientas (n8n, Claude, Obsidian, Vercel). Sabe qué está andando y qué quedó pendiente de configurar.",
    carpetas: ["08"],
    etiquetas: ["automatizacion", "sistema", "script", "skill"],
    palabras: ["automatiza", "n8n", "script", "skill", "mcp", "claude", "agente", "sistema", "obsidian", "vault", "sincroniza", "servidor", "vercel", "supabase", "laptop", "computador", "herramienta"],
    look: { skin: "#E0AC88", hair: "#3B2618", top: "#0EA5C6", pants: "#24303D", peinado: "corto" },
  },
  {
    id: "vida",
    nombre: "Vida Personal",
    corto: "Vida",
    titulo: "Coordinadora de Vida Personal",
    ini: "VI",
    color: "#E3A23B",
    rol: "Acompaña lo personal: familia, hogar, viajes, comunidad, creatividad, reflexión y legado. Te avisa cuando el Diario lleva días sin escribirse.",
    carpetas: ["01", "09", "10", "11", "12", "13", "14"],
    etiquetas: ["familia", "personal", "reflexion"],
    palabras: ["familia", "hijo", "hija", "elisa", "casa", "hogar", "viaje", "viajar", "amigo", "comunidad", "redes", "creativ", "estoic", "reflexion", "espiritual", "legado", "cumpleanos", "personal", "diario", "relacion"],
    look: { skin: "#EBC19E", hair: "#3B2618", top: "#E3A23B", pants: "#1B2B45", peinado: "largo" },
  },
];

export const sinTildes = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/** ¿La nota es del área de este coordinador? (por carpeta o por etiqueta). */
export function esDelArea(c: { carpetas: string[]; etiquetas?: string[] }, n: FilaDV): boolean {
  if (n.ruta.startsWith("Plantillas/")) return false;
  const carpeta = n.carpeta === RAIZ ? "📥" : n.carpeta;
  if (c.carpetas.some((p) => carpeta.startsWith(p))) return true;
  return (c.etiquetas ?? []).some((e) => n.etiquetas.includes(e));
}
