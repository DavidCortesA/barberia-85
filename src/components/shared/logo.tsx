import Image from "next/image";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

type LogoProps = {
  /** Altura en px; el ancho se calcula con la proporción del logo (590×235). */
  height?: number;
  className?: string;
  priority?: boolean;
};

export function Logo({ height = 40, className, priority = false }: LogoProps) {
  return (
    <Image
      src="/brand/logo-85-barberia.png"
      alt={siteConfig.name}
      width={Math.round((height * 590) / 235)}
      height={height}
      priority={priority}
      className={cn("h-auto w-auto select-none", className)}
      style={{ height }}
    />
  );
}
