import "@/lib/zod-config";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Escribe un correo válido").trim().max(254),
  password: z.string().min(1, "Escribe tu contraseña").max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** Solo se permite volver a rutas internas del panel (evita redirecciones abiertas). */
export function safeAdminPath(next: unknown): string {
  if (typeof next !== "string") return "/admin";
  if (!/^\/admin(\/[\w\-/]*)?$/.test(next)) return "/admin";
  return next;
}
