import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Entrada con CSS puro para el contenido visible al cargar (hero, títulos h1).
 * A diferencia de `Reveal`, no espera a que hidrate el JavaScript: el texto se
 * pinta de inmediato y no retrasa el LCP. `prefers-reduced-motion` la anula
 * desde globals.css.
 */
export function Appear({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <div
      className={cn("animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-700 ease-out", className)}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
