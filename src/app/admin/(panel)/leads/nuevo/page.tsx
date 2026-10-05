import { crearLead } from "../../acciones";
import { Encabezado, Tarjeta } from "../../../_ui/ui";
import BotonEnviar from "../../../_ui/BotonEnviar";
import CamposLead from "../CamposLead";

export const metadata = { title: "Nuevo lead" };

export default function NuevoLead() {
  return (
    <>
      <Encabezado titulo="Nuevo lead" volver={{ href: "/leads", texto: "Leads" }} />
      <Tarjeta>
        <form action={crearLead} className="grid gap-6">
          <CamposLead />
          <div className="flex justify-end">
            <BotonEnviar>Crear lead</BotonEnviar>
          </div>
        </form>
      </Tarjeta>
    </>
  );
}
