/** Reglas de las imágenes subidas al bucket público `media` (el bucket aplica las mismas). */
export const MEDIA_BUCKET = "media";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
} as const;

export type ImageType = keyof typeof IMAGE_TYPES;

export const MEDIA_FOLDERS = ["services", "content", "gallery", "barbers"] as const;
export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

export const ACCEPT_IMAGES = Object.keys(IMAGE_TYPES).join(",");

export function isImageType(type: string): type is ImageType {
  return type in IMAGE_TYPES;
}

/** Valida un archivo antes de subirlo; devuelve el mensaje de error o null. */
export function imageFileError(file: { type: string; size: number }): string | null {
  if (!isImageType(file.type)) return "Formato no permitido. Usa JPG, PNG, WebP o AVIF.";
  if (file.size > MAX_IMAGE_BYTES) return "La imagen pesa más de 5 MB. Redúcela e inténtalo de nuevo.";
  if (file.size === 0) return "El archivo está vacío.";
  return null;
}

/** Ruta dentro del bucket a partir de la URL pública; null si no es de nuestro bucket. */
export function mediaPathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  const path = decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
  return /^(services|content|gallery|barbers)\/[\w-]+\.(jpg|png|webp|avif)$/.test(path) ? path : null;
}
