import Link from "next/link";
import { AlertTriangle, BellRing, Briefcase, Inbox, ListChecks, NotebookPen, Wallet } from "lucide-react";
import { sesionPortal } from "@/lib/yo/sesion";
import { fechaHoy } from "@/lib/yo/fecha";
import { cargarVault, fechaCorta, haceCuanto, pesos, vaultConContenido, type FilaOficina } from "@/lib/yo/oficina";
import { hrefNota, RAIZ, textoPlano } from "@/lib/yo/vault";
import Sincronizar from "./Sincronizar";
import { Chip, FilaNota, Panel, TarjetaSala } from "./piezas";

export const metadata = { title: "Oficina virtual" };

// Recepción de la oficina: lo que en Obsidian es el Dashboard Principal, pero
// calculado desde las notas sincronizadas (sin depender de Dataview).

const FUERA_DE_CUENTA = ["Plantillas/", "99 - Archivo/", "00 - Dashboard/"];
const cuenta = (n: FilaOficina) => !FUERA_DE_CUENTA.some((p) => n.ruta.startsWith(p));
const texto = (v: unknown) => (typeof v === "string" ? v : null);
const numero = (v: unknown) => (typeof v === "number" ? v : 0);
const CERRADOS = new Set(["completado", "terminado", "pagado", "archivado", "cancelado"]);

type Aviso = { nivel: "vencido" | "pronto"; texto: string; ruta: string; fecha: string };

function saludo(): string {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "America/Santiago" }).format(new Date()));
  return h < 12 ? "Buenos días" : h < 20 ? "Buenas tardes" : "Buenas noches";
}

