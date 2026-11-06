"use server";

import { revalidatePath } from "next/cache";
import { reorder } from "@/features/admin/reorder";
import { dbErrorMessage, failure, validationFailure, type ActionResult } from "@/features/admin/result";
import { idSchema, moveSchema } from "@/features/admin/schemas";
import { requireAdmin } from "@/features/auth/dal";
import { removeMedia } from "@/features/media/server";
import { contentField, contentSaveSchema, galleryAddSchema, galleryUpdateSchema } from "./schemas";

/** Todo el contenido se ve en el sitio público: se revalida el árbol completo. */
function revalidate() {
  revalidatePath("/", "layout");
}

export async function saveContentAction(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = contentSaveSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const entries = Object.entries(parsed.data.values).map(([key, value]) => ({
    key,
    value: contentField(key)?.type === "image" ? value.trim() : value.trim().replace(/\r\n/g, "\n"),
  }));
  if (entries.length === 0) return { ok: true, message: "Sin cambios." };

  // Imágenes anteriores, para borrar del bucket las que se reemplazan o quitan.
  const imageKeys = entries.filter((e) => contentField(e.key)?.type === "image").map((e) => e.key);
  const { data: before } = imageKeys.length
    ? await supabase.from("site_content").select("key, value").in("key", imageKeys)
    : { data: [] as { key: string; value: string }[] };

  const { error } = await supabase.from("site_content").upsert(entries, { onConflict: "key" });
  if (error) return failure(dbErrorMessage(error));

  const replaced = (before ?? []).filter((b) => b.value && entries.find((e) => e.key === b.key)?.value !== b.value);
  await removeMedia(supabase, ...replaced.map((b) => b.value));

  revalidate();
  return { ok: true, message: "Contenido guardado. Ya se ve en el sitio." };
}

export async function addGalleryImagesAction(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = galleryAddSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const { data: last } = await supabase
    .from("gallery_images")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const base = last?.sort_order ?? 0;

  const { error } = await supabase
    .from("gallery_images")
    .insert(parsed.data.urls.map((url, i) => ({ image_url: url, sort_order: base + (i + 1) * 10 })));
  if (error) return failure(dbErrorMessage(error));

  revalidate();
  const n = parsed.data.urls.length;
  return { ok: true, message: n === 1 ? "Foto agregada a la galería." : `${n} fotos agregadas a la galería.` };
}

export async function updateGalleryImageAction(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = galleryUpdateSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const { error } = await supabase
    .from("gallery_images")
    .update({ alt: parsed.data.alt || null, is_active: parsed.data.isActive })
    .eq("id", parsed.data.id)
    .select("id")
    .single();
  if (error) return failure(dbErrorMessage(error));

  revalidate();
  return { ok: true, message: "Foto actualizada." };
}

export async function moveGalleryImageAction(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const { data, error } = await supabase.from("gallery_images").select("id, sort_order").order("sort_order").order("created_at");
  if (error) return failure(dbErrorMessage(error));

  for (const u of reorder(data ?? [], parsed.data.id, parsed.data.direction)) {
    const { error: e } = await supabase.from("gallery_images").update({ sort_order: u.sort_order }).eq("id", u.id);
    if (e) return failure(dbErrorMessage(e));
  }
  revalidate();
  return { ok: true, message: "" };
}

export async function deleteGalleryImageAction(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const { data, error } = await supabase.from("gallery_images").delete().eq("id", parsed.data.id).select("image_url").single();
  if (error) return failure(dbErrorMessage(error));
  await removeMedia(supabase, data.image_url);

  revalidate();
  return { ok: true, message: "Foto eliminada." };
}
