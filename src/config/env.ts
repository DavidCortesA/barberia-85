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
  /** Opcional: ID de medición de Google Analytics 4 (G-XXXXXXX). */
  NEXT_PUBLIC_GA_ID: z.string().regex(/^G-[A-Z0-9]+$/, "Formato G-XXXXXXX").optional(),
});

const parsed = publicSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID || undefined,
});

if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
  throw new Error(
    `Variables de entorno públicas inválidas o ausentes: ${missing}. Revisa .env.local (plantilla: .env.example).`,
  );
}

export const publicEnv = parsed.data;
