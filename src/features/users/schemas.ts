import "@/lib/zod-config";
import { z } from "zod";

export const roleSchema = z.enum(["admin", "staff"]);

export const passwordSchema = z
  .string()
  .min(12, "Mínimo 12 caracteres")
  .max(72, "Máximo 72 caracteres");

export const createUserSchema = z.object({
  fullName: z.string().trim().min(2, "Escribe el nombre").max(80),
  email: z.email("Correo inválido").trim().toLowerCase().max(254),
  password: passwordSchema,
  role: roleSchema,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const roleChangeSchema = z.object({ id: z.uuid(), role: roleSchema });
export const passwordChangeSchema = z.object({ id: z.uuid(), password: passwordSchema });

export const roleLabels = { admin: "Administración", staff: "Recepción" } as const;
