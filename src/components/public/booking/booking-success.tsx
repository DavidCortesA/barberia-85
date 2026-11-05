import { CheckCircle2 } from "lucide-react";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { Button } from "@/components/ui/button";
import { formatDateLong, formatDateSentence } from "@/features/appointments/format";
import { formatDuration, formatPrice, formatTime12 } from "@/lib/format";
import type { BookingCopy, BookingService } from "./types";

type BookingSuccessProps = {
  copy: BookingCopy;
  service: BookingService;
  date: string;
  time: string;
  fullName: string;
  /** WhatsApp del negocio (10 dígitos) o null si aún no está configurado. */
  whatsapp: string | null;
  onReset: () => void;
};

export function BookingSuccess({ copy, service, date, time, fullName, whatsapp, onReset }: BookingSuccessProps) {
  const message = `Hola, soy ${fullName}. Acabo de solicitar una cita en 85 BARBERÍA (${service.name}) para el ${formatDateSentence(date)} a las ${formatTime12(time)}. ¿Me ayudan a confirmarla? Gracias.`;

  return (
    <div className="border-border bg-ink-900 mx-auto max-w-xl rounded-[4px] border p-8 text-center sm:p-12">
      <CheckCircle2 className="text-st-confirmed mx-auto size-14" aria-hidden />
      <h2 className="font-display mt-6 text-5xl font-bold" tabIndex={-1} data-autofocus>
        {copy.successTitle}
      </h2>
      <p className="text-muted-foreground mt-4 text-pretty">{copy.successMessage}</p>

      <dl className="border-border bg-ink-950 mt-8 divide-y divide-[color:var(--border)] rounded-[3px] border text-left text-sm">
        {[
          ["Servicio", `${service.name} · ${formatDuration(service.durationMinutes)}`],
          ["Día", formatDateLong(date)],
          ["Hora", formatTime12(time)],
          ["Total", formatPrice(service.price)],
          ["Estado", "Pendiente de confirmación"],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-foreground text-right font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        {whatsapp && <WhatsAppButton phone={whatsapp} message={message} label="Escribir por WhatsApp" variant="default" />}
        <Button variant="outline" onClick={onReset}>
          Hacer otra reserva
        </Button>
      </div>
    </div>
  );
}
