import type { Metadata } from "next";

// El panel vive en admin.tamp.cl (ver src/proxy.ts). Hereda fuentes y estilos
// del layout raíz, pero no debe indexarse ni declarar la URL pública del sitio.
export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel TAMP" },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  alternates: { canonical: null },
  openGraph: null,
  twitter: null,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-ink-50 text-ink-900">{children}</div>;
}
