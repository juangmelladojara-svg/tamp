// ---------------------------------------------------------------------------
// Diagnóstico TAMP — analizador.
//
// Descarga la web del prospecto y corre chequeos simples, explicados para el
// dueño de un negocio (no para un programador). La nota final es el
// porcentaje de puntos obtenidos sobre los puntos posibles.
// ---------------------------------------------------------------------------

import { descargar, descargarOpcional, ErrorDiagnostico, type Respuesta } from "./fetch-seguro";
import {
  CATEGORIAS,
  type CategoriaId,
  type Chequeo,
  type Estado,
  type ResultadoDiagnostico,
} from "./tipos";

const BOTS_IA = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "PerplexityBot", "Google-Extended"];

// ---------------------------------------------------------------- utilidades

export function normalizarUrl(entrada: string): string {
  let texto = entrada.trim();
  if (!texto) throw new ErrorDiagnostico("Escribe la dirección de tu sitio web.");
  if (!/^https?:\/\//i.test(texto)) texto = `https://${texto}`;
  try {
    const url = new URL(texto);
    if (!url.hostname.includes(".")) throw new Error();
    return url.toString();
  } catch {
    throw new ErrorDiagnostico("Esa dirección no parece válida. Ejemplo: miempresa.cl");
  }
}

function decodificar(texto: string): string {
  return texto
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/** Lee el valor de un atributo dentro de una etiqueta HTML. */
function atributo(etiqueta: string, nombre: string): string | null {
  const m = etiqueta.match(new RegExp(`\\s${nombre}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? decodificar(m[1] ?? m[2] ?? m[3] ?? "") : null;
}

function etiquetas(html: string, nombre: string): string[] {
  return html.match(new RegExp(`<${nombre}\\b[^>]*>`, "gi")) ?? [];
}

function meta(html: string, clave: string): string | null {
  for (const tag of etiquetas(html, "meta")) {
    const n = (atributo(tag, "name") ?? atributo(tag, "property") ?? "").toLowerCase();
    if (n === clave.toLowerCase()) return atributo(tag, "content");
  }
  return null;
}

function textoVisible(html: string): string {
  return decodificar(
    html
      .replace(/<head[\s\S]*?<\/head>/gi, " ")
      .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
  );
}

function tiposJsonLd(html: string): { tipos: string[]; bloques: number; invalidos: number } {
  const bloques = html.match(/<script[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  const tipos: string[] = [];
  let invalidos = 0;
  const recorrer = (nodo: unknown) => {
    if (Array.isArray(nodo)) return nodo.forEach(recorrer);
    if (!nodo || typeof nodo !== "object") return;
    const obj = nodo as Record<string, unknown>;
    const t = obj["@type"];
    if (typeof t === "string") tipos.push(t);
    if (Array.isArray(t)) t.forEach((x) => typeof x === "string" && tipos.push(x));
    if (obj["@graph"]) recorrer(obj["@graph"]);
  };
  for (const b of bloques) {
    const contenido = b.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "");
    try {
      recorrer(JSON.parse(contenido));
    } catch {
      invalidos++;
    }
  }
  return { tipos, bloques: bloques.length, invalidos };
}

/** ¿El robots.txt bloquea a este bot de todo el sitio? */
function bloqueado(robots: string, bot: string): boolean {
  const grupos: { agentes: string[]; reglas: [string, string][] }[] = [];
  let actual: (typeof grupos)[number] | null = null;
  for (const lineaCruda of robots.split(/\r?\n/)) {
    const linea = lineaCruda.replace(/#.*/, "").trim();
    const m = linea.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const [, campo, valor] = m;
    const c = campo.toLowerCase();
    if (c === "user-agent") {
      if (!actual || actual.reglas.length) {
        actual = { agentes: [], reglas: [] };
        grupos.push(actual);
      }
      actual.agentes.push(valor.trim().toLowerCase());
    } else if ((c === "allow" || c === "disallow") && actual) {
      actual.reglas.push([c, valor.trim()]);
    }
  }
  const propio = grupos.find((g) => g.agentes.includes(bot.toLowerCase()));
  const grupo = propio ?? grupos.find((g) => g.agentes.includes("*"));
  if (!grupo) return false;
  const bloqueaTodo = grupo.reglas.some(([c, v]) => c === "disallow" && v === "/");
  const permiteRaiz = grupo.reglas.some(([c, v]) => c === "allow" && (v === "/" || v === "/$"));
  return bloqueaTodo && !permiteRaiz;
}

function chequeo(
  c: Omit<Chequeo, "estado" | "puntos"> & { puntos: number }
): Chequeo {
  const estado: Estado = c.puntos >= c.max ? "ok" : c.puntos > 0 ? "mejorable" : "falta";
  return { ...c, estado };
}

// ------------------------------------------------- velocidad (Google PSI)

async function velocidadGoogle(url: string): Promise<number | null> {
  const params = new URLSearchParams({ url, strategy: "mobile", category: "performance" });
  if (process.env.PAGESPEED_API_KEY) params.set("key", process.env.PAGESPEED_API_KEY);
  try {
    const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`, {
      signal: AbortSignal.timeout(25000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    const score = json?.lighthouseResult?.categories?.performance?.score;
    return typeof score === "number" ? score : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- análisis

export async function analizar(entrada: string): Promise<ResultadoDiagnostico> {
  const url = normalizarUrl(entrada);
  const pagina = await descargar(url);

  if (pagina.status >= 400) {
    throw new ErrorDiagnostico(`El sitio respondió con un error (${pagina.status}). Revisa que la dirección sea la correcta.`);
  }
  const tipo = pagina.headers.get("content-type") ?? "";
  if (tipo && !tipo.includes("html")) {
    throw new ErrorDiagnostico("Esa dirección no es una página web (no devuelve HTML).");
  }

  const final = new URL(pagina.urlFinal);
  const origen = final.origin;
  const versionHttp = `http://${final.host}${final.pathname}`;

  // Lo que no depende de la página se pide en paralelo.
  const [robotsRes, sitemapRes, llmsRes, httpRes, psi] = await Promise.all([
    descargarOpcional(`${origen}/robots.txt`),
    descargarOpcional(`${origen}/sitemap.xml`),
    descargarOpcional(`${origen}/llms.txt`),
    final.protocol === "https:" ? descargarOpcional(versionHttp) : Promise.resolve(null),
    velocidadGoogle(pagina.urlFinal),
  ]);

  const html = pagina.cuerpo;
  const existe = (r: Respuesta | null, patron?: RegExp) =>
    !!r && r.status === 200 && (!patron || patron.test(r.cuerpo));

  const chequeos: Chequeo[] = [];
  const omitidos: string[] = [];

  // ---------------- IA / AEO
  const ld = tiposJsonLd(html);
  chequeos.push(
    chequeo({
      id: "jsonld",
      categoria: "ia",
      titulo: "Ficha del negocio para máquinas",
      max: 8,
      puntos: ld.tipos.length ? 8 : ld.bloques ? 3 : 0,
      detalle: ld.tipos.length
        ? `Encontramos datos estructurados (${[...new Set(ld.tipos)].slice(0, 4).join(", ")}).`
        : ld.bloques
          ? "Hay datos estructurados, pero tienen errores y no se pueden leer."
          : "Tu web no tiene datos estructurados (schema.org).",
      porQue:
        "Es una 'ficha técnica' invisible que le dice a Google y a la IA quién eres, qué vendes, dónde estás y cómo contactarte. Sin ella, tienen que adivinar.",
      comoArreglar: "Agregar JSON-LD de schema.org con los datos reales del negocio.",
    })
  );

  const esNegocio = ld.tipos.some((t) =>
    /business|organization|store|service|restaurant|clinic|dentist|physician|office|agency|shop|corporation|hotel|school/i.test(t)
  );
  chequeos.push(
    chequeo({
      id: "entidad",
      categoria: "ia",
      titulo: "Identidad del negocio declarada",
      max: 5,
      puntos: esNegocio ? 5 : 0,
      detalle: esNegocio
        ? "La web declara qué tipo de negocio es."
        : "La web no declara qué tipo de negocio es (empresa, tienda, consulta, etc.).",
      porQue:
        "Cuando alguien le pregunta a ChatGPT \"¿quién hace X en mi ciudad?\", la IA prefiere recomendar negocios que se identifican con claridad.",
      comoArreglar: "Declarar el negocio como LocalBusiness u Organization con nombre, dirección, teléfono y horario.",
    })
  );

  const tieneFaq = ld.tipos.includes("FAQPage");
  const pareceFaq = /preguntas frecuentes|faq/i.test(textoVisible(html));
  chequeos.push(
    chequeo({
      id: "faq",
      categoria: "ia",
      titulo: "Preguntas frecuentes que la IA pueda citar",
      max: 6,
      puntos: tieneFaq ? 6 : pareceFaq ? 3 : 0,
      detalle: tieneFaq
        ? "Tienes preguntas frecuentes marcadas para la IA."
        : pareceFaq
          ? "Tienes preguntas frecuentes, pero no están marcadas para que la IA las reconozca."
          : "No encontramos una sección de preguntas frecuentes.",
      porQue:
        "Los asistentes de IA responden preguntas. Si tu web ya tiene la pregunta y la respuesta, es mucho más probable que te citen textualmente.",
      comoArreglar: "Crear 6 a 8 preguntas reales de tus clientes con respuestas cortas, y marcarlas como FAQPage.",
    })
  );

  if (robotsRes && robotsRes.status === 200) {
    const bloqueados = BOTS_IA.filter((b) => bloqueado(robotsRes.cuerpo, b));
    chequeos.push(
      chequeo({
        id: "bots-ia",
        categoria: "ia",
        titulo: "Puertas abiertas a los buscadores de IA",
        max: 8,
        puntos: bloqueados.length === 0 ? 8 : bloqueados.length < BOTS_IA.length ? 3 : 0,
        detalle: bloqueados.length
          ? `Tu web le cierra la puerta a: ${bloqueados.join(", ")}.`
          : "Tu web deja entrar a los lectores de ChatGPT, Claude, Perplexity y Google.",
        porQue: "Si la IA no puede entrar a leer tu web, nunca te va a recomendar.",
        comoArreglar: "Ajustar el archivo robots.txt para permitir a los buscadores de IA.",
      })
    );
  } else {
    chequeos.push(
      chequeo({
        id: "bots-ia",
        categoria: "ia",
        titulo: "Puertas abiertas a los buscadores de IA",
        max: 8,
        puntos: 6,
        detalle: "No tienes robots.txt: los buscadores entran, pero sin indicaciones.",
        porQue: "El robots.txt le dice a cada buscador qué puede leer. Sin él no hay bloqueo, pero tampoco control.",
        comoArreglar: "Crear un robots.txt que permita explícitamente a los buscadores de IA y apunte al sitemap.",
      })
    );
  }

  const palabras = textoVisible(html).split(" ").filter((p) => p.length > 1).length;
  chequeos.push(
    chequeo({
      id: "texto-servidor",
      categoria: "ia",
      titulo: "Contenido legible sin abrir un navegador",
      max: 8,
      puntos: palabras >= 250 ? 8 : palabras >= 80 ? 4 : 0,
      detalle:
        palabras >= 250
          ? `Tu página entrega ${palabras} palabras de contenido de inmediato.`
          : palabras >= 80
            ? `Tu página entrega poco texto de inmediato (${palabras} palabras).`
            : `Tu página casi no entrega texto (${palabras} palabras): el contenido aparece solo después de cargar.`,
      porQue:
        "Los lectores de IA no 'abren' la web como una persona: leen lo que llega primero. Si tu contenido aparece después, para ellos la página está vacía.",
      comoArreglar: "Generar el contenido en el servidor (Next.js, HTML real) y explicar en texto qué haces, para quién y dónde.",
    })
  );

  const tieneLlms = existe(llmsRes) && !/<html/i.test(llmsRes!.cuerpo);
  chequeos.push(
    chequeo({
      id: "llms",
      categoria: "ia",
      titulo: "Resumen para asistentes de IA (llms.txt)",
      max: 3,
      puntos: tieneLlms ? 3 : 0,
      detalle: tieneLlms ? "Tienes un llms.txt publicado." : "No tienes llms.txt.",
      porQue:
        "Es un resumen de tu negocio en texto simple, pensado para que los asistentes de IA lo lean rápido. Es nuevo y muy pocos lo tienen: es una ventaja.",
      comoArreglar: "Publicar /llms.txt con quién eres, qué ofreces y cómo contactarte.",
    })
  );

  // ---------------- SEO
  const titulo = decodificar(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  chequeos.push(
    chequeo({
      id: "title",
      categoria: "seo",
      titulo: "Título de la página",
      max: 6,
      puntos: !titulo ? 0 : titulo.length >= 15 && titulo.length <= 70 ? 6 : 3,
      detalle: !titulo
        ? "Tu página no tiene título."
        : `"${titulo.slice(0, 80)}${titulo.length > 80 ? "…" : ""}" (${titulo.length} caracteres).`,
      porQue: "Es la línea azul que aparece en Google. Debe decir qué haces y dónde, en menos de 70 caracteres.",
      comoArreglar: "Usar un título tipo «Qué haces + ciudad | Marca», de 15 a 70 caracteres.",
    })
  );

  const descripcion = meta(html, "description") ?? "";
  chequeos.push(
    chequeo({
      id: "description",
      categoria: "seo",
      titulo: "Descripción para Google",
      max: 6,
      puntos: !descripcion ? 0 : descripcion.length >= 50 && descripcion.length <= 170 ? 6 : 3,
      detalle: !descripcion
        ? "No tienes descripción: Google inventa una con cualquier texto de la página."
        : `Tienes descripción (${descripcion.length} caracteres).`,
      porQue: "Es el texto gris bajo el título en Google. Una buena descripción hace que la gente haga clic en ti y no en la competencia.",
      comoArreglar: "Escribir una descripción de 50 a 170 caracteres con tu propuesta de valor.",
    })
  );

  const h1s = (html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi) ?? []).length;
  chequeos.push(
    chequeo({
      id: "h1",
      categoria: "seo",
      titulo: "Titular principal",
      max: 5,
      puntos: h1s === 1 ? 5 : h1s > 1 ? 3 : 0,
      detalle: h1s === 1 ? "Tienes un titular principal claro." : h1s > 1 ? `Tienes ${h1s} titulares principales (lo ideal es 1).` : "Tu página no tiene titular principal (H1).",
      porQue: "Google usa el titular principal para entender de qué trata la página.",
      comoArreglar: "Dejar un solo H1 que diga lo que haces.",
    })
  );

  const og = !!meta(html, "og:title") && !!meta(html, "og:image");
  chequeos.push(
    chequeo({
      id: "og",
      categoria: "seo",
      titulo: "Vista previa al compartir",
      max: 4,
      puntos: og ? 4 : meta(html, "og:title") ? 2 : 0,
      detalle: og ? "Tu web se ve bien al compartirla por WhatsApp o redes." : "Al compartir tu web por WhatsApp o redes, sale sin imagen o sin título.",
      porQue: "Gran parte de tus clientes llega por un link compartido. Una vista previa con imagen genera mucha más confianza.",
      comoArreglar: "Agregar etiquetas Open Graph (título, descripción e imagen).",
    })
  );

  const tieneSitemap = existe(sitemapRes, /<(urlset|sitemapindex)/i) ||
    (!!robotsRes && /^\s*sitemap\s*:/im.test(robotsRes.cuerpo));
  chequeos.push(
    chequeo({
      id: "sitemap",
      categoria: "seo",
      titulo: "Mapa del sitio",
      max: 4,
      puntos: tieneSitemap ? 4 : 0,
      detalle: tieneSitemap ? "Tienes un mapa del sitio." : "No encontramos un mapa del sitio (sitemap.xml).",
      porQue: "Es la lista de páginas que le entregas a Google para que no se le escape ninguna.",
      comoArreglar: "Publicar /sitemap.xml y registrarlo en Google Search Console.",
    })
  );

  const canonical = etiquetas(html, "link").some((t) => (atributo(t, "rel") ?? "").toLowerCase() === "canonical");
  chequeos.push(
    chequeo({
      id: "canonical",
      categoria: "seo",
      titulo: "Dirección oficial de la página",
      max: 3,
      puntos: canonical ? 3 : 0,
      detalle: canonical ? "La página declara su dirección oficial." : "La página no declara su dirección oficial (canonical).",
      porQue: "Evita que Google vea tu web como contenido duplicado (con y sin www, con y sin https).",
      comoArreglar: "Agregar la etiqueta canonical en cada página.",
    })
  );

  const imgs = etiquetas(html, "img");
  if (imgs.length) {
    // alt="" es válido (imagen decorativa); lo que falta es el atributo.
    const conAlt = imgs.filter((t) => atributo(t, "alt") !== null).length;
    const pct = Math.round((conAlt / imgs.length) * 100);
    chequeos.push(
      chequeo({
        id: "alt",
        categoria: "seo",
        titulo: "Imágenes descritas",
        max: 4,
        puntos: pct >= 90 ? 4 : pct >= 50 ? 2 : 0,
        detalle: `${pct}% de tus imágenes tienen descripción (${conAlt} de ${imgs.length}).`,
        porQue: "Google y los lectores de pantalla no ven imágenes: leen su descripción. Sin ella, tus fotos no suman.",
        comoArreglar: "Agregar un texto alternativo (alt) que describa cada imagen.",
      })
    );
  }

  // ---------------- Celular
  const viewport = meta(html, "viewport") ?? "";
  chequeos.push(
    chequeo({
      id: "viewport",
      categoria: "movil",
      titulo: "Adaptada a celular",
      max: 10,
      puntos: /width\s*=\s*device-width/i.test(viewport) ? 10 : 0,
      detalle: /width\s*=\s*device-width/i.test(viewport)
        ? "Tu web está configurada para adaptarse a la pantalla del celular."
        : "Tu web no está configurada para celular: probablemente se ve en miniatura.",
      porQue: "En Chile la mayoría de las visitas llegan desde el teléfono. Google además prioriza las webs adaptadas.",
      comoArreglar: "Agregar la etiqueta viewport y un diseño responsive.",
    })
  );

  const tieneContacto = /href\s*=\s*["']?(tel:|https?:\/\/(wa\.me|api\.whatsapp\.com))/i.test(html);
  chequeos.push(
    chequeo({
      id: "contacto",
      categoria: "movil",
      titulo: "Contacto en un toque",
      max: 5,
      puntos: tieneContacto ? 5 : 0,
      detalle: tieneContacto ? "Desde el celular se puede llamar o escribir por WhatsApp con un toque." : "No encontramos un botón para llamar o abrir WhatsApp directo.",
      porQue: "Cada paso extra para contactarte es un cliente que se pierde. En el celular, el botón de WhatsApp es el que más vende.",
      comoArreglar: "Agregar botones con enlace tel: y wa.me visibles.",
    })
  );

  const lang = atributo(html.match(/<html\b[^>]*>/i)?.[0] ?? "", "lang");
  chequeos.push(
    chequeo({
      id: "lang",
      categoria: "movil",
      titulo: "Idioma declarado",
      max: 3,
      puntos: lang ? 3 : 0,
      detalle: lang ? `Idioma declarado: ${lang}.` : "La página no declara en qué idioma está.",
      porQue: "Evita que el celular ofrezca 'traducir' tu web y ayuda a que te muestren a gente que busca en español.",
      comoArreglar: "Agregar lang=\"es-CL\" a la etiqueta html.",
    })
  );

  // ---------------- Técnico
  const https = final.protocol === "https:";
  chequeos.push(
    chequeo({
      id: "https",
      categoria: "tecnico",
      titulo: "Conexión segura (candado)",
      max: 10,
      puntos: https ? 10 : 0,
      detalle: https ? "Tu web usa conexión segura (https)." : "Tu web no usa conexión segura: el navegador la marca como \"No seguro\".",
      porQue: "Un aviso de \"No seguro\" espanta clientes y Google te baja en los resultados.",
      comoArreglar: "Activar un certificado SSL (gratis en la mayoría de los hosting modernos).",
    })
  );

  if (https && httpRes) {
    const redirige = httpRes.urlFinal.startsWith("https://");
    chequeos.push(
      chequeo({
        id: "http-redirect",
        categoria: "tecnico",
        titulo: "Redirección a la versión segura",
        max: 4,
        puntos: redirige ? 4 : 0,
        detalle: redirige ? "Quien entra por http llega a la versión segura." : "Quien entra por http se queda en la versión no segura.",
        porQue: "Hay links viejos y gente que escribe la dirección a mano: todos deben terminar en la versión con candado.",
        comoArreglar: "Redirigir todo el tráfico http a https.",
      })
    );
  }

  const ms = pagina.msRespuesta;
  chequeos.push(
    chequeo({
      id: "respuesta",
      categoria: "tecnico",
      titulo: "Tiempo de respuesta del servidor",
      max: 6,
      puntos: ms < 800 ? 6 : ms < 2000 ? 3 : 0,
      detalle: `Tu servidor tardó ${(ms / 1000).toFixed(2)} s en responder.`,
      porQue: "Antes de mostrar cualquier cosa, el servidor tiene que responder. Si tarda, la gente se va antes de ver tu web.",
      comoArreglar: "Usar un hosting moderno con CDN (Vercel, Cloudflare) o una web estática.",
    })
  );

  if (psi !== null) {
    const pts = Math.round(psi * 10);
    chequeos.push(
      chequeo({
        id: "velocidad",
        categoria: "tecnico",
        titulo: "Velocidad en celular (medición de Google)",
        max: 10,
        puntos: psi >= 0.9 ? 10 : pts,
        detalle: `Google le pone ${Math.round(psi * 100)}/100 de velocidad en celular.`,
        porQue: "Más de la mitad de las personas abandona una web que tarda más de 3 segundos en cargar en el teléfono.",
        comoArreglar: "Optimizar imágenes, quitar scripts innecesarios y usar una plataforma rápida.",
      })
    );
  } else {
    omitidos.push("Velocidad en celular (Google no respondió a tiempo)");
  }

  // ---------------- notas
  const total = (cs: Chequeo[]) => {
    const max = cs.reduce((a, c) => a + c.max, 0);
    return max ? Math.round((cs.reduce((a, c) => a + c.puntos, 0) / max) * 100) : 0;
  };
  const porCategoria = Object.fromEntries(
    (Object.keys(CATEGORIAS) as CategoriaId[]).map((id) => [id, total(chequeos.filter((c) => c.categoria === id))])
  ) as Record<CategoriaId, number>;

  return {
    url,
    urlFinal: pagina.urlFinal,
    nota: total(chequeos),
    porCategoria,
    chequeos,
    omitidos,
    analizadoEn: new Date().toISOString(),
  };
}
