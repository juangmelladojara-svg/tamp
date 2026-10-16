// ---------------------------------------------------------------------------
// Respuestas simuladas de la oficina virtual: sin modelo de IA, pero armadas
// con los datos reales del vault (tareas, metas, préstamos, prospectos).
// Cuando se conecte la IA real, esto queda como respaldo sin costo.
// ---------------------------------------------------------------------------

import type { FilaDV } from "./dataview";
import { COORDINADORES, esDelArea, sinTildes, type Coordinador, type IdCoordinador } from "./equipo";
import { hrefNota, textoPlano } from "./vault";

export type Enlace = { titulo: string; href: string };
export type Respuesta = { titulo: string; resumen: string; borrador: string; enlaces: Enlace[] };

const VACIAS = new Set(
  "para como que del las los una uno unos unas con sobre tengo hacer quiero necesito dame dime cual cuales cuanto cuanta esta este estos estas semana hoy manana todo toda todos todas algo mis tus sus por favor revisa revisar resumen hazme haz arma armar ver muestrame lista cosas tema temas".split(" "),
);

const palabras = (texto: string) => sinTildes(texto).split(/[^\p{L}\p{N}]+/u).filter((p) => p.length >= 4 && !VACIAS.has(p));

const texto = (v: unknown) => (typeof v === "string" ? v : null);
const numero = (v: unknown) => (typeof v === "number" ? v : 0);
const pesos = (n: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
const fecha = (iso: string) => iso.slice(0, 10).split("-").reverse().join("-");
const enlace = (n: FilaDV): Enlace => ({ titulo: n.titulo, href: hrefNota(n.ruta) });
const tarea = (t: string) => `• ${textoPlano(t)}`;

function sumarDias(f: string, d: number) {
  const x = new Date(`${f}T12:00:00Z`);
  x.setUTCDate(x.getUTCDate() + d);
  return x.toISOString().slice(0, 10);
}

/** Qué tanto se relaciona una nota con el encargo. */
function puntaje(n: FilaDV, ps: string[]): number {
  if (!ps.length) return 0;
  const titulo = sinTildes(n.titulo);
  const etiquetas = n.etiquetas.map(sinTildes).join(" ");
  const tareas = sinTildes(n.tareas.map((t) => t.texto).join(" "));
  const meta = sinTildes(Object.values(n.meta).filter((v) => typeof v === "string").join(" "));
  return ps.reduce((s, p) => s + (titulo.includes(p) ? 3 : 0) + (etiquetas.includes(p) ? 2 : 0) + (tareas.includes(p) ? 1 : 0) + (meta.includes(p) ? 1 : 0), 0);
}

export function notasDe(c: Coordinador, notas: FilaDV[]) {
  return notas.filter((n) => esDelArea(c, n));
}

/**
 * El Jefe de Gabinete decide a quién le corresponde un encargo (null = no está claro).
 * Pide al menos una palabra del tema o el título de una nota: que la palabra
 * aparezca solo dentro de una tarea (puntaje 1) no basta para derivar.
 */
export function enrutar(encargo: string, notas: FilaDV[]): IdCoordinador | null {
  const t = sinTildes(encargo);
  const ps = palabras(encargo);
  const r = COORDINADORES.map((c) => {
    const porPalabra = c.palabras.filter((p) => t.includes(p)).length * 2;
    const porNota = Math.max(0, ...notasDe(c, notas).map((n) => puntaje(n, ps)));
    return { id: c.id, s: porPalabra + porNota };
  }).sort((a, b) => b.s - a.s);
  return r[0].s >= 2 ? r[0].id : null;
}

// ---- Respuestas por tema ------------------------------------------------------

function finanzas(area: FilaDV[], hoy: string): Respuesta {
  const prestamos = area.filter((n) => texto(n.meta.tipo) === "prestamo" && texto(n.meta.estado) === "activo");
  const deuda = prestamos.reduce((s, n) => s + numero(n.meta.saldo_actual), 0);
  const cuota = prestamos.reduce((s, n) => s + numero(n.meta.cuota), 0);
  const conFecha = prestamos.filter((n) => texto(n.meta.proximo_pago)).sort((a, b) => texto(a.meta.proximo_pago)!.localeCompare(texto(b.meta.proximo_pago)!));
  const vencidos = conFecha.filter((n) => texto(n.meta.proximo_pago)! < hoy);
  const proximos = conFecha.filter((n) => texto(n.meta.proximo_pago)! >= hoy && texto(n.meta.proximo_pago)! <= sumarDias(hoy, 14));

  const l = [`Deuda vigente: ${pesos(deuda)} en ${prestamos.length} préstamos · cuota mensual ${pesos(cuota)}.`];
  if (vencidos.length) {
    l.push("", "Pagos con la fecha ya pasada:");
    vencidos.forEach((n) => l.push(`• ${n.titulo}: ${pesos(numero(n.meta.cuota))} (${fecha(texto(n.meta.proximo_pago)!)})`));
    l.push("", "Si ya los pagaste, actualiza «proximo_pago», «saldo_actual» y «cuotas_pagadas» en cada nota y vuelve a sincronizar.");
  }
  if (proximos.length) {
    l.push("", "Vencen en los próximos 14 días:");
    proximos.forEach((n) => l.push(`• ${n.titulo}: ${pesos(numero(n.meta.cuota))} (${fecha(texto(n.meta.proximo_pago)!)})`));
  }
  const tareas = area.flatMap((n) => n.tareas.map((t) => t.texto)).slice(0, 4);
  if (tareas.length) l.push("", "Tareas abiertas de Finanzas:", ...tareas.map(tarea));

  return {
    titulo: "Préstamos y pagos",
    resumen: vencidos.length
      ? `Revisé tus préstamos: debes ${pesos(deuda)} y hay ${vencidos.length} pago${vencidos.length === 1 ? "" : "s"} con la fecha ya pasada.`
      : `Revisé tus préstamos: debes ${pesos(deuda)} y no hay pagos vencidos.`,
    borrador: l.join("\n"),
    enlaces: [...vencidos, ...proximos, ...prestamos].filter((n, i, a) => a.indexOf(n) === i).slice(0, 3).map(enlace),
  };
}

function proyectos(area: FilaDV[], relacionadas: FilaDV[]): Respuesta {
  const proyecto = relacionadas.find((n) => n.etiquetas.includes("proyecto"));
  if (proyecto) {
    const l = [
      `${proyecto.titulo}: estado ${texto(proyecto.meta.estado) ?? "sin estado"}${texto(proyecto.meta.fecha_objetivo) ? ` · meta ${fecha(texto(proyecto.meta.fecha_objetivo)!)}` : ""}.`,
    ];
    if (proyecto.tareas.length) {
      l.push("", `Tareas abiertas (${proyecto.tareas.length}):`, ...proyecto.tareas.slice(0, 8).map((t) => tarea(t.texto)));
      l.push("", `Siguiente paso sugerido: ${textoPlano(proyecto.tareas[0].texto)}`);
    } else l.push("", "No tiene tareas abiertas. ¿Lo marcamos como terminado o falta anotar el siguiente paso?");
    return {
      titulo: proyecto.titulo,
      resumen: `Revisé ${proyecto.titulo}: ${proyecto.tareas.length} tareas abiertas.`,
      borrador: l.join("\n"),
      enlaces: [proyecto, ...relacionadas.filter((n) => n !== proyecto)].slice(0, 3).map(enlace),
    };
  }
  const activos = area
    .filter((n) => n.etiquetas.includes("proyecto") && texto(n.meta.estado) === "activo" && texto(n.meta.tipo) === "proyecto")
    .sort((a, b) => b.tareas.length - a.tareas.length);
  const l = [`Tienes ${activos.length} proyectos activos:`];
  activos.forEach((n) => l.push(`• ${n.titulo}: ${n.tareas.length} tareas${texto(n.meta.fecha_objetivo) ? ` · meta ${fecha(texto(n.meta.fecha_objetivo)!)}` : ""}`));
  const top = activos.find((n) => n.tareas.length);
  if (top) l.push("", `Siguiente paso sugerido (${top.titulo}): ${textoPlano(top.tareas[0].texto)}`);
  return { titulo: "Proyectos activos", resumen: `Repasé tus ${activos.length} proyectos activos.`, borrador: l.join("\n"), enlaces: activos.slice(0, 3).map(enlace) };
}

function negocio(area: FilaDV[], relacionadas: FilaDV[]): Respuesta {
  const prospectos = area.filter((n) => n.etiquetas.includes("prospecto"));
  const clientes = area.filter((n) => n.etiquetas.includes("cliente") && texto(n.meta.tipo) !== "moc");
  const foco = relacionadas[0] ?? area.find((n) => n.titulo === "TAMP");
  const l: string[] = [];
  if (clientes.length) l.push(`Clientes: ${clientes.map((n) => n.titulo).join(", ")}.`);
  if (prospectos.length) {
    l.push("", "Prospectos:");
    prospectos.forEach((n) => l.push(`• ${n.titulo}: ${texto(n.meta.etapa) ?? texto(n.meta.estado) ?? "sin etapa"}`));
  }
  if (foco?.tareas.length) l.push("", `Tareas abiertas en ${foco.titulo}:`, ...foco.tareas.slice(0, 6).map((t) => tarea(t.texto)));
  return {
    titulo: foco?.titulo ?? "Negocio",
    resumen: `Revisé el negocio: ${clientes.length} cliente${clientes.length === 1 ? "" : "s"} y ${prospectos.length} prospecto${prospectos.length === 1 ? "" : "s"}.`,
    borrador: l.join("\n") || "No encontré notas del negocio para este encargo.",
    enlaces: [foco, ...prospectos, ...clientes].filter((n): n is FilaDV => !!n).filter((n, i, a) => a.indexOf(n) === i).slice(0, 3).map(enlace),
  };
}

function general(c: Coordinador, area: FilaDV[], relacionadas: FilaDV[], hoy: string): Respuesta {
  const l: string[] = [];
  if (relacionadas.length) {
    l.push(`Encontré ${relacionadas.length} nota${relacionadas.length === 1 ? "" : "s"} relacionada${relacionadas.length === 1 ? "" : "s"}:`);
    relacionadas.forEach((n) => {
      l.push(`• ${n.titulo}${n.tareas.length ? ` (${n.tareas.length} tareas abiertas)` : ""}`);
      n.tareas.slice(0, 3).forEach((t) => l.push(`   ${tarea(t.texto)}`));
    });
  } else {
    const tareas = area.filter((n) => n.tareas.length);
    l.push(`Tu área de ${c.nombre} tiene ${area.length} notas y ${tareas.reduce((s, n) => s + n.tareas.length, 0)} tareas abiertas.`);
    tareas.slice(0, 3).forEach((n) => {
      l.push("", `${n.titulo}:`, ...n.tareas.slice(0, 3).map((t) => tarea(t.texto)));
    });
  }
  if (c.id === "vida") {
    const diario = area.filter((n) => /^\d{4}-\d{2}-\d{2}$/.test(n.titulo)).sort((a, b) => b.titulo.localeCompare(a.titulo))[0];
    if (diario && diario.titulo < hoy) {
      const dias = Math.round((Date.parse(hoy) - Date.parse(diario.titulo)) / 86400000);
      l.push("", `Tu última nota del Diario es del ${fecha(diario.titulo)} (hace ${dias} días). Escribir dos líneas hoy ya cuenta.`);
    }
  }
  if (c.id === "salud") l.push("", "Solo ordeno lo que anotaste; las decisiones médicas quedan con tu equipo tratante.");
  const recientes = [...area].sort((a, b) => (b.modificado ?? "").localeCompare(a.modificado ?? ""));
  return {
    titulo: relacionadas[0]?.titulo ?? c.nombre,
    resumen: relacionadas.length
      ? `Revisé tus notas de ${c.nombre}: encontré ${relacionadas.length} relacionada${relacionadas.length === 1 ? "" : "s"}.`
      : `Te dejo el estado de ${c.nombre}.`,
    borrador: l.join("\n"),
    enlaces: (relacionadas.length ? relacionadas : recientes).slice(0, 3).map(enlace),
  };
}

/** Lo que prepara un coordinador para un encargo, a partir de sus notas. */
export function responder(id: IdCoordinador, encargo: string, notas: FilaDV[], hoy: string): Respuesta {
  const c = COORDINADORES.find((x) => x.id === id)!;
  const area = notasDe(c, notas);
  const ps = palabras(encargo);
  const relacionadas = area
    .map((n) => ({ n, s: puntaje(n, ps) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || (b.n.modificado ?? "").localeCompare(a.n.modificado ?? ""))
    .slice(0, 3)
    .map((x) => x.n);

  if (id === "finanzas") return finanzas(area, hoy);
  if (id === "proyectos") return proyectos(area, relacionadas);
  if (id === "negocio") return negocio(area, relacionadas);
  return general(c, area, relacionadas, hoy);
}

/** Parte del día del Jefe de Gabinete (primer mensaje del canal). */
export function parteDelDia(notas: FilaDV[], hoy: string): string {
  const vivas = notas.filter((n) => !/^(Plantillas|99|00)/.test(n.ruta));
  const tareas = vivas.reduce((s, n) => s + n.tareas.length, 0);
  const vencidos = vivas.filter((n) => texto(n.meta.tipo) === "prestamo" && texto(n.meta.estado) === "activo" && (texto(n.meta.proximo_pago) ?? "9") < hoy).length;
  const metas = vivas.filter((n) => {
    const f = texto(n.meta.fecha_objetivo);
    return f && f < hoy && !["completado", "terminado", "archivado", "cancelado"].includes(texto(n.meta.estado) ?? "");
  }).length;
  const partes = [`${tareas} tareas abiertas en el vault`];
  if (vencidos) partes.push(`${vencidos} pago${vencidos === 1 ? "" : "s"} con fecha pasada`);
  if (metas) partes.push(`${metas} meta${metas === 1 ? "" : "s"} vencida${metas === 1 ? "" : "s"}`);
  return `Parte del día: ${partes.join(", ")}. Pídeme lo que necesites y se lo llevo al coordinador que corresponde.`;
}

/** Encargos de ejemplo armados con nombres reales del vault. */
export function sugerencias(notas: FilaDV[]): string[] {
  const proyecto = notas
    .filter((n) => n.etiquetas.includes("proyecto") && texto(n.meta.estado) === "activo" && texto(n.meta.tipo) === "proyecto" && n.titulo !== "TAMP")
    .sort((a, b) => b.tareas.length - a.tareas.length)[0];
  return [
    "¿Cuánto debo y qué pagos vienen?",
    proyecto ? `¿Qué me falta en ${proyecto.titulo}?` : "Repasa mis proyectos activos",
    "¿Cómo van los prospectos de TAMP?",
    "¿Qué automatizaciones tengo pendientes?",
    "¿Cuándo escribí el Diario por última vez?",
  ];
}
