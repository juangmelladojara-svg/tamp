// ---------------------------------------------------------------------------
// Lectura del vault de Obsidian para la oficina virtual (yo.tamp.cl/oficina).
//
// Código puro (sin fs ni Supabase): lo usa el navegador al sincronizar —lee la
// carpeta del vault con el selector de carpetas— y el servidor al validar.
// Por nota: frontmatter, etiquetas (#inline + tags), tareas abiertas y enlaces
// [[...]] ya resueltos a la ruta de la nota destino.
// ---------------------------------------------------------------------------

export type ValorMeta = string | number | boolean | null | string[];
export type Meta = Record<string, ValorMeta>;
export type Tarea = { texto: string; fecha?: string };

export type NotaVault = {
  ruta: string; // relativa al vault, con "/" y ".md": "03 - Proyectos/TAMP.md"
  titulo: string;
  carpeta: string; // carpeta de primer nivel
  contenido: string; // cuerpo sin frontmatter
  meta: Meta;
  etiquetas: string[];
  tareas: Tarea[]; // solo las abiertas
  enlaces: string[]; // rutas de las notas enlazadas
  modificado: string | null; // ISO
};

export type ArchivoVault = { ruta: string; texto: string; modificado: number | null };

export const RAIZ = "Raíz del vault";
const IGNORADAS = new Set([".obsidian", ".trash", ".git", "_Recursos", "node_modules"]);

/** true si la ruta no debe entrar a la oficina (config, papelera, adjuntos, dibujos). */
export function ignorarRuta(ruta: string): boolean {
  if (!ruta.endsWith(".md") || ruta.endsWith(".excalidraw.md")) return true;
  return ruta.split("/").some((p) => IGNORADAS.has(p) || p.startsWith("."));
}

export const normalizar = (s: string) => s.normalize("NFC").toLowerCase().trim();

export const tituloDeRuta = (ruta: string) => ruta.split("/").pop()!.replace(/\.md$/, "");
export const carpetaDeRuta = (ruta: string) => (ruta.includes("/") ? ruta.split("/")[0] : RAIZ);
/** Carpeta completa que contiene la nota ("" si está en la raíz). */
export const directorioDeRuta = (ruta: string) => ruta.split("/").slice(0, -1).join("/");

// ---- Frontmatter (subconjunto de YAML que usan las plantillas) ------------

