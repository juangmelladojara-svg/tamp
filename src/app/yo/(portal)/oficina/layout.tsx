import Galaxia from "../../Galaxia";

// Oficina virtual: el mismo cielo del portal, con una columna más ancha que las
// páginas interiores (la recepción y las salas son grillas, no solo lectura).
export default function OficinaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Galaxia nodos={[]} />
      <main className="relative z-10 mx-auto max-w-6xl px-5 pb-20 pt-36 md:pt-24">{children}</main>
    </>
  );
}
