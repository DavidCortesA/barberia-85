"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { FormField, NativeSelect } from "@/components/admin/form-field";
import { Panel } from "@/components/admin/page-header";
import { useServerAction } from "@/components/admin/use-server-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBlockAction, deleteBlockAction } from "@/features/schedule/admin-actions";
import { blockSchema, type BlockInput } from "@/features/schedule/admin-schemas";
import { formatShop, shopDateKey } from "@/lib/date";

type Block = { id: string; start: string; end: string; reason: string | null; barberName: string | null };

function rangeText(b: Block) {
  const sameDay = shopDateKey(b.start) === shopDateKey(b.end);
  return sameDay
    ? `${formatShop(b.start, "EEE d MMM, h:mm aaa")} – ${formatShop(b.end, "h:mm aaa")}`
    : `${formatShop(b.start, "EEE d MMM, h:mm aaa")} – ${formatShop(b.end, "EEE d MMM, h:mm aaa")}`;
}

/** Bloqueos de agenda: impiden reservar ese rango (no cancelan citas confirmadas). */
export function BlockedSlotsEditor({
  blocks,
  barbers,
  today,
}: {
  blocks: Block[];
  barbers: { id: string; name: string }[];
  today: string;
}) {
  const { pending, run } = useServerAction();
  const form = useForm<BlockInput>({
    resolver: zodResolver(blockSchema),
    defaultValues: { startDate: today, startTime: "14:00", endDate: today, endTime: "15:00", reason: "", barberId: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    run(() => createBlockAction(values), { onSuccess: () => form.reset({ ...values, reason: "" }) }),
  );

  return (
    <Panel title="Bloqueos de agenda" description="Rangos en los que no se puede reservar (comida, trámite, evento…).">
      <form onSubmit={onSubmit} noValidate className="grid grid-cols-2 gap-4">
        <FormField id="blk-sd" label="Desde (fecha)" error={errors.startDate?.message}>
          <Input id="blk-sd" type="date" min={today} className="h-10" {...form.register("startDate")} />
        </FormField>
        <FormField id="blk-st" label="Hora" error={errors.startTime?.message}>
          <Input id="blk-st" type="time" step={900} className="h-10" {...form.register("startTime")} />
        </FormField>
        <FormField id="blk-ed" label="Hasta (fecha)" error={errors.endDate?.message}>
          <Input id="blk-ed" type="date" min={today} className="h-10" {...form.register("endDate")} />
        </FormField>
        <FormField id="blk-et" label="Hora" error={errors.endTime?.message}>
          <Input id="blk-et" type="time" step={900} className="h-10" {...form.register("endTime")} />
        </FormField>
        <FormField id="blk-reason" label="Motivo" optional error={errors.reason?.message} className={barbers.length ? "" : "col-span-2"}>
          <Input id="blk-reason" maxLength={200} className="h-10" placeholder="Ej. Comida" {...form.register("reason")} />
        </FormField>
        {barbers.length > 0 && (
          <FormField id="blk-barber" label="Aplica a">
            <NativeSelect id="blk-barber" {...form.register("barberId")}>
              <option value="">Toda la barbería</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </NativeSelect>
          </FormField>
        )}
        <div className="col-span-2">
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? "Guardando…" : "Agregar bloqueo"}
          </Button>
        </div>
      </form>

      <div className="border-border mt-5 border-t pt-4">
        {blocks.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay bloqueos próximos.</p>
        ) : (
          <ul className="space-y-2">
            {blocks.map((b) => (
              <li key={b.id} className="border-border bg-ink-950 flex items-center gap-3 rounded-[3px] border px-3 py-2">
                <span className="fc-blocked-swatch size-3 shrink-0 rounded-[2px]" aria-hidden />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-medium first-letter:uppercase">{rangeText(b)}</p>
                  <p className="text-muted-foreground truncate">
                    {b.reason || "Sin motivo"}
                    {b.barberName ? ` · ${b.barberName}` : ""}
                  </p>
                </div>
                <ConfirmDialog
                  trigger={
                    <Button size="icon-sm" variant="ghost" aria-label="Eliminar bloqueo">
                      <Trash2 aria-hidden />
                    </Button>
                  }
                  title="¿Eliminar este bloqueo?"
                  description="Ese rango volverá a estar disponible para reservar."
                  confirmLabel="Eliminar"
                  onConfirm={() => run(() => deleteBlockAction({ id: b.id }))}
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
