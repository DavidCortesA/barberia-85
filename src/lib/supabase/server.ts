import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/config/env";
import type { Database } from "@/types/database";

/**
 * Cliente con la sesión del usuario (cookies) para Server Components,
 * Server Actions y Route Handlers. Respeta RLS: las acciones del admin
 * pasan por aquí y la base de datos valida el rol.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Se invoca desde un Server Component (solo lectura de cookies).
            // Es seguro ignorarlo: proxy.ts refresca la sesión.
          }
        },
      },
    },
  );
}
