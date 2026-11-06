import "@/lib/zod-config";
import { z } from "zod";
import { weeklySchema } from "@/features/schedule/admin-schemas";

export const barberSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(80, "Máximo 80 caracteres"),
  specialty: z.string().trim().max(120, "Máximo 120 caracteres"),
  description: z.string().trim().max(500, "Máximo 500 caracteres"),
  imageUrl: z.string().trim().max(2000),
  isActive: z.boolean(),
});

export type BarberInput = z.infer<typeof barberSchema>;

/** Semana de trabajo de un barbero (mismas reglas que el horario de la barbería). */
export const barberHoursSchema = z.object({ barberId: z.uuid(), days: weeklySchema });
