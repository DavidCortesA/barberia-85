"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { failure, validationFailure, type ActionResult } from "@/features/admin/result";
import { requireAdmin } from "@/features/auth/dal";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, MEDIA_BUCKET, MEDIA_FOLDERS, mediaPathFromUrl } from "./constants";
import { removeMedia } from "./server";

const uploadSchema = z.object({
  folder: z.enum(MEDIA_FOLDERS),
  contentType: z.enum(Object.keys(IMAGE_TYPES) as [keyof typeof IMAGE_TYPES, ...(keyof typeof IMAGE_TYPES)[]], {
    error: "Formato no permitido. Usa JPG, PNG, WebP o AVIF.",
  }),
  size: z.number().int().positive().max(MAX_IMAGE_BYTES, "La imagen pesa más de 5 MB."),
});

export type UploadTicket = { path: string; token: string; publicUrl: string };

/**
 * Autoriza una subida: valida tipo y tamaño EN EL SERVIDOR, decide el nombre
 * (`carpeta/uuid.ext`) y devuelve una URL firmada de un solo uso. El navegador
 * sube el archivo directo a Supabase Storage (evita el límite de tamaño de las
 * Server Actions y de Vercel), y el bucket vuelve a exigir ≤ 5 MB e imagen.
 */
export async function createUploadTicketAction(input: unknown): Promise<ActionResult<UploadTicket>> {
  const { supabase } = await requireAdmin();
  const parsed = uploadSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const { folder, contentType } = parsed.data;
  const path = `${folder}/${randomUUID()}.${IMAGE_TYPES[contentType]}`;
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("[media] signed upload", error?.message);
    return failure("No se pudo preparar la subida. Inténtalo de nuevo.");
  }

  const publicUrl = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
  return { ok: true, message: "", data: { path: data.path, token: data.token, publicUrl } };
}

/** Descarta una imagen subida que al final no se guardó (p. ej. se reemplazó antes de guardar). */
export async function discardUploadAction(url: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (typeof url !== "string" || !mediaPathFromUrl(url)) return failure("Imagen inválida.");
  await removeMedia(supabase, url);
  return { ok: true, message: "" };
}
