import type { Fila } from "@/lib/supabase/tipos-db";
import { ESTADOS_LEAD, ORIGENES_LEAD } from "@/lib/admin/formato";
import { AreaTexto, Campo, Selector } from "../../_ui/ui";

/** Campos del lead, compartidos por "nuevo" y la ficha de edición. */
export default function CamposLead({ lead }: { lead?: Partial<Fila<"leads">> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Campo nombre="nombre" etiqueta="Nombre" defaultValue={lead?.nombre ?? ""} maxLength={120} autoComplete="off" />
      <Campo nombre="empresa" etiqueta="Empresa" defaultValue={lead?.empresa ?? ""} maxLength={160} />
      <Campo
        nombre="whatsapp"
        etiqueta="WhatsApp"
        defaultValue={lead?.whatsapp ?? ""}
        maxLength={40}
        placeholder="+56 9 1234 5678"
        ayuda="WhatsApp o correo: al menos uno."
      />
      <Campo nombre="email" etiqueta="Correo" type="email" defaultValue={lead?.email ?? ""} maxLength={200} />
      <Campo nombre="sitio_web" etiqueta="Sitio web" defaultValue={lead?.sitio_web ?? ""} maxLength={300} placeholder="https://" />
      <Selector nombre="origen" etiqueta="Origen" opciones={ORIGENES_LEAD} defaultValue={lead?.origen ?? "manual"} />
      <Selector nombre="estado" etiqueta="Estado" opciones={ESTADOS_LEAD} defaultValue={lead?.estado ?? "nuevo"} />
      <Campo nombre="proximo_contacto" etiqueta="Próximo contacto" type="date" defaultValue={lead?.proximo_contacto ?? ""} />
      <AreaTexto nombre="mensaje" etiqueta="Qué necesita" defaultValue={lead?.mensaje ?? ""} maxLength={2000} rows={3} className="sm:col-span-2" />
      <AreaTexto nombre="notas" etiqueta="Notas internas" defaultValue={lead?.notas ?? ""} maxLength={5000} className="sm:col-span-2" />
    </div>
  );
}
