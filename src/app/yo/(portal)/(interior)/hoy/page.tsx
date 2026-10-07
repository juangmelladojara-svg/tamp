import { Check, Star, Trash2 } from "lucide-react";
import { sesionPortal } from "@/lib/yo/sesion";
import { alternarFoco, alternarTarea, borrarTarea, crearTarea } from "../../acciones";

export const metadata = { title: "Foco del día" };

const PRIORIDAD = { 1: "Alta", 2: "Media", 3: "Baja" } as const;

type Tarea = { id: string; titulo: string; hecha: boolean; foco: boolean; prioridad: number };

function Fila({ t }: { t: Tarea }) {
  return (
    <li className="group flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 backdrop-blur">
      <form action={alternarTarea}>
        <input type="hidden" name="id" value={t.id} />
        <input type="hidden" name="hecha" value={t.hecha ? "1" : "0"} />
        <button
          type="submit"
          aria-label={t.hecha ? "Marcar pendiente" : "Marcar hecha"}
          className={`grid h-6 w-6 place-items-center rounded-full border transition-colors ${
            t.hecha ? "border-sky-400 bg-sky-400 text-[#05060f]" : "border-slate-500 hover:border-sky-300"
          }`}
        >
          {t.hecha && <Check className="h-4 w-4" strokeWidth={3} />}
        </button>
      </form>
      <span className={`min-w-0 flex-1 truncate ${t.hecha ? "text-slate-500 line-through" : "text-slate-100"}`}>{t.titulo}</span>
      {!t.hecha && <span className="text-xs text-slate-500">{PRIORIDAD[t.prioridad as 1 | 2 | 3]}</span>}
      <form action={alternarFoco}>
        <input type="hidden" name="id" value={t.id} />
        <input type="hidden" name="foco" value={t.foco ? "1" : "0"} />
        <button type="submit" aria-label="Foco del día" className={t.foco ? "text-amber-300" : "text-slate-600 hover:text-amber-200"}>
          <Star className="h-4 w-4" fill={t.foco ? "currentColor" : "none"} strokeWidth={1.5} />
        </button>
      </form>
      <form action={borrarTarea}>
        <input type="hidden" name="id" value={t.id} />
        <button type="submit" aria-label="Borrar" className="text-slate-600 opacity-0 transition-opacity hover:text-rose-300 group-hover:opacity-100 focus:opacity-100">
          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </form>
    </li>
  );
}

export default async function Hoy() {
  const { supabase } = await sesionPortal();
  const { data } = await supabase
    .from("tareas")
    .select("id, titulo, hecha, foco, prioridad")
    .order("prioridad", { ascending: true })
    .order("creado_en", { ascending: false });

  const todas = data ?? [];
  const foco = todas.filter((t) => t.foco && !t.hecha);
  const pendientes = todas.filter((t) => !t.foco && !t.hecha);
  const hechas = todas.filter((t) => t.hecha).slice(0, 10);

  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">Foco del día</h1>
      <p className="mt-2 text-slate-400">Elige pocas cosas con la estrella. Lo demás puede esperar.</p>

      <form action={crearTarea} className="mt-8 flex flex-wrap gap-2">
        <input
          name="titulo"
          required
          maxLength={300}
          placeholder="Nueva tarea…"
          className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-indigo-300/60"
        />
        <select name="prioridad" defaultValue="2" className="rounded-2xl border border-white/10 bg-[#0b0d22] px-3 py-3 text-slate-200">
          <option value="1">Alta</option>
          <option value="2">Media</option>
          <option value="3">Baja</option>
        </select>
        <label className="flex items-center gap-2 px-2 text-sm text-slate-400">
          <input type="checkbox" name="foco" className="accent-amber-300" /> Foco
        </label>
        <button type="submit" className="rounded-2xl bg-indigo-400 px-5 py-3 font-medium text-[#05060f] transition-colors hover:bg-indigo-300">
          Agregar
        </button>
      </form>

      <Seccion titulo="En foco" vacio="Nada en foco todavía." tareas={foco} />
      <Seccion titulo="Pendientes" vacio="Sin pendientes." tareas={pendientes} />
      {hechas.length > 0 && <Seccion titulo="Hechas" vacio="" tareas={hechas} />}
    </>
  );
}

function Seccion({ titulo, vacio, tareas }: { titulo: string; vacio: string; tareas: Tarea[] }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-indigo-200/70">{titulo}</h2>
      {tareas.length ? (
        <ul className="grid gap-2">
          {tareas.map((t) => (
            <Fila key={t.id} t={t} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">{vacio}</p>
      )}
    </section>
  );
}
