"use server";

import { revalidatePath } from "next/cache";
import { dbErrorMessage, failure, validationFailure, type ActionResult } from "@/features/admin/result";
import { idSchema } from "@/features/admin/schemas";
import { requireAdmin } from "@/features/auth/dal";
import { shopDateKey, shopLocalToUtc } from "@/lib/date";
import { blockSchema, exceptionSchema, weeklySchema, weeklyToRows } from "./admin-schemas";

/** El horario se ve en el sitio (contacto, reserva): se revalida todo. */
function revalidate() {
  revalidatePath("/", "layout");
}

export async function saveWeeklyHoursAction(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = weeklySchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  // Reemplazo atómico (una transacción en la BD): si algo falla, el horario anterior queda intacto.
  const { error } = await supabase.rpc("admin_replace_business_hours", { p_hours: weeklyToRows(parsed.data) });
  if (error) return failure(dbErrorMessage(error, { "23P01": "Hay horarios que se traslapan el mismo día." }));

  revalidate();
  return { ok: true, message: "Horario semanal guardado." };
}

export async function createExceptionAction(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = exceptionSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const v = parsed.data;
  if (v.date < shopDateKey(new Date())) return failure("La fecha ya pasó.");

  const { error } = await supabase.from("schedule_exceptions").insert({
    exception_date: v.date,
    is_closed: v.closed,
    opening_time: v.closed ? null : v.open,
    closing_time: v.closed ? null : v.close,
    note: v.note || null,
  });
  if (error) return failure(dbErrorMessage(error, { "23505": "Ya hay una excepción para esa fecha. Elimínala primero." }));

  revalidate();
  return { ok: true, message: "Excepción agregada." };
}

export async function deleteExceptionAction(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const { error } = await supabase.from("schedule_exceptions").delete().eq("id", parsed.data.id).select("id").single();
  if (error) return failure(dbErrorMessage(error));
  revalidate();
  return { ok: true, message: "Excepción eliminada." };
}

export type BlockResult = { confirmedOverlaps: number };

export async function createBlockAction(input: unknown): Promise<ActionResult<BlockResult>> {
  const { supabase } = await requireAdmin();
  const parsed = blockSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const v = parsed.data;

  const start = shopLocalToUtc(v.startDate, v.startTime).toISOString();
  const end = shopLocalToUtc(v.endDate, v.endTime).toISOString();
  if (end <= new Date().toISOString()) return failure("Ese rango ya pasó.");

  const { error } = await supabase.from("blocked_slots").insert({
    start_datetime: start,
    end_datetime: end,
    reason: v.reason || null,
    barber_id: v.barberId || null,
  });
  if (error) return failure(dbErrorMessage(error));

  // Las citas confirmadas NO se cancelan solas: se avisa para que el admin decida.
  const { count } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("status", "confirmed")
    .lt("starts_at", end)
    .gt("ends_at", start);

  revalidatePath("/admin", "layout");
  const n = count ?? 0;
  return {
    ok: true,
    message:
      n === 0
        ? "Bloqueo agregado."
        : `Bloqueo agregado. Atención: ${n === 1 ? "hay 1 cita confirmada" : `hay ${n} citas confirmadas`} en ese rango; no se cancelan solas.`,
    data: { confirmedOverlaps: n },
    warning: n > 0,
  };
}

export async function deleteBlockAction(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const { error } = await supabase.from("blocked_slots").delete().eq("id", parsed.data.id).select("id").single();
  if (error) return failure(dbErrorMessage(error));
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Bloqueo eliminado." };
}
