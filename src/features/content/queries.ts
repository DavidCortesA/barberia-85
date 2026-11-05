import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import type { GalleryImage } from "@/types";
import { contentDefaults, isContentKey, type SiteContent } from "./registry";

/**
 * Contenido del sitio = valores por defecto + lo que el admin haya guardado.
 * Un valor vacío en la BD se interpreta como "restaurar el original".
 * Si Supabase no responde, el sitio sigue funcionando con los valores por defecto.
 */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const content: SiteContent = { ...contentDefaults };
  try {
    const { data, error } = await createPublicClient()
      .from("site_content")
      .select("key, value");
    if (error) throw error;
    for (const row of data ?? []) {
      if (isContentKey(row.key) && row.value.trim() !== "") {
        content[row.key] = row.value;
      }
    }
  } catch (err) {
    console.error("[content] No se pudo leer site_content; se usan valores por defecto.", err);
  }
  return content;
});

export const getGalleryImages = cache(async (): Promise<GalleryImage[]> => {
  try {
    const { data, error } = await createPublicClient()
      .from("gallery_images")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.error("[content] No se pudo leer gallery_images.", err);
    return [];
  }
});
