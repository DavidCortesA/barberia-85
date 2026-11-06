"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { DayInput } from "@/features/schedule/admin-schemas";

export const WEEK_DAYS = [
  { day: 1, label: "Lunes" },
  { day: 2, label: "Martes" },
  { day: 3, label: "Miércoles" },
  { day: 4, label: "Jueves" },
  { day: 5, label: "Viernes" },
  { day: 6, label: "Sábado" },
  { day: 0, label: "Domingo" },
];

type HourRow = { day_of_week: number; opening_time: string | null; closing_time: string | null; is_closed?: boolean };

/** Filas de la BD → 7 días con sus rangos (un día sin rangos = cerrado/descansa). */
export function rowsToDays(rows: readonly HourRow[]): DayInput[] {
  return WEEK_DAYS.map(({ day }) => {
    const ranges = rows
      .filter((r) => r.day_of_week === day && !r.is_closed && r.opening_time && r.closing_time)
      .map((r) => ({ open: r.opening_time!.slice(0, 5), close: r.closing_time!.slice(0, 5) }))
      .sort((a, b) => a.open.localeCompare(b.open));
    return { day, closed: ranges.length === 0, ranges };
  });
}

type WeeklyRangesProps = {
  days: DayInput[];
  onChange: (days: DayInput[]) => void;
  /** Texto de un día sin horario ("Cerrado" para la barbería, "Descansa" para un barbero). */
  offLabel?: string;
  onLabel?: string;
};

/** Editor de una semana con varios rangos por día. Controlado: el padre guarda. */
export function WeeklyRanges({ days, onChange, offLabel = "Cerrado", onLabel = "Abierto" }: WeeklyRangesProps) {
  function patch(day: number, fn: (d: DayInput) => DayInput) {
    onChange(days.map((d) => (d.day === day ? fn(d) : d)));
  }

  return (
    <ul className="divide-border divide-y">
      {WEEK_DAYS.map(({ day, label }) => {
        const d = days.find((x) => x.day === day)!;
        return (
          <li key={day} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start">
            <div className="flex w-full items-center justify-between gap-3 sm:w-44 sm:pt-1.5">
              <span className="font-medium">{label}</span>
              <label className="text-muted-foreground inline-flex items-center gap-2 text-xs">
                <Switch
                  checked={!d.closed}
                  onCheckedChange={(open) =>
                    patch(day, (x) => ({
                      ...x,
                      closed: !open,
                      ranges: open && x.ranges.length === 0 ? [{ open: "10:00", close: "19:00" }] : x.ranges,
                    }))
                  }
                  aria-label={`${label}: ${onLabel.toLowerCase()}`}
                />
                {d.closed ? offLabel : onLabel}
              </label>
            </div>
            {!d.closed && (
              <div className="flex flex-1 flex-col gap-2">
                {d.ranges.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      type="time"
                      step={900}
                      value={r.open}
                      aria-label={`${label}, rango ${i + 1}: inicio`}
                      onChange={(e) =>
                        patch(day, (x) => ({ ...x, ranges: x.ranges.map((y, j) => (j === i ? { ...y, open: e.target.value } : y)) }))
                      }
                      className="h-10 w-32"
                    />
                    <span className="text-muted-foreground text-sm">a</span>
                    <Input
                      type="time"
                      step={900}
                      value={r.close}
                      aria-label={`${label}, rango ${i + 1}: fin`}
                      onChange={(e) =>
                        patch(day, (x) => ({ ...x, ranges: x.ranges.map((y, j) => (j === i ? { ...y, close: e.target.value } : y)) }))
                      }
                      className="h-10 w-32"
                    />
                    {d.ranges.length > 1 && (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Quitar rango ${i + 1} del ${label}`}
                        onClick={() => patch(day, (x) => ({ ...x, ranges: x.ranges.filter((_, j) => j !== i) }))}
                      >
                        <X aria-hidden />
                      </Button>
                    )}
                  </div>
                ))}
                {d.ranges.length < 4 && (
                  <Button
                    size="xs"
                    variant="ghost"
                    className="w-fit"
                    onClick={() =>
                      patch(day, (x) => {
                        const last = x.ranges[x.ranges.length - 1];
                        return { ...x, ranges: [...x.ranges, { open: last?.close ?? "16:00", close: "19:00" }] };
                      })
                    }
                  >
                    <Plus aria-hidden /> Agregar rango
                  </Button>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Errores de validación legibles (sin repetir). */
export function ScheduleErrors({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <ul role="alert" className="border-st-rejected/40 bg-st-rejected/10 mb-4 list-inside list-disc rounded-[3px] border p-3 text-sm">
      {errors.map((e) => (
        <li key={e}>{e}</li>
      ))}
    </ul>
  );
}
