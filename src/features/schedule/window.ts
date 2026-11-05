import { dayOfWeekOf } from "@/lib/date";

/** Ventana de reserva (datos públicos). Seguro para usar en el navegador. */
export type ScheduleWindow = {
  /** Hoy en hora de la barbería ("yyyy-MM-dd"). */
  today: string;
  /** Última fecha reservable. */
  lastDate: string;
  /** Días de la semana (0=domingo) con horario regular. */
  openWeekdays: number[];
  /** Excepciones dentro de la ventana: abierto/cerrado ese día. */
  exceptions: { date: string; open: boolean }[];
};

/** ¿Hay atención ese día según la ventana? (el calendario deshabilita el resto). */
export function isDateOpen(window: ScheduleWindow, ymd: string): boolean {
  if (ymd < window.today || ymd > window.lastDate) return false;
  const exception = window.exceptions.find((e) => e.date === ymd);
  if (exception) return exception.open;
  return window.openWeekdays.includes(dayOfWeekOf(ymd));
}
