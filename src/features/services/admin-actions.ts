"use server";

import { revalidatePath } from "next/cache";
import { reorder } from "@/features/admin/reorder";
import { dbErrorMessage, failure, validationFailure, type ActionResult } from "@/features/admin/result";
import { requireAdmin } from "@/features/auth/dal";
import { mediaPathFromUrl } from "@/features/media/constants";
import { removeIfReplaced, removeMedia } from "@/features/media/server";
import { idSchema, moveSchema, toggleSchema } from "@/features/admin/schemas";
import { serviceSchema } from "./schemas";

/** Los servicios se ven en el sitio público: se revalida todo el árbol. */
function revalidate() {
  revalidatePath("/", "layout");
}

export async function saveServiceAction(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const v = parsed.data;

  if (v.imageUrl && !mediaPathFromUrl(v.imageUrl)) return failure("La imagen debe subirse desde el panel.");

  const row = {
    name: v.name.replace(/\s+/g, " "),
    description: v.description || null,
    price: v.price,
    duration_minutes: v.durationMinutes,
    image_url: v.imageUrl || null,
    is_active: v.isActive,
  };

  if (v.id) {
    const { data: before } = await supabase.from("services").select("image_url").eq("id", v.id).maybeSingle();
    const { error } = await supabase.from("services").update(row).eq("id", v.id).select("id").single();
    if (error) return failure(dbErrorMessage(error));
    await removeIfReplaced(supabase, before?.image_url, row.image_url);
    revalidate();
    return { ok: true, message: "Servicio actualizado." };
  }

  const { data: last } = await supabase
    .from("services")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from("services").insert({ ...row, sort_order: (last?.sort_order ?? 0) + 10 });
  if (error) return failure(dbErrorMessage(error));
  revalidate();
  return { ok: true, message: "Servicio creado." };
}

export async function toggleServiceAction(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = toggleSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const { error } = await supabase
    .from("services")
    .update({ is_active: parsed.data.isActive })
    .eq("id", parsed.data.id)
    .select("id")
    .single();
  if (error) return failure(dbErrorMessage(error));
  revalidate();
  return { ok: true, message: parsed.data.isActive ? "Servicio visible en el sitio." : "Servicio oculto del sitio." };
}

export async function moveServiceAction(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const { data, error } = await supabase
    .from("services")
    .select("id, sort_order")
    .order("sort_order")
    .order("name");
  if (error) return failure(dbErrorMessage(error));

  const updates = reorder(data ?? [], parsed.data.id, parsed.data.direction);
  for (const u of updates) {
    const { error: e } = await supabase.from("services").update({ sort_order: u.sort_order }).eq("id", u.id);
    if (e) return failure(dbErrorMessage(e));
  }
  revalidate();
  return { ok: true, message: "Orden actualizado." };
}

export async function deleteServiceAction(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const { data, error } = await supabase.from("services").delete().eq("id", parsed.data.id).select("image_url").single();
  if (error) {
    return failure(
      dbErrorMessage(error, {
        "23503": "Este servicio tiene citas registradas y no se puede eliminar. Desactívalo para ocultarlo del sitio.",
      }),
    );
  }
  await removeMedia(supabase, data.image_url);
  revalidate();
  return { ok: true, message: "Servicio eliminado." };
}
