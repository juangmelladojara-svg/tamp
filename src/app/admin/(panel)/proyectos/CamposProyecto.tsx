import type { Fila } from "@/lib/supabase/tipos-db";
import { ESTADOS_PROYECTO, TIPOS_PROYECTO } from "@/lib/admin/formato";
import { AreaTexto, Campo, Selector } from "../../_ui/ui";

export default function CamposProyecto({ proyecto, compacto = false }: { proyecto?: Partial<Fila<"proyectos">>; compacto?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Campo nombre="nombre" etiqueta="Nombre del proyecto *" required defaultValue={proyecto?.nombre ?? ""} maxLength={160} className="sm:col-span-2" />
      <Selector nombre="tipo" etiqueta="Tipo" opciones={TIPOS_PROYECTO} defaultValue={proyecto?.tipo ?? "web"} />
      <Selector nombre="estado" etiqueta="Estado" opciones={ESTADOS_PROYECTO} defaultValue={proyecto?.estado ?? "propuesta"} />
      <Campo nombre="monto" etiqueta="Monto (CLP)" inputMode="numeric" defaultValue={proyecto?.monto ?? ""} placeholder="1400000" />
      <Campo nombre="entrega" etiqueta="Entrega" type="date" defaultValue={proyecto?.entrega ?? ""} />
      {!compacto && (
        <>
          <Campo nombre="inicio" etiqueta="Inicio" type="date" defaultValue={proyecto?.inicio ?? ""} />
          <Campo nombre="url_produccion" etiqueta="URL en producción" defaultValue={proyecto?.url_produccion ?? ""} maxLength={300} placeholder="https://" />
          <Campo nombre="repositorio" etiqueta="Repositorio" defaultValue={proyecto?.repositorio ?? ""} maxLength={300} placeholder="https://github.com/…" className="sm:col-span-2" />
          <AreaTexto nombre="notas" etiqueta="Notas" defaultValue={proyecto?.notas ?? ""} maxLength={5000} className="sm:col-span-2" />
        </>
      )}
    </div>
  );
}
