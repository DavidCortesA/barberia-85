"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Clock3, Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { describedBy, FormField } from "@/components/admin/form-field";
import { ImageUpload } from "@/components/admin/media/image-upload";
import { useSheetSession } from "@/components/admin/use-sheet-content";
import { useServerAction } from "@/components/admin/use-server-action";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { deleteBarberAction, saveBarberAction, toggleBarberAction } from "@/features/barbers/admin-actions";
import { barberSchema, type BarberInput } from "@/features/barbers/schemas";
import { summarizeWeeklyHours } from "@/features/schedule/format";
import type { BusinessHour, Tables } from "@/types";
import { BarberHoursSheet, type BarberHour } from "./barber-hours-sheet";

type Barber = Tables<"barbers"> & { hours: BarberHour[] };

export function BarbersManager({ barbers, shopHours }: { barbers: Barber[]; shopHours: BusinessHour[] }) {
  const [editing, setEditing] = useState<Barber | "new" | null>(null);
  const [hoursFor, setHoursFor] = useState<string | null>(null);
  const { pending, run } = useServerAction();
  const session = useSheetSession(editing !== null, editing === "new" ? null : editing);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing("new")}>
          <Plus aria-hidden /> Agregar barbero
        </Button>
      </div>

      {barbers.length === 0 ? (
        <EmptyState
          title="Sin barberos registrados"
          description="Es opcional: la agenda funciona sin barberos. Agrégalos si quieres llevar el registro del equipo."
        />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {barbers.map((b) => (
            <li key={b.id} className="border-border bg-ink-900 flex gap-4 rounded-[4px] border p-4">
              <div className="border-border bg-ink-950 relative size-16 shrink-0 overflow-hidden rounded-full border">
                {b.image_url ? (
                  <Image src={b.image_url} alt="" fill sizes="64px" className="object-cover" />
                ) : (
                  <span className="text-muted-foreground grid h-full place-items-center text-lg font-semibold">
                    {b.name.slice(0, 1)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{b.name}</p>
                <p className="text-muted-foreground truncate text-sm">{b.specialty || "Sin especialidad"}</p>
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
                  {b.hours.length === 0 ? (
                    <div className="text-muted-foreground col-span-2">Sin horario de trabajo.</div>
                  ) : (
                    summarizeWeeklyHours(
                      b.hours.map((h) => ({ ...h, is_closed: false })),
                      "Descansa",
                    ).map((line) => (
                      <div key={line.label} className="contents">
                        <dt className="text-muted-foreground">{line.label}</dt>
                        <dd className={line.value === "Descansa" ? "text-muted-foreground" : ""}>{line.value}</dd>
                      </div>
                    ))
                  )}
                </dl>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="text-muted-foreground mr-1 inline-flex items-center gap-2 text-xs">
                    <Switch
                      checked={b.is_active}
                      onCheckedChange={(checked) => run(() => toggleBarberAction({ id: b.id, isActive: checked }))}
                      disabled={pending}
                      aria-label={`${b.name} activo`}
                    />
                    Activo
                  </label>
                  <Button size="xs" variant="outline" onClick={() => setEditing(b)}>
                    <Pencil aria-hidden /> Editar
                  </Button>
                  <Button size="xs" variant="outline" onClick={() => setHoursFor(b.id)}>
                    <Clock3 aria-hidden /> Horario
                  </Button>
                  <ConfirmDialog
                    trigger={
                      <Button size="icon-xs" variant="ghost" aria-label={`Eliminar ${b.name}`} disabled={pending}>
                        <Trash2 aria-hidden />
                      </Button>
                    }
                    title={`¿Eliminar a ${b.name}?`}
                    description="Si tiene citas registradas no se podrá eliminar; en ese caso desactívalo."
                    confirmLabel="Eliminar"
                    onConfirm={() => run(() => deleteBarberAction({ id: b.id }))}
                    pending={pending}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <BarberHoursSheet
        barber={barbers.find((b) => b.id === hoursFor) ?? null}
        shopHours={shopHours}
        onOpenChange={(open) => !open && setHoursFor(null)}
      />

      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent className="w-full! overflow-y-auto sm:max-w-lg!">
          {session && <BarberForm key={session.key} barber={session.value} onDone={() => setEditing(null)} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

function BarberForm({ barber, onDone }: { barber: Barber | null; onDone: () => void }) {
  const { pending, run } = useServerAction();
  const form = useForm<BarberInput>({
    resolver: zodResolver(barberSchema),
    defaultValues: {
      id: barber?.id,
      name: barber?.name ?? "",
      specialty: barber?.specialty ?? "",
      description: barber?.description ?? "",
      imageUrl: barber?.image_url ?? "",
      isActive: barber?.is_active ?? true,
    },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => run(() => saveBarberAction(values), { onSuccess: onDone }));

  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-full flex-col">
      <SheetHeader className="border-border border-b px-5 pt-6 pb-4">
        <SheetTitle className="font-display text-3xl font-bold">{barber ? "Editar barbero" : "Nuevo barbero"}</SheetTitle>
        <SheetDescription>Datos del equipo de la barbería.</SheetDescription>
      </SheetHeader>
      <div className="space-y-5 px-5 py-5">
        <FormField id="b-name" label="Nombre" error={errors.name?.message}>
          <Input id="b-name" className="h-10" aria-invalid={!!errors.name} aria-describedby={describedBy("b-name", errors.name?.message)} {...form.register("name")} />
        </FormField>
        <FormField id="b-specialty" label="Especialidad" optional error={errors.specialty?.message}>
          <Input id="b-specialty" className="h-10" aria-invalid={!!errors.specialty} {...form.register("specialty")} />
        </FormField>
        <FormField id="b-description" label="Descripción" optional error={errors.description?.message}>
          <Textarea id="b-description" rows={3} maxLength={500} aria-invalid={!!errors.description} {...form.register("description")} />
        </FormField>
        <Controller
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <ImageUpload label="Foto" folder="barbers" aspect="1/1" value={field.value} onChange={field.onChange} />
          )}
        />
        <Controller
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <label className="flex items-center justify-between gap-4 text-sm">
              <span className="font-medium">Activo</span>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </label>
          )}
        />
      </div>
      <SheetFooter className="border-border bg-ink-900 sticky bottom-0 flex-row justify-end border-t px-5 py-4">
        <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </Button>
      </SheetFooter>
    </form>
  );
}
