import { ogSize, renderOgImage } from "@/lib/og";

export const alt = "Ubicación, horarios y contacto de 85 BARBERÍA.";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({ eyebrow: "Contacto", title: "Visítanos en", accent: "85 barbería" });
}
