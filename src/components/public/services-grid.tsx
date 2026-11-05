import Link from "next/link";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Reveal } from "@/components/shared/reveal";
import { buttonVariants } from "@/components/ui/button";
import { getActiveServices } from "@/features/services/queries";
import { cn } from "@/lib/utils";
import { ServiceCard } from "./service-card";

/** Lista de servicios activos desde Supabase, con estados vacío y de error. */
export async function ServicesGrid() {
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

  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service, i) => (
        <li key={service.id}>
          <Reveal delay={Math.min(i, 5) * 0.06} className="h-full">
            <ServiceCard service={service} />
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
