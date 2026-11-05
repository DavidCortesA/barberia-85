import { formatTime12 } from "@/lib/format";

type WeeklyRow = {
  day_of_week: number;
  opening_time: string | null;
  closing_time: string | null;
  is_closed: boolean;
};

export type HoursLine = { label: string; value: string };

const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
// Orden de presentación: lunes a domingo.
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function dayValue(rows: readonly WeeklyRow[], dow: number): string {
  const ranges = rows
    .filter((r) => r.day_of_week === dow && !r.is_closed && r.opening_time && r.closing_time)
    .sort((a, b) => a.opening_time!.localeCompare(b.opening_time!))
    .map((r) => `${formatTime12(r.opening_time!.slice(0, 5))} – ${formatTime12(r.closing_time!.slice(0, 5))}`);
  return ranges.length > 0 ? ranges.join(", ") : "Cerrado";
}

/**
 * Resume el horario semanal agrupando días consecutivos con el mismo horario:
 * "Lunes a sábado · 10:00 a. m. – 7:00 p. m." / "Domingo · Cerrado".
 */
export function summarizeWeeklyHours(rows: readonly WeeklyRow[]): HoursLine[] {
  const groups: { days: number[]; value: string }[] = [];
  for (const dow of DISPLAY_ORDER) {
    const value = dayValue(rows, dow);
    const last = groups[groups.length - 1];
    if (last && last.value === value) last.days.push(dow);
    else groups.push({ days: [dow], value });
  }

  return groups.map(({ days, value }) => {
    const first = capitalize(DAY_NAMES[days[0]]);
    const lastName = DAY_NAMES[days[days.length - 1]];
    const label =
      days.length === 1 ? first : days.length === 2 ? `${first} y ${lastName}` : `${first} a ${lastName}`;
    return { label, value };
  });
}
