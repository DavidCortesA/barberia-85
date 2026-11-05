import { CalendarDays, Clock, Scissors } from "lucide-react";
import { formatDateLong } from "@/features/appointments/format";
import { formatDuration, formatPrice, formatTime12 } from "@/lib/format";
import type { BookingService } from "./types";

type BookingSummaryProps = {
  service: BookingService | null;
  date: string | null;
  time: string | null;
};

/** Resumen de la cita en construcción (columna lateral en escritorio). */
export function BookingSummary({ service, date, time }: BookingSummaryProps) {
  const rows = [
    {
      icon: <Scissors aria-hidden />,
      label: "Servicio",
      value: service ? `${service.name} · ${formatDuration(service.durationMinutes)}` : null,
    },
    { icon: <CalendarDays aria-hidden />, label: "Día", value: date ? formatDateLong(date) : null },
    { icon: <Clock aria-hidden />, label: "Hora", value: time ? formatTime12(time) : null },
  ];

  return (
    <aside aria-label="Resumen de tu cita" className="border-border bg-ink-900 rounded-[4px] border p-6">
      <p className="label-brand mb-5">Tu cita</p>
      <dl className="space-y-4">
        {rows.map((row) => (
          <div key={row.label} className="flex gap-3">
            <span className="text-muted-foreground mt-0.5 [&_svg]:size-4">{row.icon}</span>
            <div>
              <dt className="text-muted-foreground text-xs">{row.label}</dt>
              <dd className={row.value ? "text-foreground text-sm font-medium" : "text-muted-foreground text-sm"}>
                {row.value ?? "Por elegir"}
              </dd>
            </div>
          </div>
        ))}
      </dl>
      {service && (
        <div className="border-border mt-6 flex items-end justify-between border-t pt-5">
          <span className="text-muted-foreground text-sm">Total</span>
          <span className="font-display text-brand-300 text-3xl leading-none font-bold">{formatPrice(service.price)}</span>
        </div>
      )}
    </aside>
  );
}
