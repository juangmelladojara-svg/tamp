"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { gsap } from "gsap";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  AlertTriangle,
  X,
  Sparkles,
  Search,
  Smartphone,
  ShieldCheck,
  MessageCircle,
  RotateCcw,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

import Logo from "@/components/Logo";
import { WHATSAPP_NUMBER } from "@/lib/site";
import {
  CATEGORIAS,
  type CategoriaId,
  type Chequeo,
  type RespuestaDiagnostico,
} from "@/lib/diagnostico/tipos";

const STROKE = 1.25;

const ICONOS: Record<CategoriaId, LucideIcon> = {
  ia: Sparkles,
  seo: Search,
  movil: Smartphone,
  tecnico: ShieldCheck,
};

const PASOS = [
  "Visitando tu sitio…",
  "Leyéndolo como lo lee ChatGPT…",
  "Revisando lo que ve Google…",
  "Probando cómo se ve en celular…",
  "Pidiéndole a Google que mida la velocidad…",
  "Armando tu informe…",
];

const ORDEN_ESTADO = { falta: 0, mejorable: 1, ok: 2 } as const;

function tono(nota: number) {
  if (nota >= 80) return { texto: "text-emerald-600", trazo: "#059669", fondo: "bg-emerald-500", etiqueta: "Muy bien" };
  if (nota >= 50) return { texto: "text-amber-600", trazo: "#d97706", fondo: "bg-amber-500", etiqueta: "Se puede mejorar" };
  return { texto: "text-rose-600", trazo: "#e11d48", fondo: "bg-rose-500", etiqueta: "Necesita atención" };
}

