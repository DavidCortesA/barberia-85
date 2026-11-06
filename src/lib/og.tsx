import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

/** Barlow Condensed 700 para la imagen OG; si Google Fonts no responde se usa la fuente por defecto. */
async function loadDisplayFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700&text=${encodeURIComponent(text)}`,
    ).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

/**
 * Imagen Open Graph de marca (1200×630): la que se ve al compartir el enlace
 * por WhatsApp o redes. Una por página, con su propio título.
 */
export async function renderOgImage({ eyebrow, title, accent }: { eyebrow: string; title: string; accent?: string }) {
  // Subconjunto de glifos: el diseño muestra todo en mayúsculas.
  const text = `${eyebrow}${title}${accent ?? ""}85 BARBERÍA RESERVA EN LÍNEA`.toUpperCase();
  const font = await loadDisplayFont(text);
  const family = font ? "Barlow" : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#090909",
          color: "#f5f3ef",
          fontFamily: family,
          position: "relative",
          padding: "64px 72px",
        }}
      >
        {/* Franjas de poste de barbería en el borde derecho */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 64,
            display: "flex",
            backgroundImage: "repeating-linear-gradient(135deg, #fca420 0 22px, #090909 22px 44px)",
          }}
        />
        {/* "85" en contorno de fondo */}
        <svg width="520" height="520" viewBox="0 0 260 240" style={{ position: "absolute", right: 120, top: 70, opacity: 0.16 }}>
          <g fill="none" stroke="#f5f3ef" strokeWidth="5" strokeLinecap="round">
            <circle cx="92" cy="66" r="44" />
            <circle cx="92" cy="166" r="58" />
            <path d="M238 24 H168 V104 A62 62 0 1 1 152 212" />
          </g>
        </svg>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", fontSize: 28, letterSpacing: 6, color: "#fca420" }}>{eyebrow.toUpperCase()}</div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 128, lineHeight: 0.9 }}>
            <span>{title.toUpperCase()}</span>
            {accent && <span style={{ color: "#fca420" }}>{accent.toUpperCase()}</span>}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, letterSpacing: 4, color: "#a1a1aa" }}>
            <span style={{ color: "#f5f3ef" }}>85 BARBERÍA</span>
            <span style={{ marginRight: 80 }}>RESERVA EN LÍNEA</span>
          </div>
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: font ? [{ name: "Barlow", data: font, weight: 700, style: "normal" }] : undefined,
    },
  );
}
