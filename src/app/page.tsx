"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Code2,
  Workflow,
  Plug,
  Bot,
  LifeBuoy,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Minus,
  Check,
  Zap,
  ShoppingBag,
  Briefcase,
  HeartPulse,
  Truck,
  GraduationCap,
  Factory,
} from "lucide-react";
import ParticleField from "./ParticleField";

const STROKE = 1.25;

const servicios = [
  {
    icon: Code2,
    titulo: "Desarrollo web a medida",
    desc: "Sitios y aplicaciones construidos con Next.js y React. Rápidos, propios y pensados para crecer contigo — nada de plantillas genéricas.",
    span: "md:col-span-4 md:row-span-2",
    big: true,
  },
  {
    icon: Workflow,
    titulo: "Automatización",
    desc: "Flujos con n8n que eliminan el trabajo repetitivo.",
    span: "md:col-span-2",
  },
  {
    icon: Plug,
    titulo: "Integraciones & APIs",
    desc: "Conectamos tus herramientas para que hablen entre sí.",
    span: "md:col-span-2",
  },
  {
    icon: Bot,
    titulo: "Agentes de IA",
    desc: "Asistentes que responden, clasifican y ejecutan tareas por ti, día y noche.",
    span: "md:col-span-3",
  },
  {
    icon: LifeBuoy,
    titulo: "Soporte & evolución",
    desc: "No desaparecemos al entregar: mantenemos y hacemos crecer lo construido.",
    span: "md:col-span-3",
  },
];

const sectores = [
  {
    icon: ShoppingBag,
    titulo: "Comercio & Retail",
    desc: "Catálogo, ventas y stock conectados, online y en tienda, sin planillas sueltas.",
  },
  {
    icon: Briefcase,
    titulo: "Servicios Profesionales",
    desc: "Agenda, cobros y seguimiento de clientes en un solo lugar.",
  },
  {
    icon: HeartPulse,
    titulo: "Salud & Bienestar",
    desc: "Reservas, fichas y recordatorios automáticos para tus pacientes.",
  },
  {
    icon: Truck,
    titulo: "Logística & Distribución",
    desc: "Pedidos, despachos y seguimiento que avanzan sin intervención manual.",
  },
  {
    icon: GraduationCap,
    titulo: "Educación & Formación",
    desc: "Inscripciones, pagos y contenidos en una plataforma propia.",
  },
  {
    icon: Factory,
    titulo: "Manufactura & Industria",
    desc: "Órdenes, inventario y producción bajo control y en tiempo real.",
  },
];

const proceso = [
  { n: "01", t: "Descubrimiento", d: "Entendemos tu negocio y dónde se te van las horas." },
  { n: "02", t: "Diseño", d: "Definimos la herramienta: interfaz, datos y flujos." },
  { n: "03", t: "Desarrollo", d: "Construimos con código propio, limpio y mantenible." },
  { n: "04", t: "Automatización", d: "Conectamos procesos para que trabajen solos." },
  { n: "05", t: "Soporte", d: "Medimos, ajustamos y evolucionamos contigo." },
];

const metricas = [
  { count: 42, suffix: "+", label: "Proyectos entregados" },
  { count: 120, prefix: "−", suffix: " h", label: "Horas/mes automatizadas" },
  { count: 100, suffix: "%", label: "Hecho a medida" },
  { count: 3, prefix: "×", suffix: "", label: "Más rápido al entregar" },
];

const stack = [
  "Next.js", "React", "TypeScript", "Tailwind", "Supabase",
  "n8n", "Vercel", "PostgreSQL", "OpenAI", "Stripe",
];

const testimonios = [
  {
    q: "Dejamos de copiar datos a mano entre tres sistemas. Lo que tomaba un día ahora pasa solo.",
    a: "Gerente de Operaciones",
    e: "Distribuidora consolidada",
  },
  {
    q: "No nos hicieron una página: nos hicieron una herramienta que usamos todos los días.",
    a: "Fundadora",
    e: "Pyme de servicios",
  },
  {
    q: "Respuesta rápida, código ordenado y soporte real. Por fin un equipo técnico de confianza.",
    a: "Director Comercial",
    e: "Empresa manufacturera",
  },
];

