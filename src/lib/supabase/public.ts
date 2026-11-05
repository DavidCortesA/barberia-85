import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/config/env";
import type { Database } from "@/types/database";

/**
 * Cliente anónimo SIN cookies, para leer datos públicos (servicios, contenido,
 * horarios). Al no depender de la sesión, las páginas públicas pueden
 * generarse de forma estática y revalidarse. RLS limita lo que ve.
 */
export function createPublicClient() {
  return createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
