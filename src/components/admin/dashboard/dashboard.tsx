"use client";

import Link from "next/link";
import { useState } from "react";
import { Ban, CalendarCheck, CalendarDays, Clock } from "lucide-react";
import { Panel } from "@/components/admin/page-header";
import { AppointmentSheet } from "@/components/admin/appointments/appointment-sheet";
import { openWhatsApp, useAppointmentActions } from "@/components/admin/appointments/use-appointment-actions";
import { whatsappLinkFor } from "@/components/admin/appointments/whatsapp";
import { WhatsAppIcon } from "@/components/shared/social-icons";
import { EmptyState } from "@/components/shared/states";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import type { DayActivity } from "@/features/appointments/admin-queries";
import { allowedTransitions, displayStatus, statusColors, statusLabels } from "@/features/appointments/status";
import type { AppointmentView } from "@/features/appointments/view";
import { formatShop, shopLocalToUtc, shopTimeKey } from "@/lib/date";
import { formatTime12 } from "@/lib/format";
import { cn } from "@/lib/utils";

type DashboardData = {
  today: string;
  kpis: { today: number; pending: number; confirmed: number; cancelled: number };
  upcoming: AppointmentView[];
  week: DayActivity[];
};

export function Dashboard({ data }: { data: DashboardData }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const actions = useAppointmentActions();
  const selected = data.upcoming.find((a) => a.id === selectedId) ?? null;

  const kpis = [
    { label: "Citas de hoy", value: data.kpis.today, icon: CalendarDays, href: `/admin/appointments?fecha=${data.today}` },
    { label: "Pendientes", value: data.kpis.pending, icon: Clock, href: "/admin/appointments?estado=pending", accent: "var(--color-st-pending)" },
    { label: "Confirmadas próximas", value: data.kpis.confirmed, icon: CalendarCheck, href: "/admin/appointments?estado=confirmed", accent: "var(--color-st-confirmed)" },
    { label: "Canceladas (7 días)", value: data.kpis.cancelled, icon: Ban, href: "/admin/appointments?estado=cancelled&ver=all", accent: "var(--color-st-cancelled)" },
  ];

  return (
    <div className="space-y-6">
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <li key={k.label}>
            <Link
              href={k.href}
              className="border-border bg-ink-900 hover:border-primary/50 focus-visible:ring-ring block rounded-[4px] border p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <div className="text-muted-foreground flex items-center justify-between text-xs font-medium">
                {k.label}
                <k.icon className="size-4" style={k.accent ? { color: k.accent } : undefined} aria-hidden />
              </div>
              <p className="font-display mt-3 text-4xl font-bold tabular-nums">{k.value}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Panel
          title="Próximas citas"
          description="Pendientes y confirmadas, en orden."
          actions={
            <Link href="/admin/appointments" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Ver todas
            </Link>
          }
        >
          {data.upcoming.length === 0 ? (
            <EmptyState title="No hay citas próximas" description="Cuando lleguen solicitudes aparecerán aquí." className="py-10" />
          ) : (
            <ul className="divide-border -my-2 divide-y">
              {data.upcoming.map((a) => (
                <UpcomingRow key={a.id} appt={a} onOpen={() => setSelectedId(a.id)} onAction={actions.ask} busy={actions.busy} />
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Últimos 7 días" description="Citas por día (fecha de la cita).">
          <WeekStrip week={data.week} today={data.today} />
        </Panel>
      </div>

      <AppointmentSheet
        appointment={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelectedId(null)}
        onAction={actions.ask}
        busy={actions.busy}
      />
      {actions.dialogs}
    </div>
  );
}

function UpcomingRow({
  appt,
  onOpen,
  onAction,
  busy,
}: {
  appt: AppointmentView;
  onOpen: () => void;
  onAction: ReturnType<typeof useAppointmentActions>["ask"];
  busy: boolean;
}) {
  const transitions = allowedTransitions(appt.status, appt.startsAt);
  const wa = whatsappLinkFor(appt);
  return (
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
      <button type="button" onClick={onOpen} className="group flex min-w-0 flex-1 items-center gap-4 text-left">
        <div className="w-24 shrink-0 text-center">
          <p className="text-muted-foreground text-[0.7rem] uppercase">{formatShop(appt.startsAt, "EEE d")}</p>
          <p className="font-semibold whitespace-nowrap tabular-nums">{formatTime12(shopTimeKey(appt.startsAt))}</p>
        </div>
        <div className="min-w-0">
          <p className="group-hover:text-brand-300 truncate font-medium">{appt.customerName}</p>
          <p className="text-muted-foreground truncate text-sm">{appt.serviceName}</p>
        </div>
      </button>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <StatusBadge status={displayStatus(appt.status, appt.startsAt)} />
        {transitions.includes("confirmed") && (
          <Button size="xs" onClick={() => onAction(appt, "confirmed")} disabled={busy}>
            Confirmar
          </Button>
        )}
        {transitions.includes("rejected") && (
          <Button size="xs" variant="destructive" onClick={() => onAction(appt, "rejected")} disabled={busy}>
            Rechazar
          </Button>
        )}
        {wa && (
          <Button size="icon-xs" variant="outline" onClick={() => openWhatsApp(wa)} aria-label={`WhatsApp a ${appt.customerName}`}>
            <WhatsAppIcon className="size-3.5" aria-hidden />
          </Button>
        )}
      </div>
    </li>
  );
}

const STRIP_ORDER = ["completed", "confirmed", "pending", "cancelled", "rejected", "expired"] as const;

function WeekStrip({ week, today }: { week: DayActivity[]; today: string }) {
  const max = Math.max(1, ...week.map((d) => d.total));
  const total = week.reduce((n, d) => n + d.total, 0);
  return (
    <div>
      <ol className="grid grid-cols-7 gap-1.5" aria-label="Citas por día">
        {week.map((d) => {
          const isToday = d.date === today;
          const label = formatShop(shopLocalToUtc(d.date, "12:00"), "EEEE d");
          const detail = STRIP_ORDER.filter((s) => d.byStatus[s])
            .map((s) => `${d.byStatus[s]} ${statusLabels[s].toLowerCase()}`)
            .join(", ");
          return (
            <li key={d.date} className="flex flex-col items-center gap-2" title={`${label}: ${d.total} citas${detail ? ` (${detail})` : ""}`}>
              <span className="sr-only">
                {label}: {d.total} citas{detail ? ` (${detail})` : ""}
              </span>
              <div className="bg-ink-950 flex h-28 w-full flex-col-reverse overflow-hidden rounded-[3px]" aria-hidden>
                {STRIP_ORDER.map((s) =>
                  d.byStatus[s] ? (
                    <div key={s} style={{ height: `${((d.byStatus[s] ?? 0) / max) * 100}%`, background: statusColors[s] }} />
                  ) : null,
                )}
              </div>
              <span aria-hidden className="text-sm font-semibold tabular-nums">
                {d.total}
              </span>
              <span aria-hidden className={cn("text-[0.7rem] uppercase", isToday ? "text-brand-500 font-semibold" : "text-muted-foreground")}>
                {formatShop(shopLocalToUtc(d.date, "12:00"), "EEEEEE")}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="text-muted-foreground mt-4 text-xs">{total} citas en la semana.</p>
    </div>
  );
}
