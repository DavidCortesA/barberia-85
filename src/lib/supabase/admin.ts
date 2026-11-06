import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/config/env";
import { getServerEnv } from "@/config/env.server";
import type { Database } from "@/types/database";

/**
 * Cliente con la clave SECRETA (service role). Salta RLS.
 *
 * Uso permitido: el flujo público de reservas (disponibilidad y crear
 * solicitud), donde la validación ocurre en el servidor; el cron; y la gestión
 * de cuentas del panel (/admin/users), siempre después de requireAdmin().
 * Nunca importar desde Client Components (server-only lo impide).
 */
export function createAdminClient() {
  return createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    getServerEnv().SUPABASE_SECRET_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
