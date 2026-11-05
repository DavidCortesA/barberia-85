import { addDays, addMinutes } from "date-fns";
import { dayOfWeekOf, shopDateKey, shopLocalToUtc } from "@/lib/date";

/**
 * Cálculo PURO de disponibilidad (sin acceso a BD ni a la hora del sistema),
 * para poder probarlo a fondo. La BD vuelve a validar todo al crear la solicitud.
 */

export type TimeRange = { start: string; end: string }; // "HH:mm", hora local de la barbería
export type Interval = { start: Date; end: Date };
export type Slot = { time: string; available: boolean };

type WeeklyRow = {
  day_of_week: number;
  opening_time: string | null;
  closing_time: string | null;
  is_closed: boolean;
};

type ExceptionRow = {
  is_closed: boolean;
  opening_time: string | null;
  closing_time: string | null;
};

const hm = (t: string) => t.slice(0, 5); // "10:00:00" → "10:00"

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function toHm(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** Rangos de atención de una fecha: la excepción (si existe) reemplaza al horario semanal. */
export function resolveRangesForDate(
  date: string,
  weekly: readonly WeeklyRow[],
  exception?: ExceptionRow | null,
): TimeRange[] {
  if (exception) {
    if (exception.is_closed || !exception.opening_time || !exception.closing_time) return [];
    return [{ start: hm(exception.opening_time), end: hm(exception.closing_time) }];
  }
  const dow = dayOfWeekOf(date);
  return weekly
    .filter((r) => r.day_of_week === dow && !r.is_closed && r.opening_time && r.closing_time)
    .map((r) => ({ start: hm(r.opening_time!), end: hm(r.closing_time!) }))
    .sort((a, b) => a.start.localeCompare(b.start));
}

export type ComputeSlotsInput = {
  /** Fecha local "yyyy-MM-dd". */
  date: string;
  now: Date;
  durationMinutes: number;
  slotIntervalMinutes: number;
  minNoticeMinutes: number;
  maxAdvanceDays: number;
  ranges: readonly TimeRange[];
  busy: readonly Interval[];
};

/**
 * Horarios de inicio posibles para el día. Cada slot indica si está disponible.
 * Los inicios se alinean al intervalo desde la medianoche local (igual que la BD)
 * y el servicio completo debe caber dentro de un rango de atención.
 */
export function computeSlots(input: ComputeSlotsInput): Slot[] {
  const { date, now, durationMinutes, slotIntervalMinutes, minNoticeMinutes, maxAdvanceDays } = input;

  const today = shopDateKey(now);
  const lastDate = shopDateKey(addDays(now, maxAdvanceDays));
  if (date < today || date > lastDate) return [];

  const earliest = addMinutes(now, minNoticeMinutes);
  const latest = addDays(now, maxAdvanceDays);
  const slots: Slot[] = [];

  for (const range of input.ranges) {
    const open = toMinutes(range.start);
    const close = toMinutes(range.end);
    const first = Math.ceil(open / slotIntervalMinutes) * slotIntervalMinutes;

    for (let t = first; t + durationMinutes <= close; t += slotIntervalMinutes) {
      const time = toHm(t);
      const start = shopLocalToUtc(date, time);
      const end = addMinutes(start, durationMinutes);

      const tooSoon = start < earliest;
      const tooFar = start > latest;
      const taken = input.busy.some((b) => b.start < end && b.end > start);

      slots.push({ time, available: !tooSoon && !tooFar && !taken });
    }
  }
  return slots;
}
