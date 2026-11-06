"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { describedBy, FormField, NativeSelect } from "@/components/admin/form-field";
import { Panel } from "@/components/admin/page-header";
import { useServerAction } from "@/components/admin/use-server-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveSettingsAction } from "@/features/settings/admin-actions";
import { SLOT_INTERVALS, settingsSchema, type SettingsInput } from "@/features/settings/schemas";
import type { BusinessSettings } from "@/types";

export function SettingsForm({ settings }: { settings: BusinessSettings }) {
  const { pending, run } = useServerAction();
  const form = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: settings.name,
      address: settings.address ?? "",
      city: settings.city ?? "",
      phone: settings.phone ?? "",
      whatsapp: settings.whatsapp ?? "",
      mapsUrl: settings.maps_url ?? "",
      instagram: settings.instagram ?? "",
      facebook: settings.facebook ?? "",
      tiktok: settings.tiktok ?? "",
      slotIntervalMinutes: settings.slot_interval_minutes,
      minNoticeMinutes: settings.min_notice_minutes,
      maxAdvanceDays: settings.max_advance_days,
      pendingHoldMinutes: settings.pending_hold_minutes,
      maxPendingPerPhone: settings.max_pending_per_phone,
    },
  });
  const { errors, isDirty } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    run(() => saveSettingsAction(values), { onSuccess: () => form.reset(values) }),
  );

  const text = (name: keyof SettingsInput, label: string, opts: { hint?: string; optional?: boolean; type?: string; placeholder?: string; inputMode?: "tel" | "url" } = {}) => {
    const id = `set-${name}`;
    const error = errors[name]?.message;
    return (
      <FormField id={id} label={label} error={error} hint={opts.hint} optional={opts.optional}>
        <Input
          id={id}
          type={opts.type ?? "text"}
          inputMode={opts.inputMode}
          placeholder={opts.placeholder}
          className="h-10"
          aria-invalid={!!error}
          aria-describedby={describedBy(id, error, opts.hint)}
          {...form.register(name)}
        />
      </FormField>
    );
  };

  const number = (name: keyof SettingsInput, label: string, hint: string, min: number, max: number) => {
    const id = `set-${name}`;
    const error = errors[name]?.message;
    return (
      <FormField id={id} label={label} error={error} hint={hint}>
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          className="h-10"
          aria-invalid={!!error}
          aria-describedby={describedBy(id, error, hint)}
          {...form.register(name, { valueAsNumber: true })}
        />
      </FormField>
    );
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <Panel title="Negocio y contacto" description="Se muestran en el pie de página, en Contacto y en la reserva.">
        <div className="grid gap-5 sm:grid-cols-2">
          {text("name", "Nombre del negocio")}
          {text("city", "Ciudad", { optional: true, placeholder: "Ej. Monterrey, N.L." })}
          <div className="sm:col-span-2">{text("address", "Dirección", { optional: true })}</div>
          {text("phone", "Teléfono", { optional: true, type: "tel", inputMode: "tel", hint: "10 dígitos." })}
          {text("whatsapp", "WhatsApp", {
            optional: true,
            type: "tel",
            inputMode: "tel",
            hint: "10 dígitos. Con él aparece el botón de WhatsApp en Contacto y al reservar.",
          })}
          <div className="sm:col-span-2">
            {text("mapsUrl", "Enlace de Google Maps", {
              optional: true,
              type: "url",
              inputMode: "url",
              hint: "En Google Maps: Compartir → Copiar vínculo. Si lo dejas vacío se busca la dirección.",
            })}
          </div>
        </div>
      </Panel>

      <Panel title="Redes sociales" description="Escribe @usuario o pega la URL completa.">
        <div className="grid gap-5 sm:grid-cols-3">
          {text("instagram", "Instagram", { optional: true, placeholder: "@85barberia" })}
          {text("facebook", "Facebook", { optional: true })}
          {text("tiktok", "TikTok", { optional: true })}
        </div>
      </Panel>

      <Panel title="Reglas de reserva" description="Aplican a las solicitudes del sitio. La base de datos las vuelve a validar.">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <FormField id="set-slot" label="Intervalo entre horarios" hint="Cada cuánto se ofrece un horario.">
            <NativeSelect id="set-slot" {...form.register("slotIntervalMinutes", { valueAsNumber: true })}>
              {SLOT_INTERVALS.map((m) => (
                <option key={m} value={m}>
                  {m} minutos
                </option>
              ))}
            </NativeSelect>
          </FormField>
          {number("minNoticeMinutes", "Aviso mínimo (minutos)", "Ej. 60 = no se puede reservar con menos de 1 h.", 0, 10080)}
          {number("maxAdvanceDays", "Anticipación máxima (días)", "Hasta cuántos días adelante se puede reservar.", 1, 365)}
          {number("pendingHoldMinutes", "Retención de pendientes (minutos)", "Cuánto tiempo una solicitud sin confirmar aparta el horario.", 0, 1440)}
          {number("maxPendingPerPhone", "Pendientes por teléfono", "Límite anti-abuso de solicitudes abiertas.", 1, 10)}
          <FormField id="set-tz" label="Zona horaria" hint="Fija en el sistema; cambiarla requiere ajustar el código.">
            <Input id="set-tz" value={settings.timezone} readOnly disabled className="h-10" />
          </FormField>
        </div>
      </Panel>

      <div className="border-border bg-ink-950/90 sticky bottom-20 z-20 flex items-center justify-end gap-3 rounded-[4px] border p-3 backdrop-blur md:bottom-4">
        <span className="text-muted-foreground mr-auto text-xs">{isDirty ? "Tienes cambios sin guardar." : "Sin cambios."}</span>
        <Button type="button" variant="ghost" onClick={() => form.reset()} disabled={!isDirty || pending}>
          Descartar
        </Button>
        <Button type="submit" disabled={!isDirty || pending}>
          {pending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
