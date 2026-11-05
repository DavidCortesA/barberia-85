import "server-only";
import { z } from "zod";

/**
 * Variables de entorno SOLO de servidor. Nunca llevan prefijo NEXT_PUBLIC y
 * este módulo falla en build si alguien lo importa desde un Client Component.
 * Se validan de forma perezosa para no romper el build de páginas que no las usan.
 */
const serverSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1),
  CRON_SECRET: z.string().min(16),
});

let cached: z.infer<typeof serverSchema> | undefined;

export function getServerEnv() {
  if (!cached) {
    const result = serverSchema.safeParse({
      SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
      CRON_SECRET: process.env.CRON_SECRET,
    });
    if (!result.success) {
      const missing = result.error.issues.map((i) => i.path.join(".")).join(", ");
      throw new Error(`Variables de entorno de servidor inválidas o ausentes: ${missing}.`);
    }
    cached = result.data;
  }
  return cached;
}
