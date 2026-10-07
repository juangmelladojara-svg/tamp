import { Check, Archive } from "lucide-react";
import { sesionPortal } from "@/lib/yo/sesion";
import { fechaHoy } from "@/lib/yo/fecha";
import { alternarHabito, archivarHabito, crearHabito, guardarAnimo } from "../../acciones";

export const metadata = { title: "Seguimiento" };

const COLOR_ANIMO = ["", "bg-rose-400", "bg-orange-300", "bg-yellow-200", "bg-lime-300", "bg-emerald-400"];
const ETIQUETA = ["", "Muy bajo", "Bajo", "Normal", "Bien", "Muy bien"];

export default async function Seguimiento() {
  const { supabase } = await sesionPortal();
  const hoy = fechaHoy();
  const desde = fechaHoy(-13);

  const [animos, habitos, registros] = await Promise.all([
    supabase.from("animo").select("fecha, animo, energia, sueno_horas, nota").gte("fecha", desde).order("fecha"),
    supabase.from("habitos").select("id, nombre").eq("activo", true).order("creado_en"),
    supabase.from("habitos_registro").select("habito_id, fecha").gte("fecha", desde),
  ]);

  const porFecha = new Map((animos.data ?? []).map((a) => [a.fecha, a]));
  const hoyAnimo = porFecha.get(hoy);
  const dias = Array.from({ length: 14 }, (_, i) => fechaHoy(i - 13));
  const hechosHoy = new Set((registros.data ?? []).filter((r) => r.fecha === hoy).map((r) => r.habito_id));
  const rachaDe = (id: string) => {
    const set = new Set((registros.data ?? []).filter((r) => r.habito_id === id).map((r) => r.fecha));
    let n = 0;
    for (let i = set.has(hoy) ? 0 : -1; set.has(fechaHoy(i)); i--) n++;
    return n;
  };

  const caja = "rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur";
  const campo = "rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-slate-500 focus:border-indigo-300/60";

  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">Seguimiento</h1>
      <p className="mt-2 text-slate-400">Privado: solo tú ves esto.</p>

      <section className={`${caja} mt-8`}>
        <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-indigo-200/70">Cómo estás hoy</h2>
        <form action={guardarAnimo} className="grid gap-4">
          <fieldset>
            <legend className="mb-2 text-sm text-slate-400">Ánimo</legend>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="cursor-pointer">
                  <input type="radio" name="animo" value={n} required defaultChecked={hoyAnimo?.animo === n} className="peer sr-only" />
                  <span className="block rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition-colors peer-checked:border-indigo-300 peer-checked:bg-indigo-400/20 peer-checked:text-white">
                    {n} · {ETIQUETA[n]}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap gap-4">
            <label className="grid gap-1 text-sm text-slate-400">
              Energía (1–5)
              <input name="energia" type="number" min={1} max={5} defaultValue={hoyAnimo?.energia ?? ""} className={`${campo} w-28`} />
            </label>
            <label className="grid gap-1 text-sm text-slate-400">
              Horas de sueño
              <input name="sueno" type="number" min={0} max={24} step={0.5} defaultValue={hoyAnimo?.sueno_horas ?? ""} className={`${campo} w-28`} />
            </label>
          </div>
          <label className="grid gap-1 text-sm text-slate-400">
            Nota
            <textarea name="nota" rows={3} maxLength={2000} defaultValue={hoyAnimo?.nota ?? ""} className={campo} placeholder="Lo que quieras recordar de hoy" />
          </label>
          <button type="submit" className="justify-self-start rounded-full bg-indigo-400 px-6 py-2.5 font-medium text-[#05060f] transition-colors hover:bg-indigo-300">
            {hoyAnimo ? "Actualizar" : "Guardar"}
          </button>
        </form>

        <div className="mt-6 flex items-end gap-1.5" aria-label="Ánimo de los últimos 14 días">
          {dias.map((d) => {
            const a = porFecha.get(d);
            return (
              <div key={d} className="flex flex-1 flex-col items-center gap-1" title={`${d}${a ? ` · ${ETIQUETA[a.animo]}` : " · sin registro"}`}>
                <div className={`w-full rounded-md ${a ? COLOR_ANIMO[a.animo] : "bg-white/10"}`} style={{ height: a ? 12 + a.animo * 10 : 8 }} />
                <span className="text-[10px] text-slate-500">{d.slice(8)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className={`${caja} mt-6`}>
        <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-indigo-200/70">Hábitos de hoy</h2>
        {habitos.data?.length ? (
          <ul className="grid gap-2">
            {habitos.data.map((h) => {
              const hecho = hechosHoy.has(h.id);
              const racha = rachaDe(h.id);
              return (
                <li key={h.id} className="group flex items-center gap-3 rounded-2xl bg-white/[0.03] px-4 py-3">
                  <form action={alternarHabito}>
                    <input type="hidden" name="id" value={h.id} />
                    <input type="hidden" name="hecho" value={hecho ? "1" : "0"} />
                    <button
                      type="submit"
                      aria-label={hecho ? "Desmarcar" : "Marcar hecho"}
                      className={`grid h-6 w-6 place-items-center rounded-full border transition-colors ${
                        hecho ? "border-purple-300 bg-purple-300 text-[#05060f]" : "border-slate-500 hover:border-purple-200"
                      }`}
                    >
                      {hecho && <Check className="h-4 w-4" strokeWidth={3} />}
                    </button>
                  </form>
                  <span className="min-w-0 flex-1 truncate text-slate-100">{h.nombre}</span>
                  {racha > 0 && <span className="text-xs text-purple-200/80">{racha} {racha === 1 ? "día" : "días"} seguidos</span>}
                  <form action={archivarHabito}>
                    <input type="hidden" name="id" value={h.id} />
                    <button type="submit" aria-label="Archivar hábito" className="text-slate-600 opacity-0 transition-opacity hover:text-slate-300 group-hover:opacity-100 focus:opacity-100">
                      <Archive className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">Aún no tienes hábitos. Agrega el primero.</p>
        )}
        <form action={crearHabito} className="mt-4 flex gap-2">
          <input name="nombre" required maxLength={100} placeholder="Nuevo hábito (ej. tomar medicación)" className={`${campo} min-w-0 flex-1`} />
          <button type="submit" className="rounded-xl border border-white/15 px-4 py-2 text-slate-200 transition-colors hover:bg-white/10">
            Agregar
          </button>
        </form>
      </section>
    </>
  );
}
