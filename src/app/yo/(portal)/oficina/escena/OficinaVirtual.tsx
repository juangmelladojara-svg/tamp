"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { FilaDV } from "@/lib/yo/dataview";
import { DIRECTOR, JEFE } from "@/lib/yo/equipo";
import { enrutar, responder } from "@/lib/yo/simulacion";
import type { CoordinadorEscena, OpcionesOficina } from "./tipos";
import "./oficina3d.css";

type Props = {
  notas: FilaDV[];
  hoy: string;
  coordinadores: CoordinadorEscena[];
  parte: string;
  sugerencias: string[];
  inicial: OpcionesOficina["inicial"];
  nombre: string;
};

// La escena es imperativa (Three.js): React solo pone el esqueleto y la monta
// una vez; el motor maneja la ficha, el canal y los KPIs dentro de este DOM.
export default function OficinaVirtual({ notas, hoy, coordinadores, parte, sugerencias, inicial, nombre }: Props) {
  const raiz = useRef<HTMLDivElement>(null);
  const router = useRouter();
  // Los datos llegan del servidor una vez; si cambian (router.refresh), basta con recargar la página.
  const datos = useRef({ notas, hoy, coordinadores, parte, sugerencias, inicial, nombre });

  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    let cancelado = false;
    let desmontar: (() => void) | null = null;
    const d = datos.current;
    const css = getComputedStyle(el);
    const fuente = (v: string, resp: string) => css.getPropertyValue(v).trim() || resp;

    import("./motor").then(({ montarOficina }) =>
      montarOficina(el, {
        coordinadores: d.coordinadores,
        jefe: JEFE,
        director: { ...DIRECTOR, nombre: d.nombre || DIRECTOR.nombre },
        marca: { titulo: `Oficina de ${d.nombre || DIRECTOR.nombre}`, subtitulo: "TAMP · proyectos · vida" },
        fuentes: { display: fuente("--font-outfit", "sans-serif"), sans: fuente("--font-geist-sans", "sans-serif") },
        parte: d.parte,
        sugerencias: d.sugerencias,
        inicial: d.inicial,
        enrutar: (texto) => enrutar(texto, d.notas),
        responder: (id, texto) => responder(id, texto, d.notas, d.hoy),
        navegar: (href) => router.push(href),
      }).then((fn) => {
        if (cancelado) fn();
        else desmontar = fn;
      }),
    );

    return () => {
      cancelado = true;
      desmontar?.();
    };
  }, [router]);

  return (
    <div ref={raiz} className="ofi3d">
      <section className="stage" data-o="stage" aria-label="Oficina virtual en 3D">
        <nav className="barra" aria-label="Oficina">
          <a href="/oficina/archivo" data-nav="/oficina/archivo">
            Archivo del vault
          </a>
          <button type="button" data-o="centrar">
            Centrar vista
          </button>
        </nav>
        <div className="hint">Arrastra para girar · rueda para acercar · clic en un coordinador</div>
        <div className="legend">
          <span>
            <i style={{ background: "#94A3B8" }} />
            Disponible
          </span>
          <span>
            <i style={{ background: "#2F6FEB" }} />
            Trabajando
          </span>
          <span>
            <i style={{ background: "#F59E0B" }} />
            Esperando aprobación
          </span>
          <span>
            <i style={{ background: "#22C55E" }} />
            Listo
          </span>
        </div>
        <div className="ficha" data-o="ficha" hidden />
        <div className="loading" data-o="loading">
          Preparando la oficina…
        </div>
      </section>

      <aside className="side">
        <div className="kpis">
          <div className="kpi">
            <span>Coordinadores activos</span>
            <b data-o="k-act">0</b>
          </div>
          <div className="kpi">
            <span>Encargos hoy</span>
            <b data-o="k-enc">0</b>
          </div>
          <div className="kpi">
            <span>Por aprobar</span>
            <b data-o="k-apr">0</b>
          </div>
          <div className="kpi">
            <span>Estado</span>
            <b data-o="k-est" className="ok">
              Operativa
            </b>
          </div>
        </div>
        <div className="chat">
          <div className="chat-h">
            <b>Canal de la oficina</b>
            <small>Respuestas simuladas con tus notas · nada se cambia en el vault sin tu aprobación</small>
          </div>
          <div className="log" data-o="log" aria-live="polite" />
          <div className="composer">
            <select data-o="dest" aria-label="Destinatario" />
            <div className="row">
              <input data-o="txt" placeholder="Escribe un encargo…" autoComplete="off" aria-label="Encargo" />
              <button type="button" className="btn" data-o="send">
                Enviar
              </button>
            </div>
            <div className="chips" data-o="chips" />
          </div>
        </div>
      </aside>
    </div>
  );
}