const faqs = [
  {
    q: "¿Trabajan con pymes o solo con empresas grandes?",
    a: "Con ambas. Adaptamos el alcance: una pyme puede empezar con una herramienta puntual y una empresa consolidada con un sistema completo. Lo importante es resolver un problema real.",
  },
  {
    q: "¿Qué significa exactamente 'automatización'?",
    a: "Conectar tus herramientas y procesos para que tareas repetitivas (enviar correos, mover datos, generar reportes, responder consultas) ocurran solas, sin que nadie tenga que hacerlas a mano.",
  },
  {
    q: "¿Me entregan el código o quedo amarrado a ustedes?",
    a: "El código es tuyo. Construimos sobre tecnologías estándar y abiertas; puedes seguir con nosotros para evolucionarlo o llevártelo cuando quieras.",
  },
  {
    q: "¿Cuánto tarda un proyecto?",
    a: "Una herramienta acotada puede estar lista en semanas. Proyectos más grandes se entregan por etapas, con algo funcionando desde temprano.",
  },
];

function formatCount(v: number, prefix = "", suffix = "") {
  return `${prefix}${Math.round(v)}${suffix}`;
}

export default function Home() {
  const root = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // Cascada del hero al cargar
      gsap.to("[data-hero]", {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: "power3.out",
        stagger: 0.09,
        delay: 0.1,
      });
      gsap.set("[data-hero]", { y: 30 });

      // Reveals genéricos al hacer scroll
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.fromTo(
          el,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 86%" },
          }
        );
      });

      // Bento escalonado
      gsap.utils.toArray<HTMLElement>("[data-bento]").forEach((el, i) => {
        gsap.fromTo(
          el,
          { y: 34, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            delay: (i % 3) * 0.06,
            scrollTrigger: { trigger: el.parentElement, start: "top 80%" },
          }
        );
      });

      // Manifiesto: revelado palabra por palabra con scrub
      gsap.utils.toArray<HTMLElement>(".manifesto .word").forEach((w) => {
        gsap.fromTo(
          w,
          { opacity: 0.12 },
          {
            opacity: 1,
            ease: "none",
            scrollTrigger: { trigger: w, start: "top 82%", end: "top 58%", scrub: true },
          }
        );
      });

      // Conteo de métricas
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const end = Number(el.dataset.count);
        const prefix = el.dataset.prefix ?? "";
        const suffix = el.dataset.suffix ?? "";
        const obj = { v: 0 };
        gsap.to(obj, {
          v: end,
          duration: 1.6,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
          onUpdate: () => {
            el.textContent = formatCount(obj.v, prefix, suffix);
          },
        });
      });
    }, root);

    return () => ctx.revert();
  }, []);

  const nav = [
    { href: "#servicios", label: "Servicios" },
    { href: "#sectores", label: "Sectores" },
    { href: "#proceso", label: "Proceso" },
    { href: "#resultados", label: "Resultados" },
    { href: "#faq", label: "Preguntas" },
  ];

  return (
    <main ref={root} className="relative w-full max-w-full overflow-x-hidden">
      {/* Wash radial de fondo */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% -10%, rgba(79,70,229,0.06), transparent 70%), radial-gradient(40% 40% at 90% 20%, rgba(11,11,12,0.04), transparent 70%)",
        }}
      />

      {/* ---------------- NAV (pill flotante) ---------------- */}
      <header className="fixed inset-x-0 top-0 z-40">
        <nav className="mx-auto mt-5 flex w-[min(960px,92%)] items-center justify-between rounded-full border border-black/5 bg-white/70 px-3 py-2.5 pl-5 backdrop-blur-xl">
          <a href="#top" className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink-900 text-ink-50">
              <Zap className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">TAMP</span>
          </a>

          <div className="hidden items-center gap-7 md:flex">
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="text-sm text-ink-500 transition-colors duration-300 hover:text-ink-900"
              >
                {n.label}
              </a>
            ))}
          </div>

          <a
            href="#contacto"
            className="group hidden items-center gap-2 rounded-full bg-ink-900 py-2 pl-5 pr-2 text-sm font-medium text-ink-50 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] md:inline-flex"
          >
            Agenda una llamada
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowUpRight className="h-4 w-4" strokeWidth={STROKE} />
            </span>
          </a>

          {/* Hamburguesa */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menú"
            className="relative grid h-9 w-9 place-items-center md:hidden"
          >
            <span
              className={`absolute h-px w-5 bg-ink-900 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                menuOpen ? "rotate-45" : "-translate-y-1.5"
              }`}
            />
            <span
              className={`absolute h-px w-5 bg-ink-900 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                menuOpen ? "-rotate-45" : "translate-y-1.5"
              }`}
            />
          </button>
        </nav>

        {/* Overlay móvil */}
        {menuOpen && (
          <div className="mx-auto mt-2 w-[92%] rounded-3xl border border-black/5 bg-white/85 p-6 backdrop-blur-2xl md:hidden">
            <div className="flex flex-col gap-4">
              {nav.map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  onClick={() => setMenuOpen(false)}
                  className="font-display text-2xl font-medium text-ink-900"
                >
                  {n.label}
                </a>
              ))}
              <a
                href="#contacto"
                onClick={() => setMenuOpen(false)}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-ink-900 py-3 text-sm font-medium text-ink-50"
              >
                Agenda una llamada <ArrowUpRight className="h-4 w-4" strokeWidth={STROKE} />
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ---------------- HERO ---------------- */}
      <section id="top" className="relative px-5 pb-24 pt-40 md:pt-52">
        <ParticleField />
        <div className="relative z-10 mx-auto max-w-6xl text-center">
          <p data-hero className="reveal label mb-7 inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Desarrollo + Automatización web
          </p>
          <h1
            data-hero
            className="reveal mx-auto max-w-5xl font-display font-semibold leading-[0.98] tracking-tight"
            style={{ fontSize: "clamp(2.8rem, 6.2vw, 5.6rem)" }}
          >
            Más que una web,
            <br className="hidden sm:block" /> una herramienta.
          </h1>
          <p
            data-hero
            className="reveal mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-ink-500 md:text-xl"
          >
            Diseñamos sitios a medida y automatizamos los procesos que mueven tu
            negocio. Para pymes que quieren escalar y empresas consolidadas que
            quieren dejar de perder horas.
          </p>

          <div data-hero className="reveal mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#contacto"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink-900 py-4 pl-7 pr-2.5 font-medium text-ink-50 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] sm:w-auto"
            >
              Agenda una llamada
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRight className="h-4 w-4" strokeWidth={STROKE} />
              </span>
            </a>
            <a
              href="#servicios"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-white/40 py-4 px-7 font-medium text-ink-700 transition-colors duration-300 hover:bg-white/80 sm:w-auto"
            >
              Ver lo que hacemos
              <ArrowRight className="h-4 w-4" strokeWidth={STROKE} />
            </a>
          </div>
        </div>

        {/* Visual: flujo de automatización (doble bisel) */}
        <div data-hero className="reveal relative z-10 mx-auto mt-16 max-w-4xl">
          <div className="bezel soft-shadow">
            <div className="bezel-core p-6 md:p-10">
              <div className="flex items-center justify-between gap-3 text-center md:gap-6">
                <FlowNode label="Formulario" />
                <FlowLine />
                <div className="flex flex-col items-center gap-2">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-ink-900 text-ink-50 md:h-20 md:w-20">
                    <Zap className="h-6 w-6" strokeWidth={1.5} />
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-widest text-accent">TAMP</span>
                </div>
                <FlowLine />
                <div className="flex flex-col gap-2.5">
                  <FlowNode label="Email" small />
                  <FlowNode label="CRM" small />
                  <FlowNode label="WhatsApp" small />
                </div>
              </div>
              <p className="mt-8 text-center font-mono text-xs text-ink-400">
                un evento entra · tu negocio responde solo
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- MARQUEE CONFIANZA ---------------- */}
      <section className="border-y border-black/5 py-7">
        <p className="label mb-5 text-center">Construido para equipos que no tienen tiempo que perder</p>
        <div className="relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
          <div className="flex shrink-0 animate-marquee items-center gap-14 pr-14">
            {[...stack, ...stack].map((s, i) => (
              <span key={i} className="font-display text-xl font-medium text-ink-300 whitespace-nowrap">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- SERVICIOS (BENTO) ---------------- */}
      <section id="servicios" className="px-5 py-28 md:py-40">
        <div className="mx-auto max-w-6xl">
          <div data-reveal className="reveal mb-12 max-w-2xl">
            <p className="label mb-4">Lo que hacemos</p>
            <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Cinco formas de quitarte trabajo de encima.
            </h2>
          </div>

          <div className="grid auto-rows-[minmax(180px,auto)] grid-flow-dense grid-cols-1 gap-4 md:grid-cols-6">
            {servicios.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.titulo}
                  data-bento
                  className={`reveal group flex flex-col justify-between rounded-[1.75rem] border border-black/5 bg-white/60 p-7 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white hover:soft-shadow ${s.span}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink-900 text-ink-50">
                      <Icon className="h-5 w-5" strokeWidth={STROKE} />
                    </span>
                    <ArrowUpRight
                      className="h-5 w-5 text-ink-300 transition-all duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink-900"
                      strokeWidth={STROKE}
                    />
                  </div>
                  <div className="mt-8">
                    <h3
                      className={`font-display font-semibold tracking-tight ${
                        s.big ? "text-3xl md:text-4xl" : "text-xl"
                      }`}
                    >
                      {s.titulo}
                    </h3>
                    <p className={`mt-2 text-ink-500 ${s.big ? "max-w-md text-lg" : "text-sm"}`}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------- SECTORES ---------------- */}
      <section id="sectores" className="px-5 py-28 md:py-36">
        <div className="mx-auto max-w-6xl">
          <div data-reveal className="reveal mb-12 flex flex-col items-baseline justify-between gap-4 md:flex-row">
            <h2 className="max-w-xl font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Para quién construimos.
            </h2>
            <p className="max-w-sm text-ink-500 md:text-right">
              Conocemos cómo trabaja tu sector. No partimos de cero contigo.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {sectores.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.titulo}
                  data-bento
                  className="reveal group flex flex-col justify-between rounded-[1.75rem] border border-black/5 bg-white/60 p-7 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white hover:soft-shadow"
                >
                  <div className="flex items-start justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink-900 text-ink-50">
                      <Icon className="h-5 w-5" strokeWidth={STROKE} />
                    </span>
                    <ArrowUpRight
                      className="h-5 w-5 text-ink-300 transition-all duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink-900"
                      strokeWidth={STROKE}
                    />
                  </div>
                  <div className="mt-10">
                    <h3 className="font-display text-xl font-semibold tracking-tight">{s.titulo}</h3>
                    <p className="mt-2 text-sm text-ink-500">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div data-reveal className="reveal mt-8 flex items-center gap-3 text-ink-500">
            <span className="h-px w-8 bg-ink-200" />
            <p className="text-sm">
              ¿Tu rubro no está en la lista?{" "}
              <a href="#contacto" className="text-ink-900 underline decoration-accent decoration-2 underline-offset-4">
                Conversémoslo igual
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- MANIFIESTO (scrub) ---------------- */}
      <section className="px-5 py-28 md:py-44">
        <div className="manifesto mx-auto max-w-4xl text-center">
          <p className="font-display text-3xl font-medium leading-[1.35] tracking-tight md:text-5xl md:leading-[1.3]">
            {"No entregamos páginas bonitas que no hacen nada. Entregamos herramientas que trabajan por ti."
              .split(" ")
              .map((w, i) => (
                <span key={i} className="word inline-block">
                  {w}&nbsp;
                </span>
              ))}
          </p>
        </div>
      </section>

      {/* ---------------- PROCESO (sticky split) ---------------- */}
      <section id="proceso" className="px-5 py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
          <div className="md:sticky md:top-32 md:self-start">
            <p className="label mb-4">Cómo trabajamos</p>
            <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Un proceso claro, sin cajas negras.
            </h2>
            <p className="mt-5 max-w-sm text-ink-500">
              Desde la primera conversación hasta el soporte continuo, sabes
              exactamente qué estamos construyendo y por qué.
            </p>
          </div>

          <div className="flex flex-col">
            {proceso.map((p) => (
              <div
                key={p.n}
                data-reveal
                className="reveal group flex items-start gap-6 border-t border-black/8 py-7 transition-colors duration-500 first:border-t-0 hover:bg-white/50"
              >
                <span className="font-mono text-sm text-ink-300">{p.n}</span>
                <div>
                  <h3 className="font-display text-2xl font-medium tracking-tight md:text-3xl">{p.t}</h3>
                  <p className="mt-1.5 text-ink-500">{p.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- RESULTADOS ---------------- */}
      <section id="resultados" className="px-5 py-28 md:py-36">
        <div className="mx-auto max-w-6xl">
          <div data-reveal className="reveal mb-12 flex flex-col items-baseline justify-between gap-4 md:flex-row">
            <h2 className="max-w-xl font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Lo que cambia cuando el software trabaja por ti.
            </h2>
            <p className="label">Resultados reales</p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {metricas.map((m) => (
              <div
                key={m.label}
                data-reveal
                className="reveal rounded-[1.5rem] border border-black/5 bg-white/60 p-7"
              >
                <p
                  data-count={m.count}
                  data-prefix={m.prefix ?? ""}
                  data-suffix={m.suffix ?? ""}
                  className="font-display text-5xl font-semibold tracking-tight md:text-6xl"
                >
                  {m.prefix ?? ""}0{m.suffix ?? ""}
                </p>
                <p className="mt-3 text-sm text-ink-500">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- TESTIMONIOS ---------------- */}
      <section className="px-5 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <p data-reveal className="reveal label mb-10">En sus palabras</p>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonios.map((t, i) => (
              <figure
                key={i}
                data-reveal
                className="reveal flex flex-col justify-between rounded-[1.75rem] border border-black/5 bg-white/60 p-8"
              >
                <blockquote className="font-display text-xl font-medium leading-snug tracking-tight">
                  “{t.q}”
                </blockquote>
                <figcaption className="mt-8 border-t border-black/8 pt-4">
                  <p className="font-medium text-ink-800">{t.a}</p>
                  <p className="text-sm text-ink-400">{t.e}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section id="faq" className="px-5 py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
          <div>
            <p className="label mb-4">Preguntas</p>
            <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Lo que suelen preguntarnos.
            </h2>
          </div>
          <div className="flex flex-col">
            {faqs.map((f, i) => {
              const open = faqOpen === i;
              return (
                <div key={i} className="border-t border-black/8 last:border-b">
                  <button
                    onClick={() => setFaqOpen(open ? null : i)}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left"
                  >
                    <span className="font-display text-lg font-medium tracking-tight md:text-xl">
                      {f.q}
                    </span>
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-black/10">
                      {open ? (
                        <Minus className="h-4 w-4" strokeWidth={STROKE} />
                      ) : (
                        <Plus className="h-4 w-4" strokeWidth={STROKE} />
                      )}
                    </span>
                  </button>
                  <div
                    className="grid overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                    style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-xl pb-6 text-ink-500">{f.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------- CTA FINAL ---------------- */}
      <section id="contacto" className="px-5 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div data-reveal className="reveal relative overflow-hidden rounded-[2.5rem] bg-ink-900 px-7 py-20 text-center md:px-16 md:py-28">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(50% 60% at 50% 0%, rgba(79,70,229,0.35), transparent 70%)",
              }}
            />
            <div className="relative">
              <p className="mb-6 font-mono text-xs uppercase tracking-[0.22em] text-ink-300">
                ¿Tienes un proceso que te quita horas?
              </p>
              <h2
                className="mx-auto max-w-3xl font-display font-semibold leading-[1.02] tracking-tight text-ink-50"
                style={{ fontSize: "clamp(2.4rem, 5vw, 4.5rem)" }}
              >
                Conversemos qué automatizar primero.
              </h2>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="mailto:hola@tamp.cl"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink-50 py-4 pl-7 pr-2.5 font-medium text-ink-900 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] sm:w-auto"
                >
                  Agenda una llamada
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-ink-900/10 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <ArrowUpRight className="h-4 w-4" strokeWidth={STROKE} />
                  </span>
                </a>
                <a
                  href="mailto:hola@tamp.cl"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 py-4 px-7 font-medium text-ink-100 transition-colors duration-300 hover:bg-white/10 sm:w-auto"
                >
                  hola@tamp.cl
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="px-5 pb-12 pt-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 border-t border-black/8 pt-8 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink-900 text-ink-50">
              <Zap className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">TAMP</span>
          </div>
          <p className="flex items-center gap-2 text-sm text-ink-400">
            <Check className="h-4 w-4 text-accent" strokeWidth={STROKE} />
            Desarrollo y automatización web · Chile
          </p>
          <p className="text-sm text-ink-400">© {new Date().getFullYear()} TAMP</p>
        </div>
      </footer>
    </main>
  );
}

/* ---------------- Subcomponentes del visual del hero ---------------- */
function FlowNode({ label, small = false }: { label: string; small?: boolean }) {
  return (
    <div
      className={`rounded-xl border border-black/8 bg-white font-mono text-ink-600 ${
        small ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"
      }`}
    >
      {label}
    </div>
  );
}

function FlowLine() {
  return (
    <div className="relative h-px flex-1 bg-ink-200">
      <span className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-accent" />
    </div>
  );
}
