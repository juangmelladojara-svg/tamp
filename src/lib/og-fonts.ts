/**
 * Carga Outfit (la tipografía display del sitio) para las imágenes generadas
 * con next/og (Open Graph, favicon, apple-icon).
 *
 * Las imágenes son estáticas: esto corre una sola vez, en el build. Si Google
 * Fonts no responde, devuelve null y la imagen se genera igual con la fuente
 * por defecto de next/og, en vez de romper el build.
 */
export async function cargarOutfit(peso: 600 | 800, texto: string): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Outfit:wght@${peso}&text=${encodeURIComponent(texto)}`;
    const css = await (await fetch(cssUrl, { signal: AbortSignal.timeout(8000) })).text();
    const fuente = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!fuente) return null;
    const res = await fetch(fuente, { signal: AbortSignal.timeout(8000) });
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

type FuenteOg = { name: string; data: ArrayBuffer; weight: 600 | 800; style: "normal" };

/** Arma la lista `fonts` de ImageResponse con los pesos que sí se pudieron cargar. */
export async function fuentesOutfit(texto: string, pesos: (600 | 800)[]): Promise<FuenteOg[]> {
  const cargadas = await Promise.all(pesos.map((p) => cargarOutfit(p, texto)));
  return cargadas.flatMap((data, i) =>
    data ? [{ name: "Outfit", data, weight: pesos[i], style: "normal" as const }] : []
  );
}
