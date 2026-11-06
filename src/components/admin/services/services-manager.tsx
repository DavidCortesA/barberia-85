"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useServerAction } from "@/components/admin/use-server-action";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  deleteServiceAction,
  moveServiceAction,
  toggleServiceAction,
} from "@/features/services/admin-actions";
import { formatDuration, formatPrice } from "@/lib/format";
import type { Service } from "@/types";
import { ServiceForm } from "./service-form";

export function ServicesManager({ services }: { services: Service[] }) {
  const [editing, setEditing] = useState<Service | "new" | null>(null);
  const { pending, run } = useServerAction();

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing("new")}>
          <Plus aria-hidden /> Nuevo servicio
        </Button>
      </div>

      {services.length === 0 ? (
        <EmptyState
          title="Aún no hay servicios"
          description="Crea el primero para que aparezca en el sitio y en la reserva."
        />
      ) : (
        <ul className="space-y-2">
          {services.map((s, i) => (
            <li
              key={s.id}
              className="border-border bg-ink-900 flex flex-col gap-4 rounded-[4px] border p-4 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="border-border bg-ink-950 relative size-16 shrink-0 overflow-hidden rounded-[3px] border">
                  {s.image_url ? (
                    <Image src={s.image_url} alt="" fill sizes="64px" className="object-cover" />
                  ) : (
                    <span className="font-display text-muted-foreground grid h-full place-items-center text-xl">85</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {s.name}
                    {!s.is_active && <span className="text-muted-foreground ml-2 text-xs font-normal">(oculto)</span>}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {formatPrice(Number(s.price))} · {formatDuration(s.duration_minutes)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="text-muted-foreground mr-2 inline-flex items-center gap-2 text-xs">
                  <Switch
                    checked={s.is_active}
                    onCheckedChange={(checked) => run(() => toggleServiceAction({ id: s.id, isActive: checked }))}
                    disabled={pending}
                    aria-label={`Mostrar ${s.name} en el sitio`}
                  />
                  Activo
                </label>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Subir ${s.name}`}
                  disabled={pending || i === 0}
                  onClick={() => run(() => moveServiceAction({ id: s.id, direction: "up" }))}
                >
                  <ArrowUp aria-hidden />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Bajar ${s.name}`}
                  disabled={pending || i === services.length - 1}
                  onClick={() => run(() => moveServiceAction({ id: s.id, direction: "down" }))}
                >
                  <ArrowDown aria-hidden />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(s)}>
                  <Pencil aria-hidden /> Editar
                </Button>
                <ConfirmDialog
                  trigger={
                    <Button size="icon-sm" variant="ghost" aria-label={`Eliminar ${s.name}`} disabled={pending}>
                      <Trash2 aria-hidden />
                    </Button>
                  }
                  title={`¿Eliminar "${s.name}"?`}
                  description="Solo se puede eliminar si nunca se ha reservado. Si ya tiene citas, mejor desactívalo."
                  confirmLabel="Eliminar"
                  onConfirm={() => run(() => deleteServiceAction({ id: s.id }))}
                  pending={pending}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <ServiceForm
        service={editing === "new" ? null : editing}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </>
  );
}
