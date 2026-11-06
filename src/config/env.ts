import "@/lib/zod-config";
import { z } from "zod";

/**
 * Variables de entorno PÚBLICAS (se incluyen en el bundle del navegador).
 * Next.js solo sustituye `process.env.NEXT_PUBLIC_*` cuando se referencian
 * de forma estática, por eso se listan una por una.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const parsed = publicSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});

if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
  throw new Error(
    `Variables de entorno públicas inválidas o ausentes: ${missing}. Revisa .env.local (plantilla: .env.example).`,
  );
}

export const publicEnv = parsed.data;