function valorYaml(crudo: string): ValorMeta {
  const s = crudo.trim();
  if (s === "" || s === "~" || s === "null") return null;
  if (s === "true" || s === "false") return s === "true";
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  if (s.startsWith("[") && s.endsWith("]")) {
    return s
      .slice(1, -1)
      .split(",")
      .map((x) => x.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }
  return s.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
}

export function separarFrontmatter(texto: string): { meta: Meta; cuerpo: string } {
  const t = texto.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const m = t.match(/^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/);
  if (!m) return { meta: {}, cuerpo: t };

  const meta: Meta = {};
  let lista: string | null = null; // clave cuya lista "- item" se está leyendo
  for (const linea of m[1].split("\n")) {
    const item = linea.match(/^\s+-\s+(.*)$/) ?? (lista ? linea.match(/^-\s+(.*)$/) : null);
    if (item && lista) {
      (meta[lista] as string[]).push(String(valorYaml(item[1]) ?? ""));
      continue;
    }
    const kv = linea.match(/^([\p{L}\p{N}_-]+):\s*(.*)$/u);
    if (!kv) continue;
    const [, clave, valor] = kv;
    if (valor.trim() === "") {
      meta[clave] = [];
      lista = clave;
    } else {
      meta[clave] = valorYaml(valor);
      lista = null;
    }
  }
  // Claves "clave:" sin lista debajo quedan como null, no como [].
  for (const [k, v] of Object.entries(meta)) if (Array.isArray(v) && v.length === 0) meta[k] = null;

  return { meta, cuerpo: t.slice(m[0].length) };
}

// ---- Cuerpo ---------------------------------------------------------------

/** Quita bloques de código (no tienen tareas reales). */
const sinBloques = (s: string) => s.replace(/^```[\s\S]*?^```/gm, "");
/** Además quita el código en línea (`#algo` ahí no es etiqueta). */
const sinCodigo = (s: string) => sinBloques(s).replace(/`[^`\n]*`/g, "");

/** Texto de una tarea sin marcas: [[Nota|alias]] → alias, sin ** ni `. */
export const textoPlano = (s: string) =>
  s.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, a: string, b?: string) => b ?? a).replace(/\*\*|`/g, "");

export function extraerTareas(cuerpo: string): Tarea[] {
  const tareas: Tarea[] = [];
  for (const m of sinBloques(cuerpo).matchAll(/^\s*[-*+] \[ \] (.+)$/gm)) {
    const fecha = m[1].match(/📅\s*(\d{4}-\d{2}-\d{2})/)?.[1];
    const texto = m[1].replace(/📅\s*\d{4}-\d{2}-\d{2}/, "").trim();
    if (texto) tareas.push(fecha ? { texto, fecha } : { texto });
  }
  return tareas;
}

export function extraerEtiquetas(meta: Meta, cuerpo: string): string[] {
  const set = new Set<string>();
  const tags = meta.tags ?? meta.tag;
  const lista = Array.isArray(tags) ? tags : typeof tags === "string" ? tags.split(/[,\s]+/) : [];
  for (const t of lista) if (t) set.add(normalizar(t.replace(/^#/, "")));
  // Las etiquetas no pueden ser solo números (#1 no es etiqueta en Obsidian).
  for (const m of sinCodigo(cuerpo).matchAll(/(^|[\s(])#([\p{L}\p{N}_/-]*[\p{L}_/-][\p{L}\p{N}_/-]*)/gu)) {
    set.add(normalizar(m[2]));
  }
  return [...set];
}

/** "Nota|alias" o "carpeta/Nota#sección" → "Nota". */
export const destinoEnlace = (crudo: string) =>
  crudo.split("|")[0].split("#")[0].trim().split("/").pop()!.replace(/\.md$/, "");

export function extraerEnlaces(cuerpo: string): string[] {
  return [...sinCodigo(cuerpo).matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => destinoEnlace(m[1]));
}

// ---- Vault completo ---------------------------------------------------------

export function procesarVault(archivos: ArchivoVault[]): NotaVault[] {
  const base = archivos
    .filter((a) => !ignorarRuta(a.ruta))
    .map((a) => {
      const { meta, cuerpo } = separarFrontmatter(a.texto);
      return {
        ruta: a.ruta,
        titulo: tituloDeRuta(a.ruta),
        carpeta: carpetaDeRuta(a.ruta),
        contenido: cuerpo,
        meta,
        etiquetas: extraerEtiquetas(meta, cuerpo),
        tareas: extraerTareas(cuerpo),
        nombresEnlazados: extraerEnlaces(cuerpo),
        modificado: a.modificado ? new Date(a.modificado).toISOString() : null,
      };
    });

  const porTitulo = new Map(base.map((n) => [normalizar(n.titulo), n.ruta]));

  return base.map(({ nombresEnlazados, ...n }) => {
    const enlaces = new Set<string>();
    for (const nombre of nombresEnlazados) {
      const destino = porTitulo.get(normalizar(nombre));
      if (destino && destino !== n.ruta) enlaces.add(destino);
    }
    return { ...n, enlaces: [...enlaces] };
  });
}

// ---- Rutas de la oficina ------------------------------------------------------

const segmento = (s: string) => encodeURIComponent(s).replace(/\(/g, "%28").replace(/\)/g, "%29");

export const hrefNota = (ruta: string) => `/oficina/nota/${ruta.replace(/\.md$/, "").split("/").map(segmento).join("/")}`;
export const hrefSala = (dir: string) => `/oficina/sala/${dir.split("/").map(segmento).join("/")}`;

/** Los params de una ruta catch-all, de vuelta a texto (tolera que ya vengan decodificados). */
export function segmentosATexto(segmentos: string[]): string {
  return segmentos
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    })
    .join("/");
}
