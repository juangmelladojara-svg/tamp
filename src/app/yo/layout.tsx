import type { Metadata } from "next";

// Portal personal en yo.tamp.cl (ver src/proxy.ts). Privado: no se indexa.
export const metadata: Metadata = {
  title: { default: "Portal", template: "%s · Portal" },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  alternates: { canonical: null },
  openGraph: null,
  twitter: null,
};

export default function YoLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-[#05060f] text-slate-200">{children}</div>;
}
