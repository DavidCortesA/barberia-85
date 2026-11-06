"use client";

import { useState } from "react";
import { rowsToDays, ScheduleErrors, WeeklyRanges } from "@/components/admin/schedule/weekly-ranges";
import { useSheetSession } from "@/components/admin/use-sheet-content";
import { useServerAction } from "@/components/admin/use-server-action";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { saveBarberHoursAction } from "@/features/barbers/admin-actions";
import { weeklySchema, type DayInput } from "@/features/schedule/admin-schemas";

export type BarberHour = { day_of_week: number; opening_time: string; closing_time: string };

type BarberHoursSheetProps = {
  barber: { id: string; name: string; hours: BarberHour[] } | null;
  /** Horario de la barbería, para empezar con él si el barbero aún no tiene uno. */
  shopHours: { day_of_week: number; opening_time: string | null; closing_time: string | null; is_closed: boolean }[];
  onOpenChange: (open: boolean) => void;
};

/** Horario de trabajo semanal de un barbero (días de descanso y varios rangos por día). */
export function BarberHoursSheet({ barber, shopHours, onOpenChange }: BarberHoursSheetProps) {
  const session = useSheetSession(barber !== null, barber);
  return (
    <Sheet open={barber !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full! overflow-y-auto sm:max-w-xl!">
        {session?.value && (
          <HoursForm key={session.key} barber={session.value} shopHours={shopHours} onDone={() => onOpenChange(false)} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function HoursForm({
  barber,
  shopHours,
  onDone,
}: {
  barber: NonNullable<BarberHoursSheetProps["barber"]>;
  shopHours: BarberHoursSheetProps["shopHours"];
  onDone: () => void;
}) {
  const isNew = barber.hours.length === 0;
  const [days, setDays] = useState<DayInput[]>(() => rowsToDays(isNew ? shopHours : barber.hours));
  const [errors, setErrors] = useState<string[]>([]);
  const { pending, run } = useServerAction();

  function save() {
    const parsed = weeklySchema.safeParse(days);
    if (!parsed.success) {
      setErrors([...new Set(parsed.error.issues.map((i) => i.message))]);
      return;
    }
    run(() => saveBarberHoursAction({ barberId: barber.id, days: parsed.data }), { onSuccess: onDone });
  }

  return (
    <div className="flex min-h-full flex-col">
      <SheetHeader className="border-border border-b px-5 pt-6 pb-4">
        <SheetTitle className="font-display text-3xl font-bold">Horario de {barber.name}</SheetTitle>
        <SheetDescription>
          {isNew
            ? "Aún no tiene horario: se propone el de la barbería. Ajusta sus días y horas de trabajo."
            : "Días y horas en que trabaja. Hora local de la barbería."}
        </SheetDescription>
      </SheetHeader>
      <div className="px-5 py-3">
        <ScheduleErrors errors={errors} />
        <WeeklyRanges
          days={days}
          onChange={(next) => {
            setDays(next);
            setErrors([]);
          }}
          onLabel="Trabaja"
          offLabel="Descansa"
        />
        <p className="text-muted-foreground mt-3 text-xs">
          Hoy los clientes no eligen barbero al reservar: este horario sirve para organizar al equipo. Si se activa la
          selección de barbero, la disponibilidad se calculará con él.
        </p>
      </div>
      <SheetFooter className="border-border bg-ink-900 sticky bottom-0 flex-row justify-end border-t px-5 py-4">
        <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>
          Cancelar
        </Button>
        <Button onClick={save} disabled={pending}>
          {pending ? "Guardando…" : "Guardar horario"}
        </Button>
      </SheetFooter>
    </div>
  );
}
