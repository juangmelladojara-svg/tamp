import Galaxia from "../../Galaxia";

// Páginas interiores: el mismo cielo de la portada, sin nodos, y una columna de lectura.
export default function InteriorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Galaxia nodos={[]} />
      <main className="relative z-10 mx-auto max-w-3xl px-5 pb-20 pt-24">{children}</main>
    </>
  );
}
