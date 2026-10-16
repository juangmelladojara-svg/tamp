import { sesionPortal } from "@/lib/yo/sesion";
import { fechaHoy } from "@/lib/yo/fecha";
import { cargarVault } from "@/lib/yo/oficina";
import { COORDINADORES } from "@/lib/yo/equipo";
import { notasDe, parteDelDia, responder, sugerencias } from "@/lib/yo/simulacion";
import { hrefNota, hrefSala } from "@/lib/yo/vault";
import type { FilaDV } from "@/lib/yo/dataview";
import Galaxia from "../../Galaxia";
import OficinaVirtual from "./escena/OficinaVirtual";
import type { CoordinadorEscena } from "./escena/tipos";

export const metadata = { title: "Oficina virtual" };

// Oficina virtual 3D: el Jefe de Gabinete reparte tus encargos entre un
// coordinador por tema. Por ahora responden en modo simulado, armando cada
// borrador con las notas reales del vault (ver src/lib/yo/simulacion.ts).
export default async function Oficina() {
  const [{ perfil, email }, filas] = await Promise.all([sesionPortal(), cargarVault()]);
  const hoy = fechaHoy();
  const notas: FilaDV[] = filas.map(({ ruta, titulo, carpeta, meta, etiquetas, tareas, modificado }) => ({ ruta, titulo, carpeta, meta, etiquetas, tareas, modificado }));

  const coordinadores: CoordinadorEscena[] = COORDINADORES.map((c) => {
    const area = notasDe(c, notas);
    const carpetas = [...new Set(area.map((n) => n.carpeta))].sort();
    const destacadas = [...area]
      .sort((a, b) => b.tareas.length - a.tareas.length || (b.modificado ?? "").localeCompare(a.modificado ?? ""))
      .slice(0, 4)
      .map((n) => ({ titulo: n.titulo, href: hrefNota(n.ruta) }));
    return {
      ...c,
      stats: {
        notas: area.length,
        tareas: area.reduce((s, n) => s + n.tareas.length, 0),
        carpetas: carpetas.map((x) => x.replace(/^\d+\s*-\s*/, "")),
        destacadas,
        sala: carpetas[0] ? hrefSala(carpetas[0]) : null,
      },
    };
  });

  // Si hay pagos con la fecha pasada, Finanzas los deja listos para revisar al entrar.
  const vencidos = notas.some(
    (n) => n.meta.tipo === "prestamo" && n.meta.estado === "activo" && typeof n.meta.proximo_pago === "string" && n.meta.proximo_pago < hoy,
  );
  const inicial = vencidos
    ? { id: "finanzas" as const, texto: "Revisa mis pagos pendientes", respuesta: responder("finanzas", "pagos pendientes", notas, hoy) }
    : null;

  return (
    <>
      <Galaxia nodos={[]} />
      <OficinaVirtual
        notas={notas}
        hoy={hoy}
        coordinadores={coordinadores}
        parte={parteDelDia(notas, hoy)}
        sugerencias={sugerencias(notas)}
        inicial={inicial}
        nombre={(perfil?.nombre ?? email ?? "").split(" ")[0]}
      />
    </>
  );
}
