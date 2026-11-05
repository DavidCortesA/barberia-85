import { formatShop, shopLocalToUtc } from "@/lib/date";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "2026-11-09" → "Lunes 9 de noviembre" (hora de la barbería). */
export function formatDateLong(ymd: string): string {
  return capitalize(formatShop(shopLocalToUtc(ymd, "12:00"), "EEEE d 'de' MMMM"));
}

/** "2026-11-09" → "lunes 9 de noviembre" (para frases corridas). */
export function formatDateSentence(ymd: string): string {
  return formatShop(shopLocalToUtc(ymd, "12:00"), "EEEE d 'de' MMMM");
}

/** "yyyy-MM-dd" → Date local a mediodía (para react-day-picker, que trabaja con fechas locales). */
export function ymdToLocalDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/** Date local del calendario → "yyyy-MM-dd". */
export function localDateToYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
