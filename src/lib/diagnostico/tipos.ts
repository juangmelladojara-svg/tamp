// ---------------------------------------------------------------------------
// Diagnóstico TAMP — tipos compartidos entre el analizador (servidor) y la
// página de resultados (cliente).
// ---------------------------------------------------------------------------

export type CategoriaId = "ia" | "seo" | "movil" | "tecnico";

export const CATEGORIAS: Record<CategoriaId, { titulo: string; bajada: string }> = {
  ia: {
    titulo: "¿Te encuentra la IA?",
    bajada: "Si ChatGPT, Perplexity o Google AI pueden leer tu web y recomendarte.",
  },
  seo: {
    titulo: "Google",
    bajada: "Lo básico para aparecer y verse bien en los resultados de búsqueda.",
  },
  movil: {
    titulo: "Celular",
    bajada: "Cómo se ve y se usa tu web desde un teléfono.",
  },
  tecnico: {
    titulo: "Técnico",
    bajada: "Seguridad y velocidad: lo que nadie ve, pero todos sienten.",
  },
};

export type Estado = "ok" | "mejorable" | "falta";

export type Chequeo = {
  id: string;
  categoria: CategoriaId;
  titulo: string;
  estado: Estado;
  puntos: number;
  max: number;
  /** Qué encontramos, en una línea. */
  detalle: string;
  /** Por qué le importa al dueño del negocio. */
  porQue: string;
  /** Qué hay que hacer (solo se muestra si no está ok). */
  comoArreglar: string;
};

export type ResultadoDiagnostico = {
  url: string;
  urlFinal: string;
  nota: number;
  porCategoria: Record<CategoriaId, number>;
  chequeos: Chequeo[];
  /** Chequeos que no se pudieron correr (ej. la medición de velocidad de Google). */
  omitidos: string[];
  analizadoEn: string;
};

/** Lo que devuelve /api/diagnostico: el resultado y el id con que quedó guardado (null si no se guardó). */
export type RespuestaDiagnostico = ResultadoDiagnostico & { id: string | null };
