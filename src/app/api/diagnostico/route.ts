import { NextResponse } from "next/server";
import { analizar } from "@/lib/diagnostico/analizar";
import { ErrorDiagnostico } from "@/lib/diagnostico/fetch-seguro";
import { guardarDiagnostico } from "@/lib/diagnostico/guardar";
import { crearLimitador, ipDe } from "@/lib/limite";

// Descarga sitios de terceros: necesita Node (dns) y algo de tiempo para la
// medición de velocidad de Google.
export const runtime = "nodejs";
export const maxDuration = 60;

const excedeLimite = crearLimitador(10 * 60 * 1000, 20);

export async function POST(req: Request) {
  const ip = ipDe(req);
  if (excedeLimite(ip)) {
    return NextResponse.json(
      { error: "Hiciste varios diagnósticos seguidos. Espera unos minutos y vuelve a intentarlo." },
      { status: 429 }
    );
  }

  let url: unknown;
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  if (typeof url !== "string" || url.length > 300) {
    return NextResponse.json({ error: "Escribe la dirección de tu sitio web." }, { status: 400 });
  }

  try {
    const resultado = await analizar(url);
    // Se guarda para el panel; si no se puede, el visitante igual recibe su informe.
    const id = await guardarDiagnostico(resultado, ip, req.headers.get("user-agent"));
    return NextResponse.json({ ...resultado, id }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    if (e instanceof ErrorDiagnostico) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }
    console.error("[diagnostico]", e);
    return NextResponse.json(
      { error: "Algo falló al analizar el sitio. Inténtalo de nuevo en un momento." },
      { status: 500 }
    );
  }
}
