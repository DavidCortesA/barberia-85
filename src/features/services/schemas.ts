import "@/lib/zod-config";
import { z } from "zod";

/** Servicio editable desde el panel (lo comparten el formulario y la Server Action). */
export const serviceSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(80, "Máximo 80 caracteres"),
  description: z.string().trim().max(500, "Máximo 500 caracteres"),
  price: z.number({ error: "Escribe un precio" }).min(0, "No puede ser negativo").max(100_000, "Precio demasiado alto"),
  durationMinutes: z
    .number({ error: "Escribe la duración" })
    .int("Usa minutos enteros")
    .min(5, "Mínimo 5 minutos")
    .max(480, "Máximo 8 horas")
    .multipleOf(5, "Usa múltiplos de 5 minutos"),
  imageUrl: z.string().trim().max(2000),
  isActive: z.boolean(),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
