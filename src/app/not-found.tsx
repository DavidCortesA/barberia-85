import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-start justify-center gap-6 px-6">
      <p className="label-brand">Error 404</p>
      <h1 className="font-display text-7xl font-bold sm:text-8xl">Página no encontrada</h1>
      <p className="text-muted-foreground">La página que buscas no existe o cambió de lugar.</p>
      <div className="flex gap-3">
        <Link href="/" className={cn(buttonVariants())}>
          Ir al inicio
        </Link>
        <Link href="/reservar" className={cn(buttonVariants({ variant: "outline" }))}>
          Reservar cita
        </Link>
      </div>
    </main>
  );
}
