"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type NodoGalaxia = {
  id: string;
  titulo: string;
  nota?: string;
  href?: string; // sin href = próximamente
  color: string;
  /** Posición base, 0–1 sobre el lienzo. */
  x: number;
  y: number;
  radio: number;
  enlaces?: string[];
};

type Estrella = { x: number; y: number; r: number; a: number; v: number };

/**
 * Fondo de galaxia (estrellas con parpadeo + polvo de nebulosa) y, encima, un
 * grafo de nodos que flotan suave, al estilo de la vista de grafo de Obsidian.
 */
export default function Galaxia({ nodos }: { nodos: NodoGalaxia[] }) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [activo, setActivo] = useState<NodoGalaxia | null>(null);
  const activoRef = useRef<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const canvas = lienzo.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let ancho = 0;
    let alto = 0;
    let estrellas: Estrella[] = [];
    let raf = 0;
    const mouse = { x: -1, y: -1 };
    const pos = new Map<string, { x: number; y: number }>();

    const ajustar = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ancho = canvas.clientWidth;
      alto = canvas.clientHeight;
      canvas.width = ancho * dpr;
      canvas.height = alto * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cantidad = Math.round((ancho * alto) / 5000);
      estrellas = Array.from({ length: cantidad }, () => ({
        x: Math.random() * ancho,
        y: Math.random() * alto,
        r: Math.random() * 1.2 + 0.2,
        a: Math.random() * Math.PI * 2,
        v: Math.random() * 0.02 + 0.004,
      }));
    };

    const dibujar = (t: number) => {
      ctx.clearRect(0, 0, ancho, alto);

      // Nebulosa: manchas de color muy tenues.
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
        const brillo = 0.45 + 0.45 * Math.sin(e.a);
        ctx.fillStyle = `rgba(226,232,255,${brillo})`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Posiciones de los nodos (flotan en órbitas pequeñas).
      let bajoMouse: string | null = null;
      for (const [i, n] of nodos.entries()) {
        const f = reducido ? 0 : t / 4000;
        const x = n.x * ancho + Math.sin(f + i * 1.7) * 9;
        const y = n.y * alto + Math.cos(f * 0.8 + i * 2.3) * 9;
        pos.set(n.id, { x, y });
        if (Math.hypot(mouse.x - x, mouse.y - y) < n.radio + 10) bajoMouse = n.id;
      }
      if (bajoMouse !== activoRef.current) {
        activoRef.current = bajoMouse;
        const nodo = nodos.find((n) => n.id === bajoMouse) ?? null;
        setActivo(nodo);
        canvas.style.cursor = nodo?.href ? "pointer" : "default";
      }

      // Enlaces.
      for (const n of nodos) {
        const a = pos.get(n.id);
        if (!a) continue;
        for (const dest of n.enlaces ?? []) {
          const b = pos.get(dest);
          if (!b) continue;
          const resalta = activoRef.current === n.id || activoRef.current === dest;
          ctx.strokeStyle = resalta ? "rgba(199,210,254,0.7)" : "rgba(148,163,255,0.22)";
          ctx.lineWidth = resalta ? 1.4 : 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // Nodos.
      for (const n of nodos) {
        const p = pos.get(n.id);
        if (!p) continue;
        const resalta = activoRef.current === n.id;
        const r = n.radio * (resalta ? 1.12 : 1);
        const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.2);
        halo.addColorStop(0, n.color + (resalta ? "88" : "55"));
        halo.addColorStop(1, n.color + "00");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 3.2, 0, Math.PI * 2);
        ctx.fill();

        const g = ctx.createRadialGradient(p.x - r * 0.3, p.y - r * 0.3, r * 0.1, p.x, p.y, r);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.35, n.color);
        g.addColorStop(1, n.color + "cc");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = "500 13px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = resalta ? "#ffffff" : "rgba(226,232,255,0.82)";
        ctx.fillText(n.titulo, p.x, p.y + r + 20);
      }

      if (!reducido) raf = requestAnimationFrame(dibujar);
    };

    const mover = (ev: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = ev.clientX - r.left;
      mouse.y = ev.clientY - r.top;
      if (reducido) dibujar(0);
    };
    const salir = () => {
      mouse.x = mouse.y = -1;
    };
    const clic = () => {
      const n = nodos.find((x) => x.id === activoRef.current);
      if (!n?.href) return;
      if (n.href.startsWith("http")) window.location.href = n.href;
      else router.push(n.href);
    };

    ajustar();
    dibujar(0);
    if (!reducido) raf = requestAnimationFrame(dibujar);
    window.addEventListener("resize", ajustar);
    canvas.addEventListener("pointermove", mover);
    canvas.addEventListener("pointerleave", salir);
    canvas.addEventListener("click", clic);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", ajustar);
      canvas.removeEventListener("pointermove", mover);
      canvas.removeEventListener("pointerleave", salir);
      canvas.removeEventListener("click", clic);
    };
  }, [nodos, router]);

  return (
    <>
      <canvas ref={lienzo} className="fixed inset-0 h-full w-full" aria-hidden />
      {activo && (
        <div className="pointer-events-none fixed bottom-8 left-1/2 z-20 -translate-x-1/2 rounded-2xl border border-white/10 bg-[#0b0d22]/80 px-5 py-3 text-center backdrop-blur-xl">
          <p className="font-medium text-white">{activo.titulo}</p>
          <p className="text-sm text-slate-400">
            {activo.nota}
            {activo.href ? "" : " · próximamente"}
          </p>
        </div>
      )}
    </>
  );
}
