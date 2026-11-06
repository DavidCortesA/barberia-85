"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { describedBy, FormField } from "@/components/admin/form-field";
import { ImageUpload } from "@/components/admin/media/image-upload";
import { useSheetSession } from "@/components/admin/use-sheet-content";
import { useServerAction } from "@/components/admin/use-server-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { saveServiceAction } from "@/features/services/admin-actions";
import { serviceSchema, type ServiceInput } from "@/features/services/schemas";
import type { Service } from "@/types";

type ServiceFormProps = {
  service: Service | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ServiceForm({ service, open, onOpenChange }: ServiceFormProps) {
  const session = useSheetSession(open, service);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full! overflow-y-auto sm:max-w-lg!">
        {session && <ServiceFormBody key={session.key} service={session.value} onDone={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  );
}

function ServiceFormBody({ service, onDone }: { service: Service | null; onDone: () => void }) {
  const { pending, run } = useServerAction();
  const form = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      id: service?.id,
      name: service?.name ?? "",
      description: service?.description ?? "",
      price: service ? Number(service.price) : 0,
      durationMinutes: service?.duration_minutes ?? 30,
      imageUrl: service?.image_url ?? "",
      isActive: service?.is_active ?? true,
    },
  });
  const { errors } = form.formState;
  const description = useWatch({ control: form.control, name: "description" }) ?? "";

  const onSubmit = form.handleSubmit((values) =>
    run(() => saveServiceAction(values), {
      onSuccess: onDone,
      onError: (r) => {
        for (const [field, message] of Object.entries(r.fieldErrors ?? {})) {
          form.setError(field as keyof ServiceInput, { message });
        }
      },
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-full flex-col">
      <SheetHeader className="border-border border-b px-5 pt-6 pb-4">
        <SheetTitle className="font-display text-3xl font-bold">{service ? "Editar servicio" : "Nuevo servicio"}</SheetTitle>
        <SheetDescription>Los cambios se ven en el sitio al guardar.</SheetDescription>
      </SheetHeader>

      <div className="space-y-5 px-5 py-5">
        <FormField id="svc-name" label="Nombre" error={errors.name?.message}>
          <Input id="svc-name" className="h-10" aria-invalid={!!errors.name} aria-describedby={describedBy("svc-name", errors.name?.message)} {...form.register("name")} />
        </FormField>

        <FormField
          id="svc-description"
          label="Descripción"
          optional
          error={errors.description?.message}
          hint={`${description.length}/500`}
        >
          <Textarea
            id="svc-description"
            rows={3}
            maxLength={500}
            aria-invalid={!!errors.description}
            aria-describedby={describedBy("svc-description", errors.description?.message, "x")}
            {...form.register("description")}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField id="svc-price" label="Precio (MXN)" error={errors.price?.message}>
            <Input
              id="svc-price"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              className="h-10"
              aria-invalid={!!errors.price}
              aria-describedby={describedBy("svc-price", errors.price?.message)}
              {...form.register("price", { valueAsNumber: true })}
            />
          </FormField>
          <FormField id="svc-duration" label="Duración (min)" error={errors.durationMinutes?.message}>
            <Input
              id="svc-duration"
              type="number"
              inputMode="numeric"
              min={5}
              max={480}
              step={5}
              className="h-10"
              aria-invalid={!!errors.durationMinutes}
              aria-describedby={describedBy("svc-duration", errors.durationMinutes?.message)}
              {...form.register("durationMinutes", { valueAsNumber: true })}
            />
          </FormField>
        </div>

        <Controller
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <ImageUpload
              label="Foto"
              folder="services"
              value={field.value}
              onChange={field.onChange}
              hint="Opcional. Se recorta al centro (4:3)."
            />
          )}
        />

        <Controller
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>
                <span className="font-medium">Activo</span>
                <span className="text-muted-foreground block text-xs">Visible en el sitio y disponible para reservar.</span>
              </span>
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
