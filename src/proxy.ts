import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

// ---------------------------------------------------------------------------
// Proxy (ex-middleware) de Next.js.
//
// - tamp.cl: sitio público. /admin no existe acá (404).
// - yo.tamp.cl: portal personal de Juan (misma mecánica, prefijo /yo).
// - admin.tamp.cl: el panel. admin.tamp.cl/<ruta> se sirve desde /admin/<ruta>,
//   se refresca la sesión de Supabase y, sin sesión, todo redirige a /login.
//
// En desarrollo se entra por http://admin.localhost:<puerto>.
// Este control es la primera barrera; el layout del panel vuelve a verificar
// la sesión y la membresía, y RLS protege los datos en la base.
// ---------------------------------------------------------------------------

const RUTAS_SIN_SESION = new Set(["/login"]);

/** Subdominio → carpeta interna que lo sirve. */
function prefijoDeHost(host: string): "/admin" | "/yo" | null {
  if (host.startsWith("admin.")) return "/admin";
  if (host.startsWith("yo.")) return "/yo";
  return null;
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  const prefijo = prefijoDeHost(host);

  if (!prefijo) {
    const privada = ["/admin", "/yo"].some((p) => pathname === p || pathname.startsWith(`${p}/`));
    if (privada) return new NextResponse("No encontrado", { status: 404 });
    return NextResponse.next();
  }

  const destino = request.nextUrl.clone();
  destino.pathname = pathname === "/" ? prefijo : `${prefijo}${pathname}`;

  let respuesta = NextResponse.rewrite(destino, { request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        respuesta = NextResponse.rewrite(destino, { request });
        cookiesToSet.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([clave, valor]) => respuesta.headers.set(clave, valor));
      },
    },
  });

  // No meter código entre createServerClient y getClaims (recomendación de
  // Supabase): getClaims valida el JWT y refresca la sesión si venció.
  const { data } = await supabase.auth.getClaims();
  const conSesion = Boolean(data?.claims?.sub);

  const redirigir = (ruta: string) => {
    const url = request.nextUrl.clone();
    url.pathname = ruta;
    url.search = "";
    const r = NextResponse.redirect(url);
    // Conserva cookies que Supabase haya actualizado (p. ej. limpiar una sesión vencida).
    respuesta.cookies.getAll().forEach((c) => r.cookies.set(c));
    return r;
  };

  if (!conSesion && !RUTAS_SIN_SESION.has(pathname)) return redirigir("/login");
  if (conSesion && pathname === "/login") return redirigir("/");

  respuesta.headers.set("x-robots-tag", "noindex, nofollow");
  return respuesta;
}

export const config = {
  matcher: [
    // Todo menos estáticos, la API pública y los archivos generados del sitio.
    "/((?!_next/static|_next/image|api/|favicon\\.ico|icon|apple-icon|opengraph-image|robots\\.txt|sitemap\\.xml|llms\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
