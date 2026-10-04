import { ImageResponse } from "next/og";
import { fuentesOutfit } from "@/lib/og-fonts";

// Ícono de pantalla de inicio (iOS) 180×180: aquí sí cabe el logotipo completo.
// También se usa como `logo` en el JSON-LD del negocio.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const fonts = await fuentesOutfit("TAMP", [800]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f6f5f2",
          fontFamily: "Outfit",
          fontSize: 54,
          fontWeight: 800,
          letterSpacing: -1.5,
          lineHeight: 1,
        }}
      >
        <span style={{ color: "#0b0b0c" }}>TA</span>
        {/* Satori no aplica el kerning entre spans y deja un hueco entre "TA" y
            "MP" que en la web no existe; el margen negativo lo compensa. */}
        <span style={{ color: "#e2231a", marginLeft: -7 }}>MP</span>
      </div>
    ),
    { ...size, fonts }
  );
}