function dominio(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function Diagnostico() {
  const [url, setUrl] = useState("");
  const [cargando, setCargando] = useState(false);
  const [paso, setPaso] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<RespuestaDiagnostico | null>(null);
  const raiz = useRef<HTMLElement>(null);
  const zonaResultado = useRef<HTMLDivElement>(null);

  // Entrada del hero
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Mismo patrón que la landing: .reveal parte invisible en CSS (sin parpadeo)
      gsap.set("[data-hero]", { y: 28 });
      gsap.to("[data-hero]", { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.08, delay: 0.05 });
    }, raiz);
    return () => ctx.revert();
  }, []);

  // Mensajes de progreso mientras se analiza
  useEffect(() => {
    if (!cargando) return;
    setPaso(0);
    const id = setInterval(() => setPaso((p) => Math.min(p + 1, PASOS.length - 1)), 3200);
    return () => clearInterval(id);
  }, [cargando]);

  // Entrada de los resultados
  useEffect(() => {
    if (!resultado || !zonaResultado.current) return;
    zonaResultado.current.scrollIntoView({ behavior: "smooth", block: "start" });
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-res]",
        { y: 26, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.07 }
      );
    }, zonaResultado);
    return () => ctx.revert();
  }, [resultado]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (cargando) return;
    setError(null);
    setResultado(null);
    setCargando(true);
    try {
      const res = await fetch("/api/diagnostico", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const datos = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(datos.error ?? "No pudimos analizar el sitio.");
      setResultado(datos as RespuestaDiagnostico);
    } catch (err) {
      setError((err as Error).message || "No pudimos analizar el sitio.");
    } finally {
      setCargando(false);
    }
  }

  function reiniciar() {
    setResultado(null);
    setError(null);
    setUrl("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main ref={raiz} className="relative w-full max-w-full overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% -10%, rgba(79,70,229,0.07), transparent 70%), radial-gradient(40% 40% at 90% 20%, rgba(11,11,12,0.04), transparent 70%)",
        }}
      />

      {/* ---------------- NAV ---------------- */}
      <header className="fixed inset-x-0 top-0 z-40">
        <nav className="mx-auto mt-5 flex w-[min(960px,92%)] items-center justify-between rounded-full border border-black/5 bg-white/70 px-3 py-2.5 pl-5 backdrop-blur-xl">
          <a href="/" className="flex items-center" aria-label="TAMP, ir al inicio">
            <Logo className="text-lg" />
          </a>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-ink-500 transition-colors duration-300 hover:text-ink-900"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={STROKE} />
            Volver al inicio
          </a>
        </nav>
      </header>

      {/* ---------------- HERO + FORMULARIO ---------------- */}
      <section className="relative px-5 pb-16 pt-40 md:pt-48">
        <div className="mx-auto max-w-3xl text-center">
          <p data-hero className="reveal label">Diagnóstico TAMP · gratis</p>
          <h1
            data-hero
            className="reveal mx-auto mt-5 font-display font-semibold leading-[1.02] tracking-tight"
            style={{ fontSize: "clamp(2.3rem, 5.4vw, 4.4rem)" }}
          >
            ¿Te encuentran Google
            <br className="hidden sm:block" /> y la inteligencia artificial?
          </h1>
          <p data-hero className="reveal mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-500">
            Escribe la dirección de tu web y en segundos te decimos qué ve ChatGPT, qué ve Google, cómo se ve en
            celular y qué arreglar primero.
          </p>

          <form data-hero onSubmit={enviar} className="reveal mx-auto mt-10 max-w-2xl">
            <div className="bezel soft-shadow">
              <div className="bezel-core flex flex-col gap-2 p-2 sm:flex-row">
                <label htmlFor="url" className="sr-only">
                  Dirección de tu sitio web
                </label>
                <input
                  id="url"
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  placeholder="miempresa.cl"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={cargando}
                  className="min-w-0 flex-1 rounded-[1.1rem] bg-transparent px-5 py-4 font-mono text-base text-ink-900 outline-none placeholder:text-ink-300 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={cargando}
                  className="group inline-flex items-center justify-center gap-2 rounded-[1.1rem] bg-ink-900 px-6 py-4 font-medium text-ink-50 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:cursor-wait disabled:opacity-80"
                >
                  {cargando ? "Analizando…" : "Analizar mi web"}
                  {!cargando && (
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-0.5"
                      strokeWidth={STROKE}
                    />
                  )}
                </button>
              </div>
            </div>
            <p className="mt-4 text-xs text-ink-400">Sin registro. No guardamos tu web ni tus datos.</p>
          </form>

          {/* Progreso */}
          <div aria-live="polite" className="mx-auto mt-8 max-w-md">
            {cargando && (
              <div className="flex flex-col items-center gap-4">
                <div className="h-1 w-full overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-[3000ms] ease-out"
                    style={{ width: `${((paso + 1) / PASOS.length) * 92}%` }}
                  />
                </div>
                <p className="font-mono text-sm text-ink-500">{PASOS[paso]}</p>
                <p className="text-xs text-ink-400">Puede tardar hasta 30 segundos.</p>
              </div>
            )}
            {error && (
              <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-left text-sm text-rose-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
                {error}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------------- RESULTADOS ---------------- */}
      <div ref={zonaResultado} className="scroll-mt-28">
        {resultado && <Resultados r={resultado} onReiniciar={reiniciar} />}
      </div>

      <footer className="px-5 pb-12 pt-16 text-center text-xs text-ink-400">
        <Logo className="text-base" /> · Más que una web, una herramienta.
      </footer>
    </main>
  );
}

/* ====================================================================== */

