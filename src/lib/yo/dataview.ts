// ---------------------------------------------------------------------------
// Intérprete mínimo de Dataview (DQL) para la oficina virtual.
//
// Cubre lo que usan las notas del vault: TABLE [WITHOUT ID] / LIST / TASK,
// FROM #etiqueta | "carpeta" (con OR), WHERE con AND/OR, =, !=, <, <=, >, >=,
// contains(), !, date(today), dur(N days), this.file.*, SORT y LIMIT.
// Lo que no entiende lo ignora y marca el resultado como aproximado.
// Las plantillas nunca entran (en Obsidian sí, pero acá serían ruido).
// ---------------------------------------------------------------------------

import { directorioDeRuta, type Meta, type Tarea, type ValorMeta } from "./vault";

export type FilaDV = {
  ruta: string;
  titulo: string;
  carpeta: string;
  meta: Meta;
  etiquetas: string[];
  tareas: Tarea[];
  modificado: string | null;
};

export type Celda = { nota: FilaDV } | string;

export type ResultadoDV =
  | { tipo: "tabla"; columnas: string[]; filas: Celda[][]; aproximada: boolean }
  | { tipo: "lista"; notas: FilaDV[]; aproximada: boolean }
  | { tipo: "tareas"; grupos: { nota: FilaDV; tareas: Tarea[] }[]; aproximada: boolean }
  | { tipo: "no-soportada"; motivo: string };

type Valor = ValorMeta | undefined | { nota: FilaDV };

const esFechaISO = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}/.test(s);

function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha.slice(0, 10)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Separa por un separador de nivel superior (fuera de comillas y paréntesis). */
function partir(s: string, sep: RegExp): string[] {
  const partes: string[] = [];
  let nivel = 0;
  let comillas = false;
  let actual = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"') comillas = !comillas;
    if (!comillas && c === "(") nivel++;
    if (!comillas && c === ")") nivel--;
    if (!comillas && nivel === 0) {
      const m = s.slice(i).match(sep);
      if (m && m.index === 0) {
        partes.push(actual.trim());
        actual = "";
        i += m[0].length - 1;
        continue;
      }
    }
    actual += c;
  }
  if (actual.trim()) partes.push(actual.trim());
  return partes;
}

function formatoFecha(iso: string, formato: string): string {
  const d = new Date(iso);
  const parte = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("es-CL", { timeZone: "America/Santiago", ...o }).format(d);
  return formato
    .replace("yyyy", parte({ year: "numeric" }))
    .replace("MM", parte({ month: "2-digit" }))
    .replace("dd", parte({ day: "2-digit" }))
    .replace("HH", parte({ hour: "2-digit", hourCycle: "h23" }).padStart(2, "0"))
    .replace("mm", parte({ minute: "2-digit" }).padStart(2, "0"));
}

class Contexto {
  aproximada = false;
  readonly actual: FilaDV;
  readonly hoy: string;
  constructor(actual: FilaDV, hoy: string) {
    this.actual = actual;
    this.hoy = hoy;
  }

  campoArchivo(n: FilaDV, campo: string): Valor {
    switch (campo) {
      case "link":
        return { nota: n };
      case "name":
        return n.titulo;
      case "path":
        return n.ruta;
      case "folder":
        return directorioDeRuta(n.ruta);
      case "mtime":
        return n.modificado;
      case "ctime":
        return (n.meta.creado as string) ?? null;
      case "day":
        return esFechaISO(n.titulo) ? n.titulo.slice(0, 10) : esFechaISO(n.meta.fecha) ? (n.meta.fecha as string) : null;
      case "tags":
      case "etags":
        return n.etiquetas.map((t) => `#${t}`);
      default:
        this.aproximada = true;
        return null;
    }
  }

