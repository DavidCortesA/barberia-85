"use client";

import { createUploadTicketAction } from "@/features/media/actions";
import { imageFileError, MEDIA_BUCKET, type MediaFolder } from "@/features/media/constants";
import { createClient } from "@/lib/supabase/client";

export type UploadOutcome = { ok: true; url: string } | { ok: false; message: string };

/** Sube una imagen: valida en el navegador, pide permiso al servidor y sube a Storage. */
export async function uploadImage(file: File, folder: MediaFolder): Promise<UploadOutcome> {
  const localError = imageFileError(file);
  if (localError) return { ok: false, message: localError };

  const ticket = await createUploadTicketAction({ folder, contentType: file.type, size: file.size });
  if (!ticket.ok || !ticket.data) return { ok: false, message: ticket.message };

  const { error } = await createClient()
    .storage.from(MEDIA_BUCKET)
    .uploadToSignedUrl(ticket.data.path, ticket.data.token, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) {
    console.error("[media] upload", error.message);
    return { ok: false, message: "No se pudo subir la imagen. Revisa tu conexión e inténtalo de nuevo." };
  }
  return { ok: true, url: ticket.data.publicUrl };
}
