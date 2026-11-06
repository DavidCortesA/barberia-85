import Link from "next/link";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Appear } from "@/components/shared/appear";
import { Reveal } from "@/components/shared/reveal";
import { buttonVariants } from "@/components/ui/button";
import { getActiveServices } from "@/features/services/queries";
import { cn } from "@/lib/utils";
import { ServiceCard } from "./service-card";

/** Lista de servicios activos desde Supabase, con estados vacío y de error. */
/** `headingLevel`: 3 bajo el h2 de la portada; 2 en /servicios, donde el título es h1. */
export async function ServicesGrid({ headingLevel = 3 }: { headingLevel?: 2 | 3 } = {}) {
  let services;
  try {
    services = await getActiveServices();
  } catch (err) {
    console.error("[services]", err);
    return (
      <ErrorState
        title="No pudimos cargar los servicios"
        description="Inténtalo de nuevo en unos minutos o escríbenos para reservar."
        action={
          <Link href="/contacto" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Ver contacto
          </Link>
        }
      />
    );
  }

  if (services.length === 0) {
    return (
      <EmptyState
        title="Pronto publicaremos nuestros servicios"
        description="Mientras tanto, contáctanos y con gusto te atendemos."
        action={
          <Link href="/contacto" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Ver contacto
          </Link>
        }
      />
    );
  }

  // En /servicios las tarjetas están arriba del pliegue: entrada con CSS (no retrasa el LCP).
  const Entrance = headingLevel === 2 ? Appear : Reveal;
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service, i) => (
        <li key={service.id}>
          <Entrance delay={Math.min(i, 5) * 0.06} className="h-full">
            <ServiceCard service={service} headingLevel={headingLevel} />
          </Entrance>
        </li>
      ))}
    </ul>
  );
}
