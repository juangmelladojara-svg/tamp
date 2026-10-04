import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Fija la raíz de Turbopack a esta carpeta (evita el error "Next.js package
  // not found" cuando hay varios proyectos en el workspace).
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "picsum.photos" }],
  },
  // El favicon se genera en src/app/icon.tsx (/icon). Algunos navegadores y
  // bots piden /favicon.ico directo sin leer el <link rel="icon">: se sirve
  // el mismo PNG en esa ruta para que no den 404.
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon" }];
  },
};

export default nextConfig;
