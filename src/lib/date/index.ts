import { TZDate } from "@date-fns/tz";
import { addMinutes, format } from "date-fns";
import { es } from "date-fns/locale";
import { siteConfig } from "@/config/site";

/**
 * ÚNICA frontera de zona horaria del proyecto.
 * - En base de datos todo se guarda en UTC (timestamptz).
 * - Las reglas de negocio (horarios, días) se expresan en hora de la barbería.
 * - Ningún otro módulo debe usar `new Date()` para interpretar horas locales.
 */
export const SHOP_TZ = siteConfig.timeZone;

/** Fecha/hora actual vista desde la zona de la barbería. */
export function nowInShop(): TZDate {
  return TZDate.tz(SHOP_TZ);
}

/** Convierte un instante (ISO UTC, Date o ms) a hora de la barbería. */
export function toShop(value: string | number | Date): TZDate {
  return new TZDate(new Date(value).getTime(), SHOP_TZ);
}

/** "2026-11-12" + "11:30" (hora local de la barbería) → instante UTC. */
export function shopLocalToUtc(dateYmd: string, timeHm: string): Date {
  const [y, m, d] = dateYmd.split("-").map(Number);
  const [hh, mm] = timeHm.split(":").map(Number);
  return new Date(new TZDate(y, m - 1, d, hh, mm, 0, 0, SHOP_TZ).getTime());
}

/** Fin de una cita a partir de su inicio y duración. */
export function endFromDuration(start: Date, durationMinutes: number): Date {
  return addMinutes(start, durationMinutes);
}

/** Formatea en hora de la barbería con locale español. */
export function formatShop(value: string | number | Date, pattern: string): string {
  return format(toShop(value), pattern, { locale: es });
}

/** "yyyy-MM-dd" en hora de la barbería. */
export function shopDateKey(value: string | number | Date): string {
  return format(toShop(value), "yyyy-MM-dd");
}

/** "HH:mm" en hora de la barbería. */
export function shopTimeKey(value: string | number | Date): string {
  return format(toShop(value), "HH:mm");
}

/**
 * Hora local "flotante" (sin offset) para FullCalendar con `timeZone: "UTC"`.
 * Evita instalar un plugin de zonas horarias con nombre.
 */
export function toFloatingIso(value: string | number | Date): string {
  return format(toShop(value), "yyyy-MM-dd'T'HH:mm:ss");
}

/** Día de la semana 0-6 (domingo=0) de una fecha "yyyy-MM-dd". */
export function dayOfWeekOf(dateYmd: string): number {
  const [y, m, d] = dateYmd.split("-").map(Number);
  return new TZDate(y, m - 1, d, 12, 0, 0, 0, SHOP_TZ).getDay();
}
