import { ogSize, renderOgImage } from "@/lib/og";

export const alt = "Reserva tu cita en 85 BARBERÍA en línea.";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({ eyebrow: "Reservaciones", title: "Reserva tu", accent: "cita" });
}
