import type { Coordinador, IdCoordinador, Look } from "@/lib/yo/equipo";
import type { Enlace, Respuesta } from "@/lib/yo/simulacion";

/** Lo que el motor necesita saber del área de cada coordinador. */
export type StatsCoordinador = {
  notas: number;
  tareas: number;
  carpetas: string[];
  destacadas: Enlace[];
  sala: string | null;
};

export type CoordinadorEscena = Coordinador & { stats: StatsCoordinador };

export type PersonaEscena = { nombre: string; ini: string; color: string; rol: string; look: Look };

export type OpcionesOficina = {
  coordinadores: CoordinadorEscena[];
  jefe: PersonaEscena;
  director: PersonaEscena;
  marca: { titulo: string; subtitulo: string };
  /** Familias de fuente reales (las de next/font), para los letreros dibujados en canvas. */
  fuentes: { display: string; sans: string };
  parte: string;
  sugerencias: string[];
  /** Borrador listo para revisar al abrir (p. ej. pagos vencidos). */
  inicial: { id: IdCoordinador; texto: string; respuesta: Respuesta } | null;
  enrutar: (texto: string) => IdCoordinador | null;
  responder: (id: IdCoordinador, texto: string) => Respuesta;
  navegar: (href: string) => void;
};
