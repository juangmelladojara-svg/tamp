import { ImageResponse } from "next/og";
import { NEGOCIO } from "@/lib/site";
import { fuentesOutfit } from "@/lib/og-fonts";

// Imagen para compartir (Open Graph / Twitter). Estática: se genera en el build.
export const alt = `${NEGOCIO.nombre} — ${NEGOCIO.eslogan} Desarrollo web y automatización.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TINTA = "#0b0b0c";
const ROJO = "#e2231a";
const FONDO = "#f6f5f2";
const GRIS = "#5f5c52";
const ACENTO = "#4f46e5";

const LINEA = "Desarrollo web y automatización";

export default async function Image() {
  const fonts = await fuentesOutfit(`TAMP${NEGOCIO.eslogan}${LINEA}`, [600, 800]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 88px",
          backgroundColor: FONDO,
          backgroundImage:
            "radial-gradient(60% 55% at 50% -10%, rgba(79,70,229,0.10), transparent 70%), radial-gradient(40% 45% at 95% 15%, rgba(11,11,12,0.05), transparent 70%)",
          fontFamily: "Outfit",
          color: TINTA,
        }}
      >
        {/* Logotipo TA/MP */}
        <div style={{ display: "flex", fontSize: 72, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>
          <span style={{ color: TINTA }}>TA</span>
          {/* Satori no aplica el kerning entre spans y deja un hueco entre "TA" y
              "MP" que en la web no existe; el margen negativo lo compensa. */}
          <span style={{ color: ROJO, marginLeft: -9 }}>MP</span>
        </div>

        {/* Eslogan */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 92,
            fontWeight: 600,
            letterSpacing: -3,
            lineHeight: 1.02,
          }}
        >
          <span>Más que una web,</span>
          <span>una herramienta.</span>
        </div>

        {/* Línea de servicio */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 34, fontWeight: 600, color: GRIS }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, backgroundColor: ACENTO }} />
          {LINEA}
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
