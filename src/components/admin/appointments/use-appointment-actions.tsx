"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  changeAppointmentStatusAction,
  rejectAppointmentsAction,
  type Overlap,
} from "@/features/appointments/admin-actions";
import { transitionCopy, type AdminTransition } from "@/features/appointments/status";
import type { AppointmentView } from "@/features/appointments/view";
import { formatShop } from "@/lib/date";

export function openWhatsApp(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Acciones sobre citas con su diálogo de confirmación. Se comparte entre el
 * dashboard, la tabla, el calendario y la hoja de detalle.
 */
export function useAppointmentActions(options: { onChanged?: () => void } = {}) {
  const [request, setRequest] = useState<{ appt: AppointmentView; to: AdminTransition } | null>(null);
  const [overlaps, setOverlaps] = useState<Overlap[]>([]);
  const [busy, startTransition] = useTransition();

  function run() {
    if (!request) return;
    const { appt, to } = request;
    startTransition(async () => {
      const result = await changeAppointmentStatusAction({ id: appt.id, to });
      setRequest(null);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      const url = result.data?.whatsappUrl;
      toast.success(result.message, {
        description: url ? `Avisa a ${appt.customerName} por WhatsApp.` : undefined,
        action: url ? { label: "WhatsApp", onClick: () => openWhatsApp(url) } : undefined,
        duration: url ? 15000 : 4000,
      });
      if (result.data?.overlaps?.length) setOverlaps(result.data.overlaps);
      options.onChanged?.();
    });
  }

  function rejectOverlaps() {
    const ids = overlaps.map((o) => o.id);
    startTransition(async () => {
      const result = await rejectAppointmentsAction({ ids });
      setOverlaps([]);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      options.onChanged?.();
    });
  }

  const copy = request ? transitionCopy[request.to] : null;

  const dialogs = (
    <>
      <AlertDialog open={!!request} onOpenChange={(open) => !open && !busy && setRequest(null)}>
        <AlertDialogContent>
          {request && copy && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{copy.title}</AlertDialogTitle>
                <AlertDialogDescription>
                  {request.appt.customerName} · {request.appt.serviceName} ·{" "}
                  {formatShop(request.appt.startsAt, "EEEE d 'de' MMMM, h:mm aaa")}. {copy.description}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={busy}>Volver</AlertDialogCancel>
                <Button variant={copy.destructive ? "destructive" : "default"} onClick={run} disabled={busy}>
                  {busy ? "Guardando…" : copy.verb}
                </Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={overlaps.length > 0} onOpenChange={(open) => !open && !busy && setOverlaps([])}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hay otras solicitudes para ese horario</AlertDialogTitle>
            <AlertDialogDescription>
              Estas solicitudes pendientes se traslapan con la cita que acabas de confirmar. ¿Quieres rechazarlas?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="space-y-1 text-sm">
            {overlaps.map((o) => (
              <li key={o.id} className="border-border bg-ink-950 rounded-[3px] border px-3 py-2">
                {o.customerName} · {formatShop(o.startsAt, "d MMM, h:mm aaa")}
              </li>
            ))}
          </ul>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Mantenerlas</AlertDialogCancel>
            <Button variant="destructive" onClick={rejectOverlaps} disabled={busy}>
              {busy ? "Rechazando…" : "Rechazar todas"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  return {
    /** Abre el diálogo de confirmación para cambiar el estado. */
    ask: (appt: AppointmentView, to: AdminTransition) => setRequest({ appt, to }),
    busy,
    dialogs,
  };
}
