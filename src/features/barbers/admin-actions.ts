"use server";

import { revalidatePath } from "next/cache";
import { dbErrorMessage, failure, validationFailure, type ActionResult } from "@/features/admin/result";
import { requireAdmin } from "@/features/auth/dal";
import { mediaPathFromUrl } from "@/features/media/constants";
import { removeIfReplaced, removeMedia } from "@/features/media/server";
import { idSchema, toggleSchema } from "@/features/admin/schemas";
import { weeklyToRows } from "@/features/schedule/admin-schemas";
import { barberHoursSchema, barberSchema } from "./schemas";

export async function saveBarberAction(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = barberSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const v = parsed.data;
  if (v.imageUrl && !mediaPathFromUrl(v.imageUrl)) return failure("La imagen debe subirse desde el panel.");

  const row = {
    name: v.name.replace(/\s+/g, " "),
    specialty: v.specialty || null,
    description: v.description || null,
    image_url: v.imageUrl || null,
    is_active: v.isActive,
  };

  if (v.id) {
    const { data: before } = await supabase.from("barbers").select("image_url").eq("id", v.id).maybeSingle();
    const { error } = await supabase.from("barbers").update(row).eq("id", v.id).select("id").single();
    if (error) return failure(dbErrorMessage(error));
    await removeIfReplaced(supabase, before?.image_url, row.image_url);
  } else {
    const { error } = await supabase.from("barbers").insert(row);
    if (error) return failure(dbErrorMessage(error));
  }

  revalidatePath("/admin", "layout");
  return { ok: true, message: v.id ? "Barbero actualizado." : "Barbero agregado." };
}

export async function toggleBarberAction(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = toggleSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const { error } = await supabase
    .from("barbers")
    .update({ is_active: parsed.data.isActive })
    .eq("id", parsed.data.id)
    .select("id")
    .single();
  if (error) return failure(dbErrorMessage(error));
  revalidatePath("/admin", "layout");
  return { ok: true, message: parsed.data.isActive ? "Barbero activado." : "Barbero desactivado." };
}

export async function deleteBarberAction(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const { data, error } = await supabase.from("barbers").delete().eq("id", parsed.data.id).select("image_url").single();
  if (error) {
    return failure(
      dbErrorMessage(error, { "23503": "Este barbero tiene citas registradas. Desactívalo en lugar de eliminarlo." }),
    );
  }
  await removeMedia(supabase, data.image_url);
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Barbero eliminado." };
}

/** Reemplaza la semana de trabajo de un barbero en una sola transacción. */
export async function saveBarberHoursAction(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = barberHoursSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  // Un día de descanso = sin filas (barber_hours no tiene "cerrado").
  const rows = weeklyToRows(parsed.data.days)
    .filter((r) => !r.is_closed)
    .map(({ day_of_week, opening_time, closing_time }) => ({ day_of_week, opening_time, closing_time }));

  const { error } = await supabase.rpc("admin_replace_barber_hours", {
    p_barber_id: parsed.data.barberId,
    p_hours: rows,
  });
  if (error) return failure(dbErrorMessage(error, { "23P01": "Hay rangos que se traslapan el mismo día." }));

  revalidatePath("/admin", "layout");
  return { ok: true, message: "Horario del barbero guardado." };
}
