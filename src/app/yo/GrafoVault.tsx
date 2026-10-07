"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Minus, Plus } from "lucide-react";

export type NotaVault = { ruta: string; titulo: string; carpeta: string; enlaces: string[] };

// Colores por carpeta, calcados del filtro de Obsidian.
const COLOR_NUM: Record<string, string> = {
  "00": "#d9e48c",
  "01": "#f4903a",
  "02": "#8fcbe0",
  "03": "#f09a9a",
  "04": "#8fe0cc",
  "05": "#8f94e8",
  "06": "#c58fe8",
  "07": "#7fd47f",
  "08": "#f0d08a",
  "09": "#a5e07f",
  "10": "#8fe0cc",
  "11": "#8fcbe0",
  "12": "#8f94e8",
  "13": "#f08fc6",
  "14": "#c58fe8",
  "99": "#ef8f8f",
};

export function colorCarpeta(c: string): string {
  const m = /^(\d\d) /.exec(c);
  if (m && COLOR_NUM[m[1]]) return COLOR_NUM[m[1]];
  if (c.includes("Plantillas")) return "#c6e07f";
  if (c.includes("Inbox")) return "#f0d08a";
  return "#8e95a3";
}

type Nodo = {
  i: number;
  ruta: string;
  titulo: string;
  carpeta: string;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  vecinos: number[];
  fijo: boolean;
};

type Estrella = { x: number; y: number; r: number; a: number; v: number };

/**
 * Grafo del vault de Obsidian: una nota = un nodo, un [[enlace]] = una arista.
 * Simulación de fuerzas propia (sin librerías), zoom con la rueda, arrastre del
 * fondo y de los nodos, y filtro por carpeta.
 */