  valor(expr: string, n: FilaDV): Valor {
    const e = quitarParentesis(expr.trim());
    let m: RegExpMatchArray | null;

    // Suma/resta de duración: date(today) + dur(7 days)
    if ((m = e.match(/^(.+?)\s*([+-])\s*dur\((\d+)\s*(day|days|d|week|weeks|w)\)$/))) {
      const base = this.valor(m[1], n);
      if (!esFechaISO(base)) return null;
      const dias = Number(m[3]) * (m[4].startsWith("w") ? 7 : 1);
      return sumarDias(base, m[2] === "+" ? dias : -dias);
    }
    // a + b: suma si son números, si no concatena (cuotas_pagadas + " / " + cuotas_totales)
    const sumandos = partir(e, /^\s*\+\s*/);
    if (sumandos.length > 1) {
      const vals = sumandos.map((s) => this.valor(s, n));
      if (vals.every((v) => typeof v === "number")) return (vals as number[]).reduce((a, b) => a + b, 0);
      return vals.map((v) => (v == null ? "" : typeof v === "object" && !Array.isArray(v) ? v.nota.titulo : String(v))).join("");
    }
    if ((m = e.match(/^date\((today|now|tomorrow|yesterday)\)$/))) {
      const desplazar = { today: 0, now: 0, tomorrow: 1, yesterday: -1 }[m[1] as "today"];
      return sumarDias(this.hoy, desplazar);
    }
    if ((m = e.match(/^dateformat\((.+),\s*"([^"]*)"\)$/))) {
      const v = this.valor(m[1], n);
      return typeof v === "string" && v ? formatoFecha(v.length === 10 ? `${v}T12:00:00` : v, m[2]) : null;
    }
    if ((m = e.match(/^"(.*)"$/))) return m[1];
    if (/^-?\d+(\.\d+)?$/.test(e)) return Number(e);
    if (e === "true" || e === "false") return e === "true";
    if ((m = e.match(/^this\.file\.(\w+)$/))) return this.campoArchivo(this.actual, m[1]);
    if ((m = e.match(/^this\.([\p{L}\p{N}_-]+)$/u))) return this.actual.meta[m[1]] ?? null;
    if ((m = e.match(/^file\.(\w+)$/))) return this.campoArchivo(n, m[1]);
    if (e === "tags") return n.etiquetas;
    if ((m = e.match(/^[\p{L}_][\p{L}\p{N}_-]*$/u))) return n.meta[e] ?? null;

    this.aproximada = true;
    return null;
  }

  /** Condición de WHERE. `completed` se trata aparte (solo hay tareas abiertas). */
  condicion(expr: string, n: FilaDV): boolean {
    const e = expr.trim();
    const ors = partir(e, /^\s+OR\s+/);
    if (ors.length > 1) return ors.some((o) => this.condicion(o, n));
    const ands = partir(e, /^\s+AND\s+/);
    if (ands.length > 1) return ands.every((a) => this.condicion(a, n));

    if (e === "!completed") return true;
    if (e === "completed") return false;
    if (e.startsWith("!")) return !this.condicion(e.slice(1), n);

    let m: RegExpMatchArray | null;
    if ((m = e.match(/^contains\((.+),\s*(.+)\)$/))) {
      const a = this.valor(m[1], n);
      const b = this.valor(m[2], n);
      if (typeof b !== "string") return false;
      if (Array.isArray(a)) return a.some((x) => normal(x) === normal(b) || normal(x) === normal(`#${b}`));
      return typeof a === "string" && a.toLowerCase().includes(b.toLowerCase());
    }
    if ((m = e.match(/^(.+?)\s*(!=|<=|>=|=|<|>)\s*(.+)$/))) {
      const a = this.valor(m[1], n);
      const b = this.valor(m[3], n);
      return comparar(a, b, m[2]);
    }
    const v = this.valor(e, n);
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  }

  /** Columna de una tabla agrupada: length(rows), sum(rows.x), rows.x o la clave del grupo. */
  agregado(expr: string, filas: FilaDV[], clave: string, exprGrupo: string): Valor {
    const e = quitarParentesis(expr.trim());
    let m: RegExpMatchArray | null;
    if (e === exprGrupo.trim()) return clave;
    if (e === "length(rows)") return filas.length;
    if ((m = e.match(/^(sum|min|max|average)\(rows\.(.+)\)$/))) {
      const nums = filas.map((f) => this.valor(m![2], f)).filter((v): v is number => typeof v === "number");
      if (!nums.length) return null;
      if (m[1] === "sum") return nums.reduce((a, b) => a + b, 0);
      if (m[1] === "min") return Math.min(...nums);
      if (m[1] === "max") return Math.max(...nums);
      return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
    }
    if ((m = e.match(/^rows\.(.+)$/))) {
      return filas.map((f) => {
        const v = this.valor(m![1], f);
        return v == null ? "—" : typeof v === "object" && !Array.isArray(v) ? v.nota.titulo : String(v);
      });
    }
    this.aproximada = true;
    return null;
  }
}

/** "(a + b)" → "a + b", solo si el paréntesis de apertura cierra al final. */
function quitarParentesis(e: string): string {
  if (!e.startsWith("(") || !e.endsWith(")")) return e;
  let nivel = 0;
  for (let i = 0; i < e.length; i++) {
    if (e[i] === "(") nivel++;
    if (e[i] === ")") nivel--;
    if (nivel === 0 && i < e.length - 1) return e;
  }
  return quitarParentesis(e.slice(1, -1).trim());
}

const normal = (s: string) => s.toLowerCase().trim();

function comparar(a: Valor, b: Valor, op: string): boolean {
  const sa = a == null ? null : typeof a === "object" && !Array.isArray(a) ? a.nota.ruta : a;
  const sb = b == null ? null : typeof b === "object" && !Array.isArray(b) ? b.nota.ruta : b;
  if (op === "=") return String(sa) === String(sb);
  if (op === "!=") return String(sa) !== String(sb);
  if (sa == null || sb == null) return false;
  const x = typeof sa === "number" && typeof sb === "number" ? sa - sb : String(sa).localeCompare(String(sb));
  return op === "<" ? x < 0 : op === "<=" ? x <= 0 : op === ">" ? x > 0 : x >= 0;
}

function mostrar(v: Valor): Celda {
  if (v == null) return "—";
  if (typeof v === "object" && !Array.isArray(v)) return v;
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "number") return v.toLocaleString("es-CL");
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v.split("-").reverse().join("-");
  return v;
}

