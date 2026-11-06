"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { WhatsAppIcon } from "@/components/shared/social-icons";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { saveAdminNotesAction } from "@/features/appointments/admin-actions";
import {
  allowedTransitions,
  displayStatus,
  statusLabels,
  transitionCopy,
  type AdminTransition,
} from "@/features/appointments/status";
import { phoneTenDigits, type AppointmentView } from "@/features/appointments/view";
import { formatShop, shopTimeKey } from "@/lib/date";
import { formatDuration, formatPrice, formatTime12 } from "@/lib/format";
import { formatPhoneDisplay } from "@/lib/links";
import { openWhatsApp } from "./use-appointment-actions";
import { useRetained } from "@/components/admin/use-sheet-content";
import { whatsappLinkFor } from "./whatsapp";

type AppointmentSheetProps = {
  appointment: AppointmentView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (appt: AppointmentView, to: AdminTransition) => void;
  busy?: boolean;
};

/** Detalle de una cita: datos, notas, historial y acciones. Se usa en tabla, calendario y dashboard. */
export function AppointmentSheet({ appointment, open, onOpenChange, onAction, busy }: AppointmentSheetProps) {
  const shown = useRetained(appointment);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full! overflow-y-auto sm:max-w-md!">
        {shown && <AppointmentDetail key={shown.id} appt={shown} onAction={onAction} busy={busy} />}
      </SheetContent>
    </Sheet>
  );
}

function AppointmentDetail({
  appt,
  onAction,
  busy,
}: {
  appt: AppointmentView;
  onAction: AppointmentSheetProps["onAction"];
  busy?: boolean;
}) {
  const shown = displayStatus(appt.status, appt.startsAt);
  const transitions = allowedTransitions(appt.status, appt.startsAt);
  const wa = whatsappLinkFor(appt);
  const phone10 = phoneTenDigits(appt.customerPhone);

  return (
    <>
      <SheetHeader className="border-border border-b px-5 pt-6 pb-5">
        <StatusBadge status={shown} className="mb-3 self-start" />
        <SheetTitle className="font-display text-3xl font-bold">{appt.customerName}</SheetTitle>
        <SheetDescription>
          {appt.serviceName} · {formatShop(appt.startsAt, "EEEE d 'de' MMMM")}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-6 px-5 pb-6">
        {shown === "overdue" && (
          <p className="border-st-pending/40 bg-st-pending/10 rounded-[3px] border p-3 text-sm">
            La hora de esta solicitud ya pasó sin confirmarse. Se marcará como vencida automáticamente.
          </p>
        )}

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Fecha</dt>
          <dd>{formatShop(appt.startsAt, "EEEE d 'de' MMMM yyyy")}</dd>
          <dt className="text-muted-foreground">Hora</dt>
          <dd>
            {formatTime12(shopTimeKey(appt.startsAt))} – {formatTime12(shopTimeKey(appt.endsAt))}
          </dd>
          <dt className="text-muted-foreground">Servicio</dt>
          <dd>
            {appt.serviceName} · {formatDuration(appt.durationMinutes)}
          </dd>
          <dt className="text-muted-foreground">Precio</dt>
          <dd>{formatPrice(appt.price)}</dd>
          {appt.barberName && (
            <>
              <dt className="text-muted-foreground">Barbero</dt>
              <dd>{appt.barberName}</dd>
            </>
          )}
          <dt className="text-muted-foreground">Teléfono</dt>
          <dd>
            <a href={`tel:${appt.customerPhone}`} className="hover:text-brand-300 underline-offset-4 hover:underline">
              {formatPhoneDisplay(phone10)}
            </a>
          </dd>
          <dt className="text-muted-foreground">Solicitada</dt>
          <dd>{formatShop(appt.createdAt, "d MMM yyyy, h:mm aaa")}</dd>
        </dl>

        {(transitions.length > 0 || wa) && (
          <div className="flex flex-wrap gap-2">
            {transitions.map((to) => (
              <Button
                key={to}
                size="sm"
                variant={to === "confirmed" || to === "completed" ? "default" : "destructive"}
                onClick={() => onAction(appt, to)}
                disabled={busy}
              >
                {transitionCopy[to].verb}
              </Button>
            ))}
            {wa && (
              <Button size="sm" variant="outline" onClick={() => openWhatsApp(wa)}>
                <WhatsAppIcon className="size-4" aria-hidden /> WhatsApp
              </Button>
            )}
          </div>
        )}

        <section>
          <h3 className="label-brand mb-2">Notas del cliente</h3>
          <p className="text-muted-foreground text-sm whitespace-pre-line">{appt.customerNotes || "Sin notas."}</p>
        </section>

        <AdminNotes id={appt.id} initial={appt.adminNotes ?? ""} />

        <section>
          <h3 className="label-brand mb-3">Historial</h3>
          {appt.events.length === 0 ? (
            <p className="text-muted-foreground text-sm">Sin movimientos.</p>
          ) : (
            <ol className="border-border space-y-3 border-l pl-4 text-sm">
              {appt.events.map((e) => (
                <li key={e.id} className="relative">
                  <span className="bg-ink-700 absolute top-1.5 -left-[21px] size-2 rounded-full" aria-hidden />
                  <p>
                    {e.from ? `${statusLabels[e.from]} → ` : "Solicitud creada · "}
                    <span className="font-medium">{statusLabels[e.to]}</span>
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatShop(e.at, "d MMM yyyy, h:mm aaa")} · {e.bySystem ? "cliente o sistema" : "administración"}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}

function AdminNotes({ id, initial }: { id: string; initial: string }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [pending, startTransition] = useTransition();
  const dirty = value.trim() !== saved.trim();

  function save() {
    startTransition(async () => {
      const result = await saveAdminNotesAction({ id, notes: value });
      if (result.ok) {
        setSaved(value);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <section>
      <label htmlFor={`notes-${id}`} className="label-brand mb-2 block">
        Notas internas
      </label>
      <Textarea
        id={`notes-${id}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder="Solo las ve la administración."
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-muted-foreground text-xs">{value.length}/500</span>
        <Button size="sm" variant="secondary" onClick={save} disabled={!dirty || pending}>
          {pending ? "Guardando…" : "Guardar notas"}
        </Button>
      </div>
    </section>
  );
}
