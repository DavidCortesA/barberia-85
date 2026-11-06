import "server-only";
import { addDays, format } from "date-fns";
import type { AdminSession } from "@/features/auth/dal";
import { nowInShop, shopDateKey, shopLocalToUtc } from "@/lib/date";
import type { AppointmentStatus } from "@/types";
import { allStatuses } from "./status";
import { APPOINTMENT_SELECT, toAppointmentView, type AppointmentView } from "./view";

type Db = AdminSession["supabase"];

export const PAGE_SIZE = 20;

export type AppointmentScope = "upcoming" | "past" | "all";
export type AppointmentFilters = {
  status: AppointmentStatus | "overdue" | "all";
  scope: AppointmentScope;
  date: string | null;
  q: string;
  page: number;
};

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** Lee y sanea los filtros desde los searchParams de la URL. */
export function parseAppointmentFilters(params: Record<string, string | string[] | undefined>): AppointmentFilters {
  const one = (k: string) => (Array.isArray(params[k]) ? params[k]?.[0] : params[k]) ?? "";
  const status = one("estado");
  const scope = one("ver");
  const date = one("fecha");
  const page = Number.parseInt(one("pagina"), 10);
  return {
    status: status === "overdue" || allStatuses.includes(status as AppointmentStatus) ? (status as AppointmentFilters["status"]) : "all",
    scope: scope === "past" || scope === "all" ? scope : "upcoming",
    date: YMD.test(date) ? date : null,
    q: one("q").slice(0, 60),
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** Quita lo que rompería la sintaxis de filtros de PostgREST (comas, paréntesis, comodines). */
function sanitizeSearch(q: string): string {
  return q.replace(/[,()*%\\:"]/g, " ").replace(/\s+/g, " ").trim();
}

export async function listAppointments(db: Db, f: AppointmentFilters) {
  const now = new Date().toISOString();
  let query = db.from("appointments").select(APPOINTMENT_SELECT, { count: "exact" });

  if (f.status === "overdue") query = query.eq("status", "pending").lt("starts_at", now);
  else if (f.status !== "all") query = query.eq("status", f.status);

  if (f.date) {
    query = query.eq("appointment_date", f.date);
  } else if (f.scope === "upcoming") {
    query = query.gte("appointment_date", shopDateKey(new Date()));
  } else if (f.scope === "past") {
    query = query.lt("starts_at", now);
  }

  const q = sanitizeSearch(f.q);
  if (q) {
    const digits = q.replace(/\D/g, "");
    const filters = [`full_name.ilike.*${q}*`];
    if (digits.length >= 3) filters.push(`phone.ilike.*${digits}*`);
    query = query.or(filters.join(","), { referencedTable: "customers" });
  }

  const ascending = !f.date && f.scope === "upcoming";
  const from = (f.page - 1) * PAGE_SIZE;
  const { data, error, count } = await query
    .order("starts_at", { ascending })
    .range(from, from + PAGE_SIZE - 1);
  if (error) throw new Error(`No se pudieron cargar las citas: ${error.message}`);

  return { rows: (data ?? []).map(toAppointmentView), total: count ?? 0 };
}

export async function getAppointmentsInRange(db: Db, fromYmd: string, toYmd: string): Promise<AppointmentView[]> {
  const { data, error } = await db
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .gte("starts_at", shopLocalToUtc(fromYmd, "00:00").toISOString())
    .lt("starts_at", shopLocalToUtc(toYmd, "00:00").toISOString())
    .order("starts_at", { ascending: true })
    .limit(2000);
  if (error) throw new Error(`No se pudieron cargar las citas: ${error.message}`);
  return (data ?? []).map(toAppointmentView);
}

export async function getBlockedSlotsInRange(db: Db, fromYmd: string, toYmd: string) {
  const { data, error } = await db
    .from("blocked_slots")
    .select("id, start_datetime, end_datetime, reason, barber:barbers(name)")
    .lt("start_datetime", shopLocalToUtc(toYmd, "00:00").toISOString())
    .gt("end_datetime", shopLocalToUtc(fromYmd, "00:00").toISOString())
    .order("start_datetime");
  if (error) throw new Error(`No se pudieron cargar los bloqueos: ${error.message}`);
  return (data ?? []).map((b) => ({
    id: b.id,
    start: b.start_datetime,
    end: b.end_datetime,
    reason: b.reason,
    barberName: b.barber?.name ?? null,
  }));
}

export type DayActivity = { date: string; total: number; byStatus: Partial<Record<AppointmentStatus, number>> };

/** Datos del dashboard, todos agregados en el servidor y en hora de la barbería. */
export async function getDashboardData(db: Db) {
  const nowIso = new Date().toISOString();
  const today = shopDateKey(nowInShop());
  const weekStart = format(addDays(new Date(`${today}T12:00:00Z`), -6), "yyyy-MM-dd");
  const sevenDaysAgo = addDays(new Date(), -7).toISOString();

  const count = (q: PromiseLike<{ count: number | null; error: { message: string } | null }>) =>
    Promise.resolve(q).then(({ count: c, error }) => {
      if (error) throw new Error(error.message);
      return c ?? 0;
    });

  const [todayCount, pendingCount, confirmedCount, cancelledCount, upcomingRes, weekRes] = await Promise.all([
    count(
      db.from("appointments").select("id", { count: "exact", head: true })
        .eq("appointment_date", today).in("status", ["pending", "confirmed", "completed"]),
    ),
    count(db.from("appointments").select("id", { count: "exact", head: true }).eq("status", "pending").gte("starts_at", nowIso)),
    count(db.from("appointments").select("id", { count: "exact", head: true }).eq("status", "confirmed").gte("starts_at", nowIso)),
    count(
      db.from("appointments").select("id", { count: "exact", head: true })
        .in("status", ["cancelled", "rejected"]).gte("status_changed_at", sevenDaysAgo),
    ),
    db.from("appointments").select(APPOINTMENT_SELECT)
      .in("status", ["pending", "confirmed"]).gte("ends_at", nowIso)
      .order("starts_at", { ascending: true }).limit(8),
    db.from("appointments").select("appointment_date, status").gte("appointment_date", weekStart).lte("appointment_date", today),
  ]);
  if (upcomingRes.error) throw new Error(upcomingRes.error.message);
  if (weekRes.error) throw new Error(weekRes.error.message);

  const week: DayActivity[] = Array.from({ length: 7 }, (_, i) => ({
    date: format(addDays(new Date(`${weekStart}T12:00:00Z`), i), "yyyy-MM-dd"),
    total: 0,
    byStatus: {},
  }));
  for (const row of weekRes.data ?? []) {
    const day = week.find((d) => d.date === row.appointment_date);
    if (!day) continue;
    day.total += 1;
    day.byStatus[row.status] = (day.byStatus[row.status] ?? 0) + 1;
  }

  return {
    today,
    kpis: { today: todayCount, pending: pendingCount, confirmed: confirmedCount, cancelled: cancelledCount },
    upcoming: (upcomingRes.data ?? []).map(toAppointmentView),
    week,
  };
}
