import "server-only";
import type { AdminSession } from "@/features/auth/dal";
import { MEDIA_BUCKET, mediaPathFromUrl } from "./constants";

/**
 * Borra del bucket las imágenes que ya no se usan (al reemplazar o quitar una
 * foto). Ignora URLs externas o ajenas al bucket. Nunca hace fallar la acción.
 */
export async function removeMedia(db: AdminSession["supabase"], ...urls: (string | null | undefined)[]) {
  const paths = urls.map(mediaPathFromUrl).filter((p): p is string => !!p);
  if (paths.length === 0) return;
  const { error } = await db.storage.from(MEDIA_BUCKET).remove(paths);
  if (error) console.error("[media] no se pudo borrar", paths.length, "archivo(s):", error.message);
}

/** Borra la imagen anterior solo si cambió. */
export async function removeIfReplaced(db: AdminSession["supabase"], previous: string | null | undefined, next: string | null | undefined) {
  if (previous && previous !== next) await removeMedia(db, previous);
}
