import "@/lib/zod-config";
import { z } from "zod";
import { mediaPathFromUrl } from "@/features/media/constants";
import { contentFields, contentSections, type ContentField } from "./registry";

const sectionIds = contentSections.map((s) => s.id) as [string, ...string[]];
const fieldByKey = new Map<string, ContentField>(contentFields.map((f) => [f.key, f]));

/**
 * Guardado de una sección del contenido. Solo se aceptan claves del registro
 * que pertenezcan a esa sección, con su largo máximo; las imágenes deben venir
 * del bucket propio. Guardar "" = restaurar el valor original.
 */
export const contentSaveSchema = z
  .object({
    section: z.enum(sectionIds),
    values: z.record(z.string(), z.string().max(5000)),
  })
  .superRefine((v, ctx) => {
    for (const [key, value] of Object.entries(v.values)) {
      const field = fieldByKey.get(key);
      if (!field || field.section !== v.section) {
        ctx.addIssue({ code: "custom", path: ["values", key], message: "Campo desconocido" });
        continue;
      }
      if (field.maxLength && value.trim().length > field.maxLength) {
        ctx.addIssue({ code: "custom", path: ["values", key], message: `Máximo ${field.maxLength} caracteres` });
      }
      if (field.type === "image" && value !== "" && !mediaPathFromUrl(value)) {
        ctx.addIssue({ code: "custom", path: ["values", key], message: "La imagen debe subirse desde el panel" });
      }
    }
  });

export type ContentSaveInput = z.infer<typeof contentSaveSchema>;

export function contentField(key: string): ContentField | undefined {
  return fieldByKey.get(key);
}

export const galleryAddSchema = z.object({
  urls: z
    .array(z.string().refine((u) => mediaPathFromUrl(u)?.startsWith("gallery/") ?? false, "Imagen inválida"))
    .min(1)
    .max(20),
});

export const galleryUpdateSchema = z.object({
  id: z.uuid(),
  alt: z.string().trim().max(200, "Máximo 200 caracteres"),
  isActive: z.boolean(),
});
