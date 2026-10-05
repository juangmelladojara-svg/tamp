import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Sitemap: la landing y la herramienta de diagnóstico.
 * Cuando se agreguen páginas (servicios, casos, blog), se suman acá.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/diagnostico`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
