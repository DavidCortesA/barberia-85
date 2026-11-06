"use client";

import { useState } from "react";
import { Panel } from "@/components/admin/page-header";
import { useServerAction } from "@/components/admin/use-server-action";
import { Button } from "@/components/ui/button";
import { saveWeeklyHoursAction } from "@/features/schedule/admin-actions";
import { weeklySchema, type DayInput } from "@/features/schedule/admin-schemas";
import { rowsToDays, ScheduleErrors, WeeklyRanges } from "./weekly-ranges";

type Row = { day_of_week: number; opening_time: string | null; closing_time: string | null; is_closed: boolean };

/** Horario semanal de la barbería (varios rangos por día, p. ej. cierre a la hora de comida). */
export function WeeklyHoursEditor({ rows }: { rows: Row[] }) {
  const [days, setDays] = useState<DayInput[]>(() => rowsToDays(rows));
  const [errors, setErrors] = useState<string[]>([]);
  const { pending, run } = useServerAction();

  function save() {
    const parsed = weeklySchema.safeParse(days);
    if (!parsed.success) {
      setErrors([...new Set(parsed.error.issues.map((i) => i.message))]);
      return;
    }
    run(() => saveWeeklyHoursAction(parsed.data));
  }

  return (
    <Panel
      title="Horario semanal"
      description="Hora local de la barbería. Agrega un segundo rango para cerrar a medio día."
      actions={
        <Button onClick={save} disabled={pending}>
          {pending ? "Guardando…" : "Guardar horario"}
        </Button>
      }
    >
      <ScheduleErrors errors={errors} />
      <WeeklyRanges
        days={days}
        onChange={(next) => {
          setDays(next);
          setErrors([]);
        }}
      />
    </Panel>
  );
}
