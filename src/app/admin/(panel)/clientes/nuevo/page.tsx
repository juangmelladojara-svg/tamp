import { crearCliente } from "../../acciones";
import { Encabezado, Tarjeta } from "../../../_ui/ui";
import BotonEnviar from "../../../_ui/BotonEnviar";
import CamposCliente from "../CamposCliente";

export const metadata = { title: "Nuevo cliente" };

export default function NuevoCliente() {
  return (
    <>
      <Encabezado titulo="Nuevo cliente" volver={{ href: "/clientes", texto: "Clientes" }} />
      <Tarjeta>
        <form action={crearCliente} className="grid gap-6">
          <CamposCliente />
          <div className="flex justify-end">
            <BotonEnviar>Crear cliente</BotonEnviar>
          </div>
        </form>
      </Tarjeta>
    </>
  );
}