function Resultados({ r, onReiniciar }: { r: RespuestaDiagnostico; onReiniciar: () => void }) {
  // El anillo y las barras se llenan con transición CSS (no GSAP): el valor
  // final queda en el DOM aunque el navegador no pueda animar.
  const [lleno, setLleno] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setLleno(true), 150);
    return () => clearTimeout(id);
  }, []);
  const t = tono(r.nota);
  const circ = 2 * Math.PI * 52;
  const categorias = Object.keys(CATEGORIAS) as CategoriaId[];
  const pendientes = r.chequeos
    .filter((c) => c.estado !== "ok")
    .sort((a, b) => ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado] || b.max - b.puntos - (a.max - a.puntos));

  const prioridades = pendientes.slice(0, 3).map((c) => `- ${c.titulo}`).join("\n");
  const mensaje =
    `Hola, hice el Diagnóstico TAMP de ${dominio(r.urlFinal)} y saqué ${r.nota}/100.` +
    (prioridades ? `\nLo más urgente:\n${prioridades}` : "") +
    `\n¿Me ayudan a mejorarlo?`;
  const whatsapp = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;

  return (
    <section className="px-5 pb-10">
      <div className="mx-auto max-w-5xl">
        {/* Resumen */}
        <div data-res className="bezel soft-shadow">
          <div className="bezel-core grid gap-10 p-7 md:grid-cols-[auto_1fr] md:items-center md:p-10">
            <div className="relative mx-auto h-44 w-44">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#ecebe6" strokeWidth="9" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke={t.trazo}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={lleno ? circ * (1 - r.nota / 100) : circ}
                  className="transition-[stroke-dashoffset] duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <div className="font-display text-5xl font-semibold tracking-tight text-ink-900">{r.nota}</div>
                  <div className="font-mono text-xs text-ink-400">de 100</div>
                </div>
              </div>
            </div>

            <div>
              <p className="label">Resultado para {dominio(r.urlFinal)}</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                <span className={t.texto}>{t.etiqueta}.</span>{" "}
                {pendientes.length
                  ? `Encontramos ${pendientes.length} ${pendientes.length === 1 ? "cosa" : "cosas"} para mejorar.`
                  : "Tu web está en muy buena forma."}
              </h2>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                {categorias.map((id) => {
                  const Icono = ICONOS[id];
                  const nota = r.porCategoria[id];
                  return (
                    <div key={id}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="inline-flex items-center gap-2 text-ink-700">
                          <Icono className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
                          {CATEGORIAS[id].titulo}
                        </span>
                        <span className="font-mono text-ink-500">{nota}</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100">
                        <div
                          className={`h-full rounded-full transition-[width] delay-200 duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${tono(nota).fondo}`}
                          style={{ width: lleno ? `${nota}%` : "0%" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Detalle por categoría */}
        <div className="mt-14 grid gap-12">
          {categorias.map((id) => {
            const cs = r.chequeos
              .filter((c) => c.categoria === id)
              .sort((a, b) => ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado]);
            if (!cs.length) return null;
            const Icono = ICONOS[id];
            return (
              <div key={id} data-res>
                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ink-900 text-ink-50">
                    <Icono className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                  <div>
                    <h3 className="font-display text-2xl font-semibold tracking-tight">{CATEGORIAS[id].titulo}</h3>
                    <p className="mt-1 text-ink-500">{CATEGORIAS[id].bajada}</p>
                  </div>
                </div>
                <ul className="mt-6 grid gap-3">
                  {cs.map((c) => (
                    <FilaChequeo key={c.id} c={c} />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {r.omitidos.length > 0 && (
          <p data-res className="mt-8 text-sm text-ink-400">
            No se pudo medir: {r.omitidos.join(" · ")}. La nota se calculó con el resto.
          </p>
        )}

        {/* Llamado a la acción */}
        <div data-res className="relative mt-16 overflow-hidden rounded-[2rem] bg-ink-900 px-7 py-12 text-ink-50 md:px-14 md:py-16">
          <div aria-hidden className="mesh-ribbon pointer-events-none absolute -right-40 -top-40 h-96 w-96 opacity-30" />
          <div className="relative max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-400">Siguiente paso</p>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
              {pendientes.length ? "¿Lo arreglamos juntos?" : "¿Y si tu web además trabajara sola?"}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-300">
              {pendientes.length
                ? "Te explicamos el informe en una conversación corta y te decimos qué conviene hacer primero. Sin compromiso."
                : "Automatizamos reservas, cotizaciones, recordatorios y seguimiento de clientes para que tu web no solo se vea bien: que también trabaje."}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-ink-50 py-4 pl-7 pr-2.5 font-medium text-ink-900 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
              >
                Hablar por WhatsApp
                <span className="grid h-8 w-8 place-items-center rounded-full bg-ink-900 text-ink-50 transition-transform duration-500 group-hover:translate-x-0.5">
                  <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
                </span>
              </a>
              <button
                onClick={onReiniciar}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-7 py-4 font-medium text-ink-200 transition-colors duration-300 hover:bg-white/5"
              >
                <RotateCcw className="h-4 w-4" strokeWidth={1.5} />
                Analizar otra web
              </button>
            </div>

            {/* Solo si el diagnóstico quedó guardado: el lead se liga a él. */}
            {r.id && <PedirInforme diagnosticoId={r.id} />}
          </div>
        </div>
      </div>
    </section>
  );
}

function FilaChequeo({ c }: { c: Chequeo }) {
  const estilo = {
    ok: { Icono: Check, caja: "bg-emerald-50 text-emerald-600", etiqueta: "Bien" },
    mejorable: { Icono: AlertTriangle, caja: "bg-amber-50 text-amber-600", etiqueta: "Mejorable" },
    falta: { Icono: X, caja: "bg-rose-50 text-rose-600", etiqueta: "Falta" },
  }[c.estado];

  return (
    <li>
      <details className="group rounded-2xl border border-black/[0.06] bg-white/70 transition-colors duration-300 open:bg-white">
        <summary className="flex cursor-pointer list-none items-start gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
          <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${estilo.caja}`}>
            <estilo.Icono className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-medium text-ink-900">{c.titulo}</span>
              <span className="sr-only">: {estilo.etiqueta}</span>
            </span>
            <span className="mt-1 block text-sm text-ink-500">{c.detalle}</span>
          </span>
          <ChevronDown
            className="mt-1 h-4 w-4 shrink-0 text-ink-300 transition-transform duration-300 group-open:rotate-180"
            strokeWidth={1.5}
            aria-hidden
          />
        </summary>
        <div className="grid gap-3 px-5 pb-5 pl-16 text-sm leading-relaxed">
          <p className="text-ink-600">
            <span className="font-medium text-ink-900">Por qué importa: </span>
            {c.porQue}
          </p>
          {c.estado !== "ok" && (
            <p className="text-ink-600">
              <span className="font-medium text-ink-900">Cómo se arregla: </span>
              {c.comoArreglar}
            </p>
          )}
        </div>
      </details>
    </li>
  );
}

/**
 * Alternativa al botón de WhatsApp para quien prefiere que le escriban:
 * deja nombre y contacto, y queda como lead en admin.tamp.cl.
 */
function PedirInforme({ diagnosticoId }: { diagnosticoId: string }) {
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [trampa, setTrampa] = useState("");
  const [estado, setEstado] = useState<"listo" | "enviando" | "enviado">("listo");
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (estado !== "listo") return;
    setError(null);
    setEstado("enviando");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ diagnosticoId, nombre, contacto, sitio: trampa }),
      });
      const datos = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(datos.error ?? "No pudimos enviar tu solicitud.");
      setEstado("enviado");
    } catch (err) {
      setError((err as Error).message || "No pudimos enviar tu solicitud.");
      setEstado("listo");
    }
  }

  if (estado === "enviado") {
    return (
      <p role="status" className="mt-10 flex items-start gap-3 border-t border-white/10 pt-8 text-ink-200">
        <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" strokeWidth={1.75} />
        <span>
          Listo, {nombre.split(" ")[0]}. Te escribimos para enviarte el informe completo y lo que haríamos primero.
        </span>
      </p>
    );
  }

  const campo =
    "w-full rounded-full border border-white/15 bg-white/5 px-5 py-3.5 text-ink-50 placeholder:text-ink-400 outline-none transition-colors duration-300 focus:border-white/40";

  return (
    <form onSubmit={enviar} className="mt-10 border-t border-white/10 pt-8">
      <p className="font-medium text-ink-100">¿Prefieres que te escribamos?</p>
      <p className="mt-1 text-sm text-ink-400">
        Déjanos tus datos y te enviamos el informe completo, con lo que conviene arreglar primero.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <label className="sr-only" htmlFor="pi-nombre">Tu nombre</label>
        <input
          id="pi-nombre"
          required
          minLength={2}
          maxLength={120}
          autoComplete="name"
          placeholder="Tu nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className={campo}
        />
        <label className="sr-only" htmlFor="pi-contacto">WhatsApp o correo</label>
        <input
          id="pi-contacto"
          required
          maxLength={200}
          placeholder="WhatsApp o correo"
          value={contacto}
          onChange={(e) => setContacto(e.target.value)}
          className={campo}
        />
        {/* Campo trampa para bots: invisible para personas. */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          value={trampa}
          onChange={(e) => setTrampa(e.target.value)}
          className="hidden"
        />
        <button
          type="submit"
          disabled={estado === "enviando"}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-ink-50 px-6 py-3.5 font-medium text-ink-900 transition-opacity duration-300 disabled:opacity-60"
        >
          {estado === "enviando" ? "Enviando…" : "Enviarme el informe"}
          <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-rose-300">
          {error}
        </p>
      )}
      <p className="mt-3 text-xs text-ink-500">
        Usamos tus datos solo para enviarte el informe y conversar sobre tu web. Nada de spam.
      </p>
    </form>
  );
}
