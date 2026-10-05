// ---------------------------------------------------------------------------
// Panel admin.tamp.cl: etiquetas de estados y formatos (pesos, fechas).
// Los valores de cada estado son los mismos que validan los CHECK de la base.
// ---------------------------------------------------------------------------

export type Tono = "azul" | "ambar" | "verde" | "rojo" | "gris" | "tinta";

type Opciones<K extends string> = Record<K, { etiqueta: string; tono: Tono }>;

export const ESTADOS_LEAD = {
  nuevo: { etiqueta: "Nuevo", tono: "azul" },
  contactado: { etiqueta: "Contactado", tono: "ambar" },
  conversando: { etiqueta: "Conversando", tono: "ambar" },
  propuesta: { etiqueta: "Propuesta enviada", tono: "tinta" },
  ganado: { etiqueta: "Ganado", tono: "verde" },
  perdido: { etiqueta: "Perdido", tono: "gris" },
} satisfies Opciones<string>;

export const ORIGENES_LEAD = {
  diagnostico: { etiqueta: "Diagnóstico", tono: "azul" },
  whatsapp: { etiqueta: "WhatsApp", tono: "verde" },
  referido: { etiqueta: "Referido", tono: "tinta" },
  redes: { etiqueta: "Redes", tono: "ambar" },
  manual: { etiqueta: "Manual", tono: "gris" },
  otro: { etiqueta: "Otro", tono: "gris" },
} satisfies Opciones<string>;

export const ESTADOS_CLIENTE = {
  activo: { etiqueta: "Activo", tono: "verde" },
  pausado: { etiqueta: "Pausado", tono: "ambar" },
  terminado: { etiqueta: "Terminado", tono: "gris" },
} satisfies Opciones<string>;

export const TIPOS_PROYECTO = {
  web: { etiqueta: "Sitio / app web", tono: "tinta" },
  automatizacion: { etiqueta: "Automatización", tono: "azul" },
  agente_ia: { etiqueta: "Agente de IA", tono: "azul" },
  integracion: { etiqueta: "Integración", tono: "tinta" },
  soporte: { etiqueta: "Soporte", tono: "gris" },
  otro: { etiqueta: "Otro", tono: "gris" },
} satisfies Opciones<string>;

export const ESTADOS_PROYECTO = {
  propuesta: { etiqueta: "Propuesta", tono: "gris" },
  en_desarrollo: { etiqueta: "En desarrollo", tono: "azul" },
  entregado: { etiqueta: "Entregado", tono: "verde" },
  en_mantencion: { etiqueta: "En mantención", tono: "verde" },
  cerrado: { etiqueta: "Cerrado", tono: "gris" },
} satisfies Opciones<string>;

export const ESTADOS_PAGO = {
  pendiente: { etiqueta: "Pendiente", tono: "ambar" },
  pagado: { etiqueta: "Pagado", tono: "verde" },
  anulado: { etiqueta: "Anulado", tono: "gris" },
} satisfies Opciones<string>;

/** Etiqueta y tono de un valor; si llega algo desconocido, se muestra tal cual. */
export function opcion<T extends Record<string, { etiqueta: string; tono: Tono }>>(mapa: T, valor: string | null) {
  return (valor && (mapa as Record<string, { etiqueta: string; tono: Tono }>)[valor]) || { etiqueta: valor ?? "—", tono: "gris" as Tono };
}

const ZONA = "America/Santiago";

const pesos = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
export function clp(monto: number | null | undefined): string {
  return monto == null ? "—" : pesos.format(monto);
}

/** Fecha corta. Acepta timestamps y fechas puras (YYYY-MM-DD, que se leen sin zona). */
export function fecha(valor: string | null | undefined): string {
  if (!valor) return "—";
  const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(valor);
  const d = new Date(soloFecha ? `${valor}T12:00:00` : valor);
  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(soloFecha ? {} : { timeZone: ZONA }),
  }).format(d);
}

export function fechaHora(valor: string | null | undefined): string {
  if (!valor) return "—";
  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ZONA,
  }).format(new Date(valor));
}

const relativo = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
export function hace(valor: string | null | undefined): string {
  if (!valor) return "—";
  const seg = (new Date(valor).getTime() - Date.now()) / 1000;
  const pasos: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unidad, s] of pasos) {
    if (Math.abs(seg) >= s) return relativo.format(Math.round(seg / s), unidad);
  }
  return "recién";
}

/** Hoy en Santiago como YYYY-MM-DD (para comparar con columnas `date`). */
export function hoy(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(new Date());
}

export function enlaceWhatsApp(numero: string, texto?: string): string {
  const digitos = numero.replace(/[^\d]/g, "");
  return `https://wa.me/${digitos}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
}

export function dominio(url: string | null | undefined): string {
  if (!url) return "—";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
