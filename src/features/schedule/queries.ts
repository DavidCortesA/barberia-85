import "server-only";
import { addDays, format } from "date-fns";
import { nowInShop, shopDateKey, shopLocalToUtc } from "@/lib/date";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";
import { computeSlots, resolveRangesForDate, type Slot } from "./availability";
import type { ScheduleWindow } from "./window";

export type AvailabilityResult =
  | { ok: true; date: string; slots: Slot[] }
  | { ok: false; code: "service_not_found" };

const nextDay = (ymd: string) => format(addDays(new Date(`${ymd}T12:00:00Z`), 1), "yyyy-MM-dd");

/**
 * Disponibilidad de un servicio en una fecha. Se calcula SIEMPRE en el servidor:
 * horario (público) + citas/bloqueos ocupados (RPC solo para service_role, sin
 * datos personales). El cliente nunca decide qué está libre.
 */
export async function getAvailability(serviceId: string, date: string): Promise<AvailabilityResult> {
  const pub = createPublicClient();

  const [serviceRes, settingsRes, hoursRes, exceptionRes] = await Promise.all([
    pub.from("services").select("duration_minutes").eq("id", serviceId).eq("is_active", true).maybeSingle(),
    pub.from("business_settings").select("*").limit(1).single(),
    pub.from("business_hours").select("day_of_week, opening_time, closing_time, is_closed"),
    pub.from("schedule_exceptions").select("is_closed, opening_time, closing_time").eq("exception_date", date).maybeSingle(),
  ]);

  if (serviceRes.error) throw serviceRes.error;
  if (!serviceRes.data) return { ok: false, code: "service_not_found" };
  if (settingsRes.error) throw settingsRes.error;
  if (hoursRes.error) throw hoursRes.error;
  if (exceptionRes.error) throw exceptionRes.error;

  const settings = settingsRes.data;
  const ranges = resolveRangesForDate(date, hoursRes.data ?? [], exceptionRes.data);
  if (ranges.length === 0) return { ok: true, date, slots: [] };

  const busyRes = await createAdminClient().rpc("get_busy_intervals", {
    p_from: shopLocalToUtc(date, "00:00").toISOString(),
    p_to: shopLocalToUtc(nextDay(date), "00:00").toISOString(),
  });
  if (busyRes.error) throw busyRes.error;

  const slots = computeSlots({
    date,
    now: new Date(),
    durationMinutes: serviceRes.data.duration_minutes,
    slotIntervalMinutes: settings.slot_interval_minutes,
    minNoticeMinutes: settings.min_notice_minutes,
    maxAdvanceDays: settings.max_advance_days,
    ranges,
    busy: (busyRes.data ?? []).map((b) => ({ start: new Date(b.starts_at), end: new Date(b.ends_at) })),
  });

  return { ok: true, date, slots };
}

/** Datos públicos para deshabilitar en el calendario los días sin atención. */
export async function getScheduleWindow(): Promise<ScheduleWindow> {
  const pub = createPublicClient();
  const { data: settings, error: sErr } = await pub
    .from("business_settings")
    .select("max_advance_days")
    .limit(1)
    .single();
  if (sErr) throw sErr;

  const now = nowInShop();
  const today = shopDateKey(now);
  const lastDate = shopDateKey(addDays(now, settings.max_advance_days));

  const [hoursRes, excRes] = await Promise.all([
    pub.from("business_hours").select("day_of_week, is_closed"),
    pub.from("schedule_exceptions").select("exception_date, is_closed").gte("exception_date", today).lte("exception_date", lastDate),
  ]);
  if (hoursRes.error) throw hoursRes.error;
  if (excRes.error) throw excRes.error;

  const openWeekdays = [...new Set((hoursRes.data ?? []).filter((r) => !r.is_closed).map((r) => r.day_of_week))];

  return {
    today,
    lastDate,
    openWeekdays,
    exceptions: (excRes.data ?? []).map((e) => ({ date: e.exception_date, open: !e.is_closed })),
  };
}
