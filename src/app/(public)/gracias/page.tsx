import type { Metadata } from "next";
import Link from "next/link";
import { RevealIcon } from "@/components/brand/reveal-icon";
import { Appear } from "@/components/shared/appear";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { buttonVariants } from "@/components/ui/button";
import { formatDateLong, formatDateSentence } from "@/features/appointments/format";
import { timeSchema, ymdSchema } from "@/features/appointments/schemas";
import { getSiteContent } from "@/features/content/queries";
import { getActiveServices } from "@/features/services/queries";
import { getBusinessSettings } from "@/features/settings/queries";
import { formatDuration, formatPrice, formatTime12 } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "¡Gracias por tu solicitud!",
  description: "Recibimos tu solicitud de cita en 85 BARBERÍA. Te confirmaremos por WhatsApp.",
  robots: { index: false, follow: false },
};

/** Lee la cita desde la URL (solo servicio, fecha y hora; sin datos personales). */
async function readBooking(params: Record<string, string | string[] | undefined>) {
  const one = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : "");
  const date = ymdSchema.safeParse(one("fecha"));
  const time = timeSchema.safeParse(one("hora"));
  if (!date.success || !time.success) return null;
  try {
    const service = (await getActiveServices()).find((s) => s.id === one("servicio"));
    return service ? { service, date: date.data, time: time.data } : null;
  } catch {
    return null;
  }
}

export default async function ThanksPage(props: PageProps<"/gracias">) {
  const [content, settings, booking] = await Promise.all([
    getSiteContent(),
    getBusinessSettings(),
    props.searchParams.then(readBooking),
  ]);

  const message = booking
    ? `Hola, acabo de solicitar una cita en 85 BARBERÍA (${booking.service.name}) para el ${formatDateSentence(booking.date)} a las ${formatTime12(booking.time)}. ¿Me ayudan a confirmarla? Gracias.`
    : "Hola, acabo de solicitar una cita en 85 BARBERÍA. ¿Me ayudan a confirmarla? Gracias.";

  return (
    <div className="mx-auto grid min-h-[80svh] max-w-[1100px] items-center gap-14 px-5 pt-36 pb-24 lg:grid-cols-[1fr_400px]">
      <div>
        <RevealIcon name="silla" className="text-primary size-20" />
        <Appear>
          <h1 className="font-display mt-8 text-[clamp(3.25rem,9vw,7rem)] leading-[0.9] font-bold">
            {content["booking.success_title"]}
          </h1>
        </Appear>
        <Appear delay={0.1}>
          <p className="text-muted-foreground mt-6 max-w-[44ch] text-lg text-pretty">{content["booking.success_message"]}</p>
        </Appear>
        <Appear delay={0.2}>
          <div className="mt-9 flex flex-wrap gap-3">
            {settings.whatsapp && (
              <WhatsAppButton phone={settings.whatsapp} message={message} label="Escribir por WhatsApp" variant="default" size="lg" />
            )}
            <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              Volver al inicio
            </Link>
          </div>
        </Appear>
      </div>

      {booking && (
        <Appear delay={0.15}>
          <section aria-labelledby="resumen" className="border-border bg-ink-900 rounded-[4px] border p-6 sm:p-8">
            <h2 id="resumen" className="label-brand">
              Tu solicitud
            </h2>
            <dl className="mt-6 space-y-4 text-sm">
              {[
                ["Servicio", `${booking.service.name} · ${formatDuration(booking.service.duration_minutes)}`],
                ["Día", formatDateLong(booking.date)],
                ["Hora", formatTime12(booking.time)],
                ["Total", formatPrice(Number(booking.service.price))],
                ["Estado", "Pendiente de confirmación"],
              ].map(([label, value]) => (
                <div key={label} className="border-border flex justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </Appear>
      )}
    </div>
  );
}
