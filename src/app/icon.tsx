import { ImageResponse } from "next/og";
import { fuentesOutfit } from "@/lib/og-fonts";

// Favicon 32×32: la "T" del logotipo en tinta con un punto rojo de marca.
// A este tamaño "TAMP" completo no se lee; la T + el rojo sí.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const fonts = await fuentesOutfit("T", [800]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          backgroundColor: "#f6f5f2",
          borderRadius: 7,
          fontFamily: "Outfit",
        }}
      >
        <span style={{ fontSize: 28, fontWeight: 800, color: "#0b0b0c", lineHeight: 1, marginTop: -1, marginLeft: -3 }}>
          T
        </span>
        <div
          style={{
            position: "absolute",
            right: 5,
            bottom: 6,
            width: 7,
            height: 7,
            borderRadius: 2,
            backgroundColor: "#e2231a",
          }}
        />
      </div>
    ),
    { ...size, fonts }
  );
}
