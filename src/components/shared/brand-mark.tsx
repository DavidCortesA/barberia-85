import { cn } from "@/lib/utils";

/**
 * "85" en contorno: eco del logo. Se usa como fondo decorativo cuando una
 * sección todavía no tiene fotografía cargada desde el panel.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "bg-ink-900 border-border relative grid h-full w-full place-items-center overflow-hidden border",
        className,
      )}
    >
      <span
        className="font-display text-[clamp(8rem,22vw,18rem)] leading-none font-bold text-transparent select-none"
        style={{ WebkitTextStroke: "2px rgb(245 243 239 / 0.55)" }}
      >
        85
      </span>
      <div className="from-ink-950/60 absolute inset-0 bg-gradient-to-t to-transparent" />
    </div>
  );
}
