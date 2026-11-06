import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Ícono para la pantalla de inicio de iOS: monograma "85" ámbar sobre negro. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#090909" }}>
        <svg width="132" height="132" viewBox="20 10 230 230">
          <g fill="none" stroke="#fca420" strokeWidth="16" strokeLinecap="round">
            <circle cx="92" cy="66" r="44" />
            <circle cx="92" cy="166" r="58" />
            <path d="M238 24 H168 V104 A62 62 0 1 1 152 212" />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
