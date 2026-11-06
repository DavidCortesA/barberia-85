import { z } from "zod";
import { timeSchema, ymdSchema } from "@/features/appointments/schemas";

const toMinutes = (hm: string) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));

export const rangeSchema = z.object({ open: timeSchema, close: timeSchema });

export const daySchema = z.object({
  day: z.number().int().min(0).max(6),
  closed: z.boolean(),
  ranges: z.array(rangeSchema).max(4, "Máximo 4 rangos por día"),
});

export type DayInput = z.infer<typeof daySchema>;

const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/**
 * Horario semanal completo (7 días). Varios rangos por día (p. ej. cierre a la
 * hora de comida); se valida que cada rango termine después de empezar y que
 * no se traslapen (la BD también lo impide con un constraint de exclusión).
 */
export const weeklySchema = z
  .array(daySchema)
  .length(7, "Faltan días en el horario")
  .superRefine((days, ctx) => {
    const seen = new Set(days.map((d) => d.day));
    if (seen.size !== 7) ctx.addIssue({ code: "custom", message: "Cada día debe aparecer una sola vez" });

    days.forEach((d, i) => {
      if (d.closed) return;
      const name = DAY_NAMES[d.day];
      if (d.ranges.length === 0) {
        ctx.addIssue({ code: "custom", path: [i, "ranges"], message: `Agrega al menos un horario el ${name} o márcalo cerrado` });
        return;
      }
      const sorted = [...d.ranges].sort((a, b) => a.open.localeCompare(b.open));
      sorted.forEach((r, j) => {
        if (toMinutes(r.close) <= toMinutes(r.open)) {
          ctx.addIssue({ code: "custom", path: [i, "ranges"], message: `El ${name}, la hora de cierre debe ser posterior a la de apertura` });
        }
        const prev = sorted[j - 1];
        if (prev && toMinutes(r.open) < toMinutes(prev.close)) {
          ctx.addIssue({ code: "custom", path: [i, "ranges"], message: `El ${name} tiene horarios que se traslapan` });
        }
      });
    });
  });

export type BusinessHourRow = {
  day_of_week: number;
  opening_time: string | null;
  closing_time: string | null;
  is_closed: boolean;
};

/** Filas para business_hours (un día cerrado = una fila is_closed). */
export function weeklyToRows(days: DayInput[]): BusinessHourRow[] {
  return days.flatMap((d) =>
    d.closed
      ? [{ day_of_week: d.day, opening_time: null, closing_time: null, is_closed: true }]
      : [...d.ranges]
          .sort((a, b) => a.open.localeCompare(b.open))
          .map((r): BusinessHourRow => ({ day_of_week: d.day, opening_time: r.open, closing_time: r.close, is_closed: false })),
  );
}

export const exceptionSchema = z
  .object({
    date: ymdSchema,
    closed: z.boolean(),
    open: z.string(),
    close: z.string(),
    note: z.string().trim().max(200, "Máximo 200 caracteres"),
  })
  .superRefine((v, ctx) => {
    if (v.closed) return;
    if (!timeSchema.safeParse(v.open).success) ctx.addIssue({ code: "custom", path: ["open"], message: "Hora inválida" });
    if (!timeSchema.safeParse(v.close).success) ctx.addIssue({ code: "custom", path: ["close"], message: "Hora inválida" });
    else if (v.open && toMinutes(v.close) <= toMinutes(v.open)) {
      ctx.addIssue({ code: "custom", path: ["close"], message: "Debe ser posterior a la apertura" });
    }
  });

export type ExceptionInput = z.infer<typeof exceptionSchema>;

export const blockSchema = z
  .object({
    startDate: ymdSchema,
    startTime: timeSchema,
    endDate: ymdSchema,
    endTime: timeSchema,
    reason: z.string().trim().max(200, "Máximo 200 caracteres"),
    barberId: z.union([z.uuid(), z.literal("")]),
  })
  .refine((v) => `${v.endDate}T${v.endTime}` > `${v.startDate}T${v.startTime}`, {
    path: ["endTime"],
    message: "El fin debe ser posterior al inicio",
  });

export type BlockInput = z.infer<typeof blockSchema>;
