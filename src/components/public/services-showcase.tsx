import Link from "next/link";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { buttonVariants } from "@/components/ui/button";
import { getActiveServices } from "@/features/services/queries";
import { cn } from "@/lib/utils";
import { ServicesRows } from "./services-rows";

/** Servicios activos desde Supabase en formato lista editorial, con estados vacío y de error. */
export async function ServicesShowcase({ headingLevel = 3 }: { headingLevel?: 2 | 3 }) {
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
        description="Mientras tanto, escríbenos para agendar."
        action={
          <Link href="/contacto" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Ver contacto
          </Link>
        }
      />
    );
  }

  return (
    <ServicesRows
      headingLevel={headingLevel}
      services={services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        price: Number(s.price),
        durationMinutes: s.duration_minutes,
        imageUrl: s.image_url,
      }))}
    />
  );
}
