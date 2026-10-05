// ---------------------------------------------------------------------------
// Descarga de páginas de terceros con protección SSRF.
//
// El diagnóstico descarga la URL que escribe cualquier visitante. Sin estas
// barreras, alguien podría usar el servidor para leer direcciones internas
// (169.254.169.254, localhost, redes privadas). Por eso:
//   - solo http/https y puertos estándar,
//   - se resuelve el DNS y se rechaza cualquier IP privada o reservada,
//   - las redirecciones se siguen a mano y se revalida cada salto,
//   - tiempo y tamaño máximos.
// ---------------------------------------------------------------------------

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export class ErrorDiagnostico extends Error {}

const USER_AGENT =
  "Mozilla/5.0 (compatible; DiagnosticoTAMP/1.0; +https://tamp.cl/diagnostico)";

function ipv4Privada(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    (a === 169 && b === 254) || // link-local / metadata de nubes
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224 // multicast y reservadas
  );
}

function ipPrivada(ip: string): boolean {
  if (isIP(ip) === 4) return ipv4Privada(ip);
  const v6 = ip.toLowerCase();
  // IPv4 mapeada en IPv6 (::ffff:10.0.0.1)
  const mapeada = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapeada) return ipv4Privada(mapeada[1]);
  return (
    v6 === "::" ||
    v6 === "::1" ||
    v6.startsWith("fc") ||
    v6.startsWith("fd") || // únicas locales
    v6.startsWith("fe8") ||
    v6.startsWith("fe9") ||
    v6.startsWith("fea") ||
    v6.startsWith("feb") || // link-local
    v6.startsWith("ff") // multicast
  );
}

async function validarDestino(url: URL): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ErrorDiagnostico("Solo se pueden analizar direcciones http o https.");
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new ErrorDiagnostico("Esa dirección usa un puerto no permitido.");
  }
  if (url.username || url.password) {
    throw new ErrorDiagnostico("La dirección no puede incluir usuario o contraseña.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    throw new ErrorDiagnostico("Esa dirección no es un sitio público.");
  }
  let ips: string[];
  if (isIP(host)) {
    ips = [host];
  } else {
    try {
      ips = (await lookup(host, { all: true })).map((r) => r.address);
    } catch {
      throw new ErrorDiagnostico("No encontramos ese sitio. Revisa que la dirección esté bien escrita.");
    }
  }
  if (!ips.length || ips.some(ipPrivada)) {
    throw new ErrorDiagnostico("Esa dirección no es un sitio público.");
  }
}

export type Respuesta = {
  urlFinal: string;
  status: number;
  headers: Headers;
  cuerpo: string;
  /** Milisegundos hasta recibir la primera respuesta del servidor. */
  msRespuesta: number;
  saltos: string[];
};

export async function descargar(
  urlInicial: string,
  { timeoutMs = 10000, maxBytes = 3_000_000, maxSaltos = 5 } = {}
): Promise<Respuesta> {
  let url = new URL(urlInicial);
  const saltos: string[] = [];
  const control = new AbortController();
  const timer = setTimeout(() => control.abort(), timeoutMs);

  try {
    for (let i = 0; i <= maxSaltos; i++) {
      await validarDestino(url);
      const inicio = Date.now();
      const res = await fetch(url, {
        redirect: "manual",
        signal: control.signal,
        headers: { "user-agent": USER_AGENT, accept: "text/html,*/*;q=0.8" },
        cache: "no-store",
      });
      const msRespuesta = Date.now() - inicio;

      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        await res.body?.cancel();
        url = new URL(res.headers.get("location")!, url);
        saltos.push(url.toString());
        continue;
      }

      // Lectura con tope de tamaño.
      const lector = res.body?.getReader();
      const partes: Uint8Array[] = [];
      let total = 0;
      if (lector) {
        while (true) {
          const { done, value } = await lector.read();
          if (done) break;
          total += value.byteLength;
          if (total > maxBytes) {
            await lector.cancel();
            break;
          }
          partes.push(value);
        }
      }
      const cuerpo = new TextDecoder("utf-8", { fatal: false }).decode(
        Buffer.concat(partes.map((p) => Buffer.from(p)))
      );
      return { urlFinal: url.toString(), status: res.status, headers: res.headers, cuerpo, msRespuesta, saltos };
    }
    throw new ErrorDiagnostico("El sitio redirige demasiadas veces.");
  } catch (e) {
    if (e instanceof ErrorDiagnostico) throw e;
    if ((e as Error).name === "AbortError") {
      throw new ErrorDiagnostico("El sitio tardó demasiado en responder.");
    }
    throw new ErrorDiagnostico("No pudimos conectarnos con ese sitio.");
  } finally {
    clearTimeout(timer);
  }
}

/** Igual que descargar, pero nunca lanza: para archivos opcionales (robots.txt, sitemap…). */
export async function descargarOpcional(url: string): Promise<Respuesta | null> {
  try {
    return await descargar(url, { timeoutMs: 6000, maxBytes: 500_000 });
  } catch {
    return null;
  }
}
