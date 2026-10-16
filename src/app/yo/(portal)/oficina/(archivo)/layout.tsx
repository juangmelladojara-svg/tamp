import Galaxia from "../../../Galaxia";

// Archivo de la oficina (recepción del vault, salas y notas): el mismo cielo del
// portal, con una columna más ancha que las páginas interiores.
export default function ArchivoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Galaxia nodos={[]} />
      <main className="relative z-10 mx-auto max-w-6xl px-5 pb-20 pt-36 md:pt-24">{children}</main>
    </>
  );
}
