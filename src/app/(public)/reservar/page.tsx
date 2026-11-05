import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingWizard } from "@/components/public/booking/booking-wizard";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { SectionHeading } from "@/components/shared/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { getSiteContent } from "@/features/content/queries";
import { getScheduleWindow } from "@/features/schedule/queries";
import { getActiveServices } from "@/features/services/queries";
import { getBusinessSettings } from "@/features/settings/queries";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  return {
    title: content["booking.title"],
    description: content["booking.intro"],
    alternates: { canonical: "/reservar" },
  };
}

/** Datos del flujo; null si Supabase falla (se muestra un estado de error). */
async function loadBookingData() {
  try {
    const [services, window] = await Promise.all([getActiveServices(), getScheduleWindow()]);
    return { services, window };
  } catch (err) {
    console.error("[reservar]", err);
    return null;
  }
}

export default async function BookingPage() {
  const [content, settings, data] = await Promise.all([
    getSiteContent(),
    getBusinessSettings(),
    loadBookingData(),
  ]);

  return (
    <div className="mx-auto max-w-[1100px] px-5 pt-36 pb-24">
      <SectionHeading as="h1" title={content["booking.title"]} subtitle={content["booking.intro"]} />
      <div className="mt-10">
        {data === null ? (
          <ErrorState
            title="No pudimos cargar la reserva"
            description="Recarga la página en unos minutos. Si el problema continúa, contáctanos."
          />
        ) : data.services.length === 0 ? (
          <EmptyState
            title="Aún no hay servicios disponibles"
            description="Estamos preparando la reserva en línea. Vuelve pronto."
          />
        ) : (
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <BookingWizard
              services={data.services.map((s) => ({
                id: s.id,
                name: s.name,
                description: s.description,
                price: Number(s.price),
                durationMinutes: s.duration_minutes,
              }))}
              window={data.window}
              whatsapp={settings.whatsapp}
              copy={{
                pendingNotice: content["booking.pending_notice"],
                successTitle: content["booking.success_title"],
                successMessage: content["booking.success_message"],
              }}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
