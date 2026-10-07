// Lee el vault de Obsidian y escribe la estructura (sin contenido) en un JSON:
// por nota → ruta, título, carpeta de primer nivel y enlaces [[...]] resueltos.
//
// Uso: node scripts/leer-vault.mjs "<ruta del vault>" <salida.json>

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, relative, sep } from "node:path";

const [raiz, salida] = process.argv.slice(2);
if (!raiz || !salida) {
  console.error('Uso: node scripts/leer-vault.mjs "<ruta del vault>" <salida.json>');
  process.exit(1);
}

const IGNORAR = new Set([".obsidian", ".trash", ".git", "_Recursos"]);

function* archivos(dir) {
  for (const nombre of readdirSync(dir)) {
    if (IGNORAR.has(nombre)) continue;
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) yield* archivos(ruta);
    else if (extname(nombre) === ".md") yield ruta;
  }
}

const norm = (s) => s.normalize("NFC").toLowerCase().trim();

const notas = [...archivos(raiz)].map((abs) => {
  const rel = relative(raiz, abs).split(sep).join("/");
  const partes = rel.split("/");
  return {
    ruta: rel,
    titulo: basename(rel, ".md"),
    carpeta: partes.length > 1 ? partes[0] : "Raíz del vault",
    texto: readFileSync(abs, "utf8"),
  };
});

const porTitulo = new Map(notas.map((n) => [norm(n.titulo), n]));

const resultado = notas.map(({ texto, ...n }) => {
  const destinos = new Set();
  for (const m of texto.matchAll(/\[\[([^\]]+)\]\]/g)) {
    const nombre = m[1].split("|")[0].split("#")[0].trim().split("/").pop();
    const destino = porTitulo.get(norm(nombre));
    if (destino && destino.ruta !== n.ruta) destinos.add(destino.ruta);
  }
  return { ...n, enlaces: [...destinos] };
});

writeFileSync(salida, JSON.stringify(resultado, null, 1), "utf8");
const porCarpeta = {};
for (const n of resultado) porCarpeta[n.carpeta] = (porCarpeta[n.carpeta] ?? 0) + 1;
console.log(`${resultado.length} notas, ${resultado.reduce((s, n) => s + n.enlaces.length, 0)} enlaces`);
console.table(porCarpeta);
