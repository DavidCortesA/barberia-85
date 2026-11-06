import { cn } from "@/lib/utils";
import { LOGO_AMBER_PATH, LOGO_BONE_PATH, LOGO_VIEWBOX } from "./logo-paths";

type LogoMarkProps = {
  className?: string;
  /** Dibuja el contorno y luego rellena (pantalla de carga). Las clases viven en globals.css. */
  animated?: boolean;
  /** Texto accesible; vacío = decorativo (cuando el enlace que lo rodea ya lo nombra). */
  title?: string;
};

/** Logo vectorial de 85 BARBERÍA: escala sin pérdida y se puede animar. */
export function LogoMark({ className, animated = false, title = "85 BARBERÍA" }: LogoMarkProps) {
  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      role={title ? "img" : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      className={cn(animated && "logo-draw", className)}
    >
      <path className="lg-bone" d={LOGO_BONE_PATH} fill="#f5f3ef" fillRule="evenodd" pathLength={1} />
      <path className="lg-amber" d={LOGO_AMBER_PATH} fill="#fca420" fillRule="evenodd" pathLength={1} />
    </svg>
  );
}
