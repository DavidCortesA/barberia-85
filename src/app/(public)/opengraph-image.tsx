import { ogSize, renderOgImage } from "@/lib/og";

export const alt = "85 BARBERÍA: el corte que te define. Reserva tu cita en línea.";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({ eyebrow: "Barbería", title: "El corte que", accent: "te define" });
}