function sumarDias(fecha: string, dias: number) {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export default async function Recepcion() {
  const [{ perfil, email }, notas] = await Promise.all([sesionPortal(), cargarVault()]);
  const nombre = (perfil?.nombre ?? email ?? "").split(" ")[0];

  if (!vaultConContenido(notas)) {
    return (
      <div className="mx-auto max-w-xl pt-10 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">Tu oficina virtual</h1>
        <p className="mt-3 text-slate-400">
          Acá vas a tener tu vault de Obsidian como una oficina: cada área es una sala, con sus notas, tareas, metas y avisos.
          Para abrirla, sincroniza el vault una vez desde este computador.
        </p>
        <div className="mt-8">
          <Sincronizar grande />
        </div>
        <p className="mt-6 text-xs text-slate-500">Elige la carpeta <span className="text-slate-300">Obsidian Vault</span> (en G:\Mi unidad\Leoda Root). Se sube solo el texto de las notas; los adjuntos quedan en tu computador.</p>
      </div>
    );
  }

  const hoy = fechaHoy();
  const vivas = notas.filter(cuenta);
  const ultimaSync = notas.reduce((m, n) => (n.sincronizado_en > m ? n.sincronizado_en : m), "");

  // ---- KPIs ----
  const proyectos = vivas
    .filter((n) => n.etiquetas.includes("proyecto") && texto(n.meta.estado) === "activo" && texto(n.meta.tipo) === "proyecto")
    .sort((a, b) => (texto(a.meta.fecha_objetivo) ?? "9999").localeCompare(texto(b.meta.fecha_objetivo) ?? "9999"));
  const prestamos = vivas.filter((n) => texto(n.meta.tipo) === "prestamo" && texto(n.meta.estado) === "activo");
  const deuda = prestamos.reduce((s, n) => s + numero(n.meta.saldo_actual), 0);
  const cuotas = prestamos.reduce((s, n) => s + numero(n.meta.cuota), 0);
  const conTareas = vivas.filter((n) => n.tareas.length).sort((a, b) => b.tareas.length - a.tareas.length);
  const totalTareas = conTareas.reduce((s, n) => s + n.tareas.length, 0);
  const inbox = notas.filter((n) => n.carpeta.includes("Inbox") && n.titulo !== n.carpeta);
  const prospectos = vivas.filter((n) => n.etiquetas.includes("prospecto"));
  const notaHoy = notas.find((n) => n.titulo === hoy);

  // ---- Avisos (como el aviso del día de conmaria.cl) ----
  const avisos: Aviso[] = [];
  const limite = (dias: number) => sumarDias(hoy, dias);
  for (const n of prestamos) {
    const f = texto(n.meta.proximo_pago);
    if (f && f <= limite(7)) {
      avisos.push({ nivel: f < hoy ? "vencido" : "pronto", texto: `Pago ${pesos(numero(n.meta.cuota))} · ${n.titulo}`, ruta: n.ruta, fecha: f });
    }
  }
  for (const n of vivas) {
    const f = texto(n.meta.fecha_objetivo);
    const estado = texto(n.meta.estado)?.toLowerCase();
    if (f && f <= limite(14) && !CERRADOS.has(estado ?? "")) {
      avisos.push({ nivel: f < hoy ? "vencido" : "pronto", texto: `Meta: ${n.titulo}`, ruta: n.ruta, fecha: f });
    }
    for (const t of n.tareas) {
      if (t.fecha && t.fecha <= limite(3)) avisos.push({ nivel: t.fecha < hoy ? "vencido" : "pronto", texto: t.texto, ruta: n.ruta, fecha: t.fecha });
    }
  }
  avisos.sort((a, b) => a.fecha.localeCompare(b.fecha));

  // ---- Salas: una por carpeta de primer nivel ----
  const salas = new Map<string, number>();
  for (const n of notas) salas.set(n.carpeta, (salas.get(n.carpeta) ?? 0) + 1);
  const ordenSalas = [...salas].sort(([a], [b]) => {
    const peso = (c: string) => (c === RAIZ ? 2 : /^\d/.test(c) ? (c.startsWith("99") ? 3 : 1) : c === "Plantillas" ? 4 : 0);
    return peso(a) - peso(b) || a.localeCompare(b, "es");
  });

  const recientes = [...vivas].sort((a, b) => (b.modificado ?? "").localeCompare(a.modificado ?? "")).slice(0, 8);

  const kpis = [
    { icono: Briefcase, valor: String(proyectos.length), etiqueta: "Proyectos activos", color: "text-rose-200" },
    { icono: ListChecks, valor: String(totalTareas), etiqueta: "Tareas abiertas", color: "text-sky-200" },
    { icono: Wallet, valor: pesos(deuda), etiqueta: `Deuda vigente · cuota ${pesos(cuotas)}/mes`, color: "text-emerald-200" },
    { icono: Inbox, valor: String(inbox.length), etiqueta: prospectos.length ? `En la Inbox · ${prospectos.length} prospectos` : "En la Inbox", color: "text-amber-200" },
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-indigo-200/60">Oficina virtual</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {saludo()}{nombre ? `, ${nombre}` : ""}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {notas.length} notas · sincronizado {haceCuanto(ultimaSync)}
            {" · "}
            {notaHoy ? (
              <Link href={hrefNota(notaHoy.ruta)} className="text-indigo-300 hover:underline">
                Nota de hoy
              </Link>
            ) : (
              <span>aún sin nota de hoy en el Diario</span>
            )}
          </p>
        </div>
        <Sincronizar />
      </div>

      {avisos.length > 0 && (
        <section className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4 backdrop-blur">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-100">
            <BellRing className="h-4 w-4" strokeWidth={1.5} /> Avisos
          </h2>
          <ul className="mt-3 grid gap-2">
            {avisos.slice(0, 8).map((a, i) => (
              <li key={i}>
                <Link href={hrefNota(a.ruta)} className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-sm transition-colors hover:bg-white/5">
                  {a.nivel === "vencido" ? (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.5} />
                  ) : (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-amber-300" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-slate-200">{a.texto}</span>
                  <span className={`shrink-0 text-xs ${a.nivel === "vencido" ? "text-rose-300" : "text-amber-200/80"}`}>
                    {a.nivel === "vencido" ? "venció " : ""}
                    {fechaCorta(a.fecha)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {avisos.length > 8 && <p className="mt-2 px-2 text-xs text-slate-500">y {avisos.length - 8} más</p>}
        </section>
      )}

      <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.etiqueta} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
            <k.icono className={`h-5 w-5 ${k.color}`} strokeWidth={1.5} />
            <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-white md:text-3xl">{k.valor}</p>
            <p className="mt-1 text-xs text-slate-400">{k.etiqueta}</p>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-indigo-200/70">Salas</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {ordenSalas.map(([carpeta, total]) => (
            <TarjetaSala key={carpeta} dir={carpeta === RAIZ ? "" : carpeta} etiqueta={carpeta === RAIZ ? "Raíz" : undefined} notas={total} />
          ))}
        </div>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Panel titulo="Proyectos activos">
          {proyectos.length ? (
            <ul className="divide-y divide-white/5">
              {proyectos.map((p) => (
                <li key={p.ruta}>
                  <Link href={hrefNota(p.ruta)} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.04]">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-100">{p.titulo}</span>
                    {p.tareas.length > 0 && <Chip>{p.tareas.length} tareas</Chip>}
                    {texto(p.meta.fecha_objetivo) && <span className="shrink-0 text-xs text-slate-400">meta {fechaCorta(texto(p.meta.fecha_objetivo)!)}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-6 text-sm text-slate-500">No hay proyectos con estado activo.</p>
          )}
        </Panel>

        <Panel titulo="Tareas abiertas en el vault">
          {conTareas.length ? (
            <div className="max-h-[26rem] divide-y divide-white/5 overflow-y-auto">
              {conTareas.slice(0, 8).map((n) => (
                <div key={n.ruta} className="px-4 py-3">
                  <Link href={hrefNota(n.ruta)} className="text-sm font-medium text-indigo-200 hover:underline">
                    {n.titulo}
                  </Link>
                  <ul className="mt-1.5 space-y-1">
                    {n.tareas.slice(0, 3).map((t, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded border border-slate-500" />
                        <span className="line-clamp-2">{textoPlano(t.texto)}</span>
                      </li>
                    ))}
                    {n.tareas.length > 3 && <li className="pl-6 text-xs text-slate-500">+{n.tareas.length - 3} más</li>}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-4 py-6 text-sm text-slate-500">Sin tareas pendientes. 🎉</p>
          )}
        </Panel>
      </div>

      <div className="mt-6">
        <Panel titulo="Editadas recientemente" accion={<NotebookPen className="h-4 w-4 text-slate-500" strokeWidth={1.5} />}>
          <div className="grid divide-y divide-white/5 md:grid-cols-2 md:divide-y-0">
            {recientes.map((n) => (
              <FilaNota key={n.ruta} n={n} mostrarCarpeta />
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
