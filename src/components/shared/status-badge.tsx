import { Ban, CalendarCheck, CheckCircle2, Clock, Hourglass, XCircle, type LucideIcon } from "lucide-react";
import { statusColors, statusLabels, type DisplayStatus } from "@/features/appointments/status";
import { cn } from "@/lib/utils";

const icons: Record<DisplayStatus, LucideIcon> = {
  pending: Clock,
  confirmed: CalendarCheck,
  rejected: XCircle,
  cancelled: Ban,
  completed: CheckCircle2,
  expired: Hourglass,
  overdue: Hourglass,
};

/** Estado de una cita: siempre color + icono + texto (nunca solo color). */
export function StatusBadge({ status, className }: { status: DisplayStatus; className?: string }) {
  const Icon = icons[status];
  const color = statusColors[status];
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold whitespace-nowrap",
        className,
      )}
      style={{
        color: status === "expired" || status === "overdue" ? "#a1a1aa" : color,
        borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
      }}
    >
      <Icon className="size-3.5" aria-hidden />
      {statusLabels[status]}
    </span>
  );
}