/** Ejecuta una consulta DQL sobre las notas del vault. */
export function ejecutarDataview(consulta: string, notas: FilaDV[], actual: FilaDV, hoy: string): ResultadoDV {
  const texto = consulta.replace(/\r/g, "").trim();
  const clausulas = partir(texto, /^\s+(?=(FROM|WHERE|SORT|LIMIT|GROUP BY|FLATTEN)\b)/);
  const cabecera = clausulas[0] ?? "";
  const tipo = cabecera.match(/^(TABLE|LIST|TASK|CALENDAR)\b/)?.[1];
  if (!tipo || tipo === "CALENDAR") return { tipo: "no-soportada", motivo: "Este tipo de vista solo se ve en Obsidian." };

  const ctx = new Contexto(actual, hoy);
  let filas = notas.filter((n) => !n.ruta.startsWith("Plantillas/"));
  let grupo: string | null = null; // GROUP BY <expr> (file.link no agrupa nada útil acá)

  for (const c of clausulas.slice(1)) {
    let m: RegExpMatchArray | null;
    if ((m = c.match(/^FROM\s+([\s\S]+)$/))) {
      const fuentes = partir(m[1], /^\s+OR\s+/).map((f) => f.trim());
      filas = filas.filter((n) =>
        fuentes.some((f) => {
          if (f.startsWith("#")) return n.etiquetas.includes(normal(f.slice(1)));
          const carpeta = f.replace(/^"|"$/g, "");
          return n.ruta === `${carpeta}.md` || n.ruta.startsWith(`${carpeta}/`);
        }),
      );
    } else if ((m = c.match(/^WHERE\s+([\s\S]+)$/))) {
      const cond = m[1].replace(/\s+/g, " ");
      filas = filas.filter((n) => ctx.condicion(cond, n));
    } else if ((m = c.match(/^SORT\s+([\s\S]+)$/))) {
      const criterios = partir(m[1], /^,\s*/).map((s) => {
        const [, expr, dir] = s.match(/^(.+?)(?:\s+(ASC|DESC|asc|desc))?$/)!;
        return { expr, desc: dir?.toLowerCase() === "desc" };
      });
      filas = [...filas].sort((a, b) => {
        for (const { expr, desc } of criterios) {
          const va = ctx.valor(expr, a);
          const vb = ctx.valor(expr, b);
          if (va == null && vb == null) continue;
          if (va == null) return 1;
          if (vb == null) return -1;
          const x = comparar(va, vb, "<") ? -1 : comparar(va, vb, ">") ? 1 : 0;
          if (x) return desc ? -x : x;
        }
        return 0;
      });
    } else if ((m = c.match(/^LIMIT\s+(\d+)/))) {
      filas = filas.slice(0, Number(m[1]));
    } else if ((m = c.match(/^GROUP BY\s+([\s\S]+)$/))) {
      if (m[1].trim() !== "file.link") grupo = m[1].trim();
    } else {
      ctx.aproximada = true;
    }
  }

  if (tipo === "TASK") {
    const grupos = filas.filter((n) => n.tareas.length).map((nota) => ({ nota, tareas: nota.tareas }));
    return { tipo: "tareas", grupos, aproximada: ctx.aproximada };
  }

  if (tipo === "LIST") return { tipo: "lista", notas: filas, aproximada: ctx.aproximada };

  // TABLE [WITHOUT ID] expr AS "Etiqueta", ...
  const sinId = /^TABLE\s+WITHOUT\s+ID\b/.test(cabecera);
  const columnasCrudas = partir(cabecera.replace(/^TABLE(\s+WITHOUT\s+ID)?/, "").trim(), /^,\s*/).filter(Boolean);
  const columnas = columnasCrudas.map((c) => {
    const m = c.match(/^(.+?)\s+AS\s+"([^"]*)"$/);
    return m ? { expr: m[1], etiqueta: m[2] } : { expr: c, etiqueta: c };
  });
  if (grupo) {
    const exprGrupo = grupo;
    if (!sinId) columnas.unshift({ expr: exprGrupo, etiqueta: "Grupo" });
    const grupos = new Map<string, FilaDV[]>();
    for (const n of filas) {
      const v = mostrar(ctx.valor(exprGrupo, n));
      const clave = typeof v === "string" ? v : v.nota.titulo;
      grupos.set(clave, [...(grupos.get(clave) ?? []), n]);
    }
    return {
      tipo: "tabla",
      columnas: columnas.map((c) => c.etiqueta),
      filas: [...grupos].map(([clave, del]) => columnas.map((c) => mostrar(ctx.agregado(c.expr, del, clave, exprGrupo)))),
      aproximada: ctx.aproximada,
    };
  }
  if (!sinId) columnas.unshift({ expr: "file.link", etiqueta: "Nota" });

  return {
    tipo: "tabla",
    columnas: columnas.map((c) => c.etiqueta),
    filas: filas.map((n) => columnas.map((c) => mostrar(ctx.valor(c.expr, n)))),
    aproximada: ctx.aproximada,
  };
}

/** Valor de un campo en línea `= this.campo` (o expresión simple) para la nota actual. */
export function valorEnLinea(expr: string, actual: FilaDV, hoy: string): string {
  const v = mostrar(new Contexto(actual, hoy).valor(expr, actual));
  return typeof v === "string" ? v : v.nota.titulo;
}