export default function GrafoVault({ notas }: { notas: NotaVault[] }) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const ocultasRef = useRef<Set<string>>(new Set());
  const selRef = useRef<number | null>(null);
  const zoomRef = useRef<(f: number) => void>(() => {});
  const nodosRef = useRef<Nodo[]>([]);

  const [ocultas, setOcultas] = useState<Set<string>>(new Set());
  const [sel, setSel] = useState<number | null>(null);
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);
  const [panel, setPanel] = useState(true);

  const carpetas = useMemo(() => {
    const cuenta = new Map<string, number>();
    for (const n of notas) cuenta.set(n.carpeta, (cuenta.get(n.carpeta) ?? 0) + 1);
    return [...cuenta.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [notas]);

  const totalEnlaces = useMemo(() => notas.reduce((s, n) => s + n.enlaces.length, 0), [notas]);

  useEffect(() => {
    ocultasRef.current = ocultas;
  }, [ocultas]);
  useEffect(() => {
    selRef.current = sel;
  }, [sel]);

  useEffect(() => {
    const canvas = lienzo.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---- Datos del grafo ---------------------------------------------------
    const idx = new Map(notas.map((n, i) => [n.ruta, i]));
    const vecinos: Set<number>[] = notas.map(() => new Set());
    for (const [i, n] of notas.entries()) {
      for (const dest of n.enlaces) {
        const j = idx.get(dest);
        if (j !== undefined && j !== i) {
          vecinos[i].add(j);
          vecinos[j].add(i);
        }
      }
    }
    const aristas: [number, number][] = [];
    for (const [i, s] of vecinos.entries()) for (const j of s) if (i < j) aristas.push([i, j]);

    // Posición inicial: cada carpeta en su sector, para que el grafo arranque ordenado.
    const nombres = [...new Set(notas.map((n) => n.carpeta))];
    const nodos: Nodo[] = notas.map((n, i) => {
      const ang = (nombres.indexOf(n.carpeta) / nombres.length) * Math.PI * 2;
      const rad = 110 + Math.random() * 40;
      return {
        i,
        ruta: n.ruta,
        titulo: n.titulo,
        carpeta: n.carpeta,
        color: colorCarpeta(n.carpeta),
        x: Math.cos(ang) * rad + (Math.random() - 0.5) * 40,
        y: Math.sin(ang) * rad + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
        r: 4 + Math.sqrt(vecinos[i].size) * 2.6,
        vecinos: [...vecinos[i]],
        fijo: false,
      };
    });
    nodosRef.current = nodos;

    // ---- Vista -------------------------------------------------------------
    let ancho = 0;
    let alto = 0;
    const cam = { x: 0, y: 0, k: 1 };
    let estrellas: Estrella[] = [];
    let alpha = 1;
    let raf = 0;
    let hoverI: number | null = null;
    let arrastrando: Nodo | null = null;
    let paneando = false;
    let movido = 0;
    let ultimo = { x: 0, y: 0 };

    const ajustar = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ancho = canvas.clientWidth;
      alto = canvas.clientHeight;
      canvas.width = ancho * dpr;
      canvas.height = alto * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cam.x = ancho / 2;
      cam.y = alto / 2;
      estrellas = Array.from({ length: Math.round((ancho * alto) / 5000) }, () => ({
        x: Math.random() * ancho,
        y: Math.random() * alto,
        r: Math.random() * 1.2 + 0.2,
        a: Math.random() * Math.PI * 2,
        v: Math.random() * 0.02 + 0.004,
      }));
    };

    const visible = (n: Nodo) => !ocultasRef.current.has(n.carpeta);
    const aPantalla = (n: { x: number; y: number }) => ({ x: n.x * cam.k + cam.x, y: n.y * cam.k + cam.y });
    const aMundo = (px: number, py: number) => ({ x: (px - cam.x) / cam.k, y: (py - cam.y) / cam.k });

    const nodoEn = (px: number, py: number): Nodo | null => {
      const w = aMundo(px, py);
      let mejor: Nodo | null = null;
      let dMin = Infinity;
      for (const n of nodos) {
        if (!visible(n)) continue;
        const d = Math.hypot(n.x - w.x, n.y - w.y);
        if (d < n.r + 5 / cam.k && d < dMin) {
          mejor = n;
          dMin = d;
        }
      }
      return mejor;
    };

    // ---- Simulación de fuerzas --------------------------------------------
    const paso = () => {
      const vis = nodos.filter(visible);
      for (let a = 0; a < vis.length; a++) {
        const A = vis[a];
        for (let b = a + 1; b < vis.length; b++) {
          const B = vis[b];
          let dx = A.x - B.x;
          let dy = A.y - B.y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 1) {
            dx = Math.random() - 0.5;
            dy = Math.random() - 0.5;
            d2 = 1;
          }
          const f = (2000 * alpha) / d2;
          const d = Math.sqrt(d2);
          dx = (dx / d) * f;
          dy = (dy / d) * f;
          A.vx += dx;
          A.vy += dy;
          B.vx -= dx;
          B.vy -= dy;
        }
      }
      for (const [i, j] of aristas) {
        const A = nodos[i];
        const B = nodos[j];
        if (!visible(A) || !visible(B)) continue;
        const dx = B.x - A.x;
        const dy = B.y - A.y;
        const d = Math.hypot(dx, dy) || 1;
        const f = (d - 60) * 0.035 * alpha;
        A.vx += (dx / d) * f;
        A.vy += (dy / d) * f;
        B.vx -= (dx / d) * f;
        B.vy -= (dy / d) * f;
      }
      for (const n of vis) {
        n.vx -= n.x * 0.008 * alpha;
        n.vy -= n.y * 0.008 * alpha;
        if (n.fijo) {
          n.vx = n.vy = 0;
          continue;
        }
        n.vx *= 0.82;
        n.vy *= 0.82;
        n.x += n.vx;
        n.y += n.vy;
      }
    };

    // ---- Dibujo ------------------------------------------------------------
    const dibujar = () => {
      if (alpha > 0.012) {
        paso();
        alpha *= reducido ? 0.9 : 0.985;
      }
      ctx.clearRect(0, 0, ancho, alto);

      const manchas: [number, number, number, string][] = [
        [0.2, 0.25, 0.5, "rgba(99,102,241,0.16)"],
        [0.8, 0.7, 0.55, "rgba(168,85,247,0.13)"],
        [0.55, 0.45, 0.4, "rgba(14,165,233,0.07)"],
      ];
      for (const [mx, my, mr, color] of manchas) {
        const g = ctx.createRadialGradient(mx * ancho, my * alto, 0, mx * ancho, my * alto, mr * Math.max(ancho, alto));
        g.addColorStop(0, color);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, ancho, alto);
      }
      for (const e of estrellas) {
        e.a += e.v;
        ctx.fillStyle = `rgba(226,232,255,${0.4 + 0.4 * Math.sin(e.a)})`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();
      }

      const foco = hoverI ?? selRef.current;
      const vecFoco = foco !== null ? new Set([foco, ...nodos[foco].vecinos]) : null;

      // Aristas
      for (const [i, j] of aristas) {
        const A = nodos[i];
        const B = nodos[j];
        if (!visible(A) || !visible(B)) continue;
        const a = aPantalla(A);
        const b = aPantalla(B);
        const resalta = foco !== null && (i === foco || j === foco);
        ctx.strokeStyle = resalta ? "rgba(224,231,255,0.8)" : vecFoco ? "rgba(148,163,255,0.07)" : "rgba(148,163,255,0.2)";
        ctx.lineWidth = resalta ? 1.4 : 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // Nodos
      ctx.textAlign = "center";
      for (const n of nodos) {
        if (!visible(n)) continue;
        const p = aPantalla(n);
        const enFoco = !vecFoco || vecFoco.has(n.i);
        const r = n.r * cam.k * (n.i === foco ? 1.25 : 1);
        ctx.globalAlpha = enFoco ? 1 : 0.18;
        const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
        halo.addColorStop(0, n.color + "55");
        halo.addColorStop(1, n.color + "00");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        if (n.i === selRef.current) {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        const mostrar = n.i === foco || (vecFoco?.has(n.i) && foco !== null) || n.vecinos.length >= 10 || cam.k > 1.3;
        if (mostrar && enFoco) {
          ctx.font = `${n.i === foco ? 600 : 500} ${Math.max(10, 11 * Math.min(cam.k, 1.4))}px system-ui, sans-serif`;
          ctx.fillStyle = n.i === foco ? "#ffffff" : "rgba(226,232,255,0.85)";
          ctx.fillText(n.titulo, p.x, p.y + r + 14);
        }
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(dibujar);
    };

    // ---- Interacción -------------------------------------------------------
    const pos = (ev: PointerEvent | WheelEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: ev.clientX - r.left, y: ev.clientY - r.top };
    };

    const bajar = (ev: PointerEvent) => {
      const p = pos(ev);
      canvas.setPointerCapture(ev.pointerId);
      movido = 0;
      ultimo = p;
      const n = nodoEn(p.x, p.y);
      if (n) {
        arrastrando = n;
        n.fijo = true;
        alpha = Math.max(alpha, 0.3);
      } else paneando = true;
    };

    const mover = (ev: PointerEvent) => {
      const p = pos(ev);
      movido += Math.abs(p.x - ultimo.x) + Math.abs(p.y - ultimo.y);
      if (arrastrando) {
        const w = aMundo(p.x, p.y);
        arrastrando.x = w.x;
        arrastrando.y = w.y;
        alpha = Math.max(alpha, 0.2);
      } else if (paneando) {
        cam.x += p.x - ultimo.x;
        cam.y += p.y - ultimo.y;
      } else {
        const n = nodoEn(p.x, p.y);
        const nuevo = n ? n.i : null;
        if (nuevo !== hoverI) {
          hoverI = nuevo;
          canvas.style.cursor = n ? "pointer" : "grab";
          setHover(n ? { i: n.i, x: p.x, y: p.y } : null);
        }
      }
      ultimo = p;
    };

    const subir = (ev: PointerEvent) => {
      const p = pos(ev);
      if (arrastrando) {
        arrastrando.fijo = false;
        if (movido < 5) setSel(arrastrando.i === selRef.current ? null : arrastrando.i);
      } else if (paneando && movido < 5) {
        setSel(null);
      }
      arrastrando = null;
      paneando = false;
      canvas.releasePointerCapture(ev.pointerId);
      void p;
    };

    const rueda = (ev: WheelEvent) => {
      ev.preventDefault();
      const p = pos(ev);
      const f = Math.exp(-ev.deltaY * 0.0015);
      const k = Math.min(4, Math.max(0.3, cam.k * f));
      cam.x = p.x - (p.x - cam.x) * (k / cam.k);
      cam.y = p.y - (p.y - cam.y) * (k / cam.k);
      cam.k = k;
    };

    zoomRef.current = (f: number) => {
      const k = Math.min(4, Math.max(0.3, cam.k * f));
      cam.x = ancho / 2 - (ancho / 2 - cam.x) * (k / cam.k);
      cam.y = alto / 2 - (alto / 2 - cam.y) * (k / cam.k);
      cam.k = k;
    };

    const salir = () => {
      if (hoverI !== null) {
        hoverI = null;
        setHover(null);
      }
    };

    ajustar();
    canvas.style.cursor = "grab";
    raf = requestAnimationFrame(dibujar);
    window.addEventListener("resize", ajustar);
    canvas.addEventListener("pointerdown", bajar);
    canvas.addEventListener("pointermove", mover);
    canvas.addEventListener("pointerup", subir);
    canvas.addEventListener("pointerleave", salir);
    canvas.addEventListener("wheel", rueda, { passive: false });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", ajustar);
      canvas.removeEventListener("pointerdown", bajar);
      canvas.removeEventListener("pointermove", mover);
      canvas.removeEventListener("pointerup", subir);
      canvas.removeEventListener("pointerleave", salir);
      canvas.removeEventListener("wheel", rueda);
    };
  }, [notas]);

  const alternar = (c: string) =>
    setOcultas((prev) => {
      const s = new Set(prev);
      if (s.has(c)) s.delete(c);
      else s.add(c);
      return s;
    });

  const nodoSel = sel !== null ? nodosRef.current[sel] : null;
  const nodoHover = hover ? nodosRef.current[hover.i] : null;

  return (
    <>
      <canvas ref={lienzo} className="fixed inset-0 h-full w-full touch-none" aria-label="Grafo de notas del vault" />

      {/* Filtro por carpeta, como el de Obsidian */}
      <aside className="fixed left-4 top-20 z-20 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 bg-[#0b0d22]/75 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setPanel((p) => !p)}
          className="flex w-full items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200/80"
        >
          Filtro
          <ChevronDown className={`h-4 w-4 transition-transform ${panel ? "" : "-rotate-90"}`} strokeWidth={1.5} />
        </button>
        {panel && (
          <ul className="max-h-[60dvh] overflow-y-auto px-2 pb-3">
            {carpetas.map(([c, n]) => {
              const off = ocultas.has(c);
              return (
                <li key={c}>
                  <button
                    type="button"
                    onClick={() => alternar(c)}
                    className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-white/5 ${off ? "opacity-40" : ""}`}
                  >
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: colorCarpeta(c) }} />
                    <span className="min-w-0 flex-1 truncate text-slate-200">{c}</span>
                    <span className="text-xs text-slate-500">{n}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      <div className="fixed bottom-6 right-4 z-20 flex flex-col gap-2">
        {[
          { f: 1.25, icono: Plus, etiqueta: "Acercar" },
          { f: 0.8, icono: Minus, etiqueta: "Alejar" },
        ].map(({ f, icono: Icono, etiqueta }) => (
          <button
            key={etiqueta}
            type="button"
            aria-label={etiqueta}
            onClick={() => zoomRef.current(f)}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-[#0b0d22]/75 text-slate-200 backdrop-blur transition-colors hover:bg-white/10"
          >
            <Icono className="h-4 w-4" strokeWidth={1.5} />
          </button>
        ))}
      </div>

      <p className="pointer-events-none fixed bottom-6 left-4 z-20 text-xs text-slate-500">
        {notas.length} notas · {totalEnlaces} enlaces · arrastra, usa la rueda para acercar
      </p>

      {nodoHover && hover && !nodoSel && (
        <div
          className="pointer-events-none fixed z-30 rounded-xl border border-white/10 bg-[#0b0d22]/90 px-3 py-2 text-sm backdrop-blur"
          style={{ left: Math.min(hover.x + 16, (typeof window === "undefined" ? 800 : window.innerWidth) - 240), top: hover.y + 16 }}
        >
          <p className="font-medium text-white">{nodoHover.titulo}</p>
          <p className="text-xs text-slate-400">{nodoHover.carpeta}</p>
        </div>
      )}

      {nodoSel && (
        <div className="fixed bottom-6 left-1/2 z-30 w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#0b0d22]/90 p-4 backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ background: nodoSel.color }} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-white">{nodoSel.titulo}</p>
              <p className="text-xs text-slate-400">
                {nodoSel.carpeta} · {nodoSel.vecinos.length} {nodoSel.vecinos.length === 1 ? "conexión" : "conexiones"}
              </p>
            </div>
            <button type="button" onClick={() => setSel(null)} className="text-sm text-slate-400 hover:text-white">
              Cerrar
            </button>
          </div>
          {nodoSel.vecinos.length > 0 && (
            <div className="mt-3 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
              {nodoSel.vecinos.map((j) => {
                const v = nodosRef.current[j];
                return (
                  <button
                    key={j}
                    type="button"
                    onClick={() => setSel(j)}
                    className="flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:bg-white/10"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: v.color }} />
                    {v.titulo}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
