import "server-only";
import { createHash } from "node:crypto";

/** IP del visitante según el proxy de Vercel. */
export function ipDe(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

/** Huella de la IP para contar uso sin guardar la IP en claro. */
export function huellaIp(ip: string): string {
  return createHash("sha256").update(`tamp:${ip}`).digest("hex").slice(0, 32);
}

/**
 * Límite por clave en memoria. En serverless cada instancia tiene su propia
 * memoria, así que es un freno contra abuso casual, no una garantía.
 */
export function crearLimitador(ventanaMs: number, maximo: number) {
  const uso = new Map<string, number[]>();
  return function excede(clave: string): boolean {
    const ahora = Date.now();
    const recientes = (uso.get(clave) ?? []).filter((t) => ahora - t < ventanaMs);
    if (recientes.length >= maximo) {
      uso.set(clave, recientes);
      return true;
    }
    recientes.push(ahora);
    uso.set(clave, recientes);
    if (uso.size > 5000) uso.clear();
    return false;
  };
}
