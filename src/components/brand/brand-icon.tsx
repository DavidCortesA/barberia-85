import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** Íconos de línea de la barbería (PNG con transparencia en public/icons). */
export const brandIconFiles = {
  calendario: "calendario",
  catalogo: "catalogar",
  espejo: "espejo",
  navaja: "navaja-de-afeitar",
  peine: "peine",
  mensaje: "peluquero",
  poste: "poste-de-barbero",
  silla: "silla-de-barbero",
  tijeras: "tijeras",
} as const;

export type BrandIconName = keyof typeof brandIconFiles;

type BrandIconProps = {
  name: BrandIconName;
  className?: string;
  /** Texto accesible; sin él el ícono es decorativo. */
  label?: string;
  style?: CSSProperties;
};

/**
 * Pinta el PNG como máscara: toma el color del texto (`currentColor`), así el
 * mismo ícono sirve en ámbar, crema o negro sin editar el archivo.
 */
export function BrandIcon({ name, className, label, style }: BrandIconProps) {
  const url = `url(/icons/${brandIconFiles[name]}.png)`;
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("inline-block shrink-0 bg-current", className)}
      style={{
        WebkitMaskImage: url,
        maskImage: url,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        ...style,
      }}
    />
  );
}
