"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { FormField } from "@/components/admin/form-field";
import { Panel } from "@/components/admin/page-header";
import { useServerAction } from "@/components/admin/use-server-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateLong } from "@/features/appointments/format";
import { createExceptionAction, deleteExceptionAction } from "@/features/schedule/admin-actions";
import { exceptionSchema, type ExceptionInput } from "@/features/schedule/admin-schemas";
import { formatTime12 } from "@/lib/format";
import type { ScheduleException } from "@/types";

/** Días con cierre total u horario especial (reemplazan al horario semanal ese día). */
export function ExceptionsEditor({ exceptions, today }: { exceptions: ScheduleException[]; today: string }) {
  const { pending, run } = useServerAction();
  const form = useForm<ExceptionInput>({
    resolver: zodResolver(exceptionSchema),
    defaultValues: { date: "", closed: true, open: "10:00", close: "14:00", note: "" },
  });
  const { errors } = form.formState;
  const closed = useWatch({ control: form.control, name: "closed" });

  const onSubmit = form.handleSubmit((values) =>
    run(() => createExceptionAction(values), { onSuccess: () => form.reset({ ...values, date: "", note: "" }) }),
  );

  return (
    <Panel title="Días especiales" description="Cierres (festivos, vacaciones) u horario distinto en una fecha.">
      <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <FormField id="exc-date" label="Fecha" error={errors.date?.message}>
          <Input id="exc-date" type="date" min={today} className="h-10" aria-invalid={!!errors.date} {...form.register("date")} />
        </FormField>
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Ese día</legend>
          <div className="flex gap-4 text-sm">
            <label className="inline-flex items-center gap-2">
              <input type="radio" checked={closed} onChange={() => form.setValue("closed", true)} className="accent-[#fca420]" />
              Cerrado
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" checked={!closed} onChange={() => form.setValue("closed", false)} className="accent-[#fca420]" />
              Horario especial
            </label>
          </div>
        </fieldset>
        {!closed && (
          <>
            <FormField id="exc-open" label="Abre" error={errors.open?.message}>
              <Input id="exc-open" type="time" step={900} className="h-10" {...form.register("open")} />
            </FormField>
            <FormField id="exc-close" label="Cierra" error={errors.close?.message}>
              <Input id="exc-close" type="time" step={900} className="h-10" {...form.register("close")} />
            </FormField>
          </>
        )}
        <FormField id="exc-note" label="Nota" optional error={errors.note?.message} className="sm:col-span-2">
          <Input id="exc-note" maxLength={200} placeholder="Ej. Día festivo" className="h-10" {...form.register("note")} />
        </FormField>
        <div className="sm:col-span-2">
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? "Guardando…" : "Agregar día especial"}
          </Button>
        </div>
      </form>

      <div className="border-border mt-5 border-t pt-4">
        {exceptions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay días especiales próximos.</p>
        ) : (
          <ul className="space-y-2">
            {exceptions.map((e) => (
              <li key={e.id} className="border-border bg-ink-950 flex items-center gap-3 rounded-[3px] border px-3 py-2">
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-medium">{formatDateLong(e.exception_date)}</p>
                  <p className="text-muted-foreground truncate">
                    {e.is_closed
                      ? "Cerrado"
                      : `${formatTime12(e.opening_time!.slice(0, 5))} – ${formatTime12(e.closing_time!.slice(0, 5))}`}
                    {e.note ? ` · ${e.note}` : ""}
                  </p>
                </div>
                <ConfirmDialog
                  trigger={
                    <Button size="icon-sm" variant="ghost" aria-label={`Eliminar excepción del ${e.exception_date}`}>
                      <Trash2 aria-hidden />
                    </Button>
                  }
                  title="¿Eliminar este día especial?"
                  description="Ese día volverá a usar el horario semanal."
                  confirmLabel="Eliminar"
                  onConfirm={() => run(() => deleteExceptionAction({ id: e.id }))}
                  pending={pending}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
