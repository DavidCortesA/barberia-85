import { ogSize, renderOgImage } from "@/lib/og";

export const alt = "Servicios de 85 BARBERÍA: cortes y barba con precio y duración.";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({ eyebrow: "Servicios", title: "Cortes y", accent: "barba" });
}
