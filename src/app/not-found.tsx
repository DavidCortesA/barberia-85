import type { Metadata } from "next";
import Link from "next/link";
import { BrandIcon } from "@/components/brand/brand-icon";
import { LogoMark } from "@/components/brand/logo-mark";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Página no encontrada",
  description: "La página que buscas no existe o cambió de lugar.",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-svh flex-col overflow-hidden px-5 py-8">
      <div aria-hidden="true" className="pole-stripes absolute top-0 right-0 -z-10 h-full w-3 opacity-60" />
      <Link href="/" aria-label="85 BARBERÍA, ir al inicio" className="w-fit">
        <LogoMark className="h-11 w-auto" />
      </Link>

      <div className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col justify-center py-16">
        {/* Las tijeras recorren la línea punteada y "cortan" el 404 */}
        <div aria-hidden="true" className="relative">
          <p className="font-display text-ink-800 text-[clamp(8rem,32vw,22rem)] leading-[0.8] font-bold select-none">
            4<span className="text-primary">0</span>4
          </p>
          <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-[color:var(--color-mute)] opacity-40" />
          <div className="cut-run absolute top-1/2 left-0 -translate-y-1/2">
            <BrandIcon name="tijeras" className="text-bone size-16 -rotate-90 sm:size-20" />
          </div>
        </div>

        <p className="label-brand mt-10">Error 404</p>
        <h1 className="font-display mt-3 text-[clamp(2.75rem,7vw,5.5rem)] font-bold">Este corte no existe</h1>
        <p className="text-muted-foreground mt-4 max-w-md text-pretty">
          La página que buscas no existe o cambió de lugar. Pero tu próximo corte sí te está esperando.
        </p>
        <nav aria-label="Sugerencias" className="mt-8 flex flex-wrap gap-3">
          <Link href="/reservar" className={cn(buttonVariants({ size: "lg" }))}>
            Reservar cita
          </Link>
          <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
            Ir al inicio
          </Link>
          <Link href="/servicios" className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}>
            Ver servicios
          </Link>
        </nav>
      </div>
    </main>
  );
}
