import type { Fila } from "@/lib/supabase/tipos-db";
import { ESTADOS_CLIENTE } from "@/lib/admin/formato";
import { AreaTexto, Campo, Selector } from "../../_ui/ui";

export default function CamposCliente({ cliente }: { cliente?: Partial<Fila<"clientes">> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Campo nombre="nombre" etiqueta="Nombre del cliente *" required defaultValue={cliente?.nombre ?? ""} maxLength={160} />
      <Campo nombre="rubro" etiqueta="Rubro" defaultValue={cliente?.rubro ?? ""} maxLength={120} placeholder="Contabilidad, salud, retail…" />
      <Campo nombre="contacto_nombre" etiqueta="Persona de contacto" defaultValue={cliente?.contacto_nombre ?? ""} maxLength={120} />
      <Campo nombre="whatsapp" etiqueta="WhatsApp" defaultValue={cliente?.whatsapp ?? ""} maxLength={40} placeholder="+56 9 1234 5678" />
      <Campo nombre="email" etiqueta="Correo" type="email" defaultValue={cliente?.email ?? ""} maxLength={200} />
      <Campo nombre="sitio_web" etiqueta="Sitio web" defaultValue={cliente?.sitio_web ?? ""} maxLength={300} placeholder="https://" />
      <Selector nombre="estado" etiqueta="Estado" opciones={ESTADOS_CLIENTE} defaultValue={cliente?.estado ?? "activo"} />
      <Campo nombre="inicio" etiqueta="Cliente desde" type="date" defaultValue={cliente?.inicio ?? ""} />
      <label className="flex items-center gap-2.5 self-end pb-2.5 text-sm">
        <input type="checkbox" name="plan_mensual" defaultChecked={cliente?.plan_mensual ?? false} className="h-4 w-4 accent-ink-900" />
        Tiene plan mensual
      </label>
      <Campo
        nombre="monto_mensual"
        etiqueta="Monto mensual (CLP)"
        inputMode="numeric"
        defaultValue={cliente?.monto_mensual ?? ""}
        placeholder="150000"
      />
      <AreaTexto nombre="notas" etiqueta="Notas" defaultValue={cliente?.notas ?? ""} maxLength={5000} className="sm:col-span-2" />
    </div>
  );
}
