import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type AdminSession = {
  /** Cliente con la sesión del admin: RLS sigue activo y la BD vuelve a validar el rol. */
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  email: string | null;
  name: string | null;
};

export type SessionCheck =
  | { status: "admin"; session: AdminSession }
  | { status: "anonymous" }
  | { status: "forbidden" };

/**
 * Data Access Layer de autenticación. Verifica la sesión con getClaims() (firma
 * del JWT validada) y que el perfil tenga rol `admin`. Se memoriza por petición.
 */
export const checkSession = cache(async (): Promise<SessionCheck> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return { status: "anonymous" };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", claims.sub)
    .maybeSingle();

  if (error || profile?.role !== "admin") return { status: "forbidden" };

  return {
    status: "admin",
    session: {
      supabase,
      userId: claims.sub,
      email: typeof claims.email === "string" ? claims.email : null,
      name: profile.full_name,
    },
  };
});

/** Sesión de admin o null, sin redirigir (para Route Handlers que responden 401). */
export async function getAdminSession(): Promise<AdminSession | null> {
  const check = await checkSession();
  return check.status === "admin" ? check.session : null;
}

/**
 * Exige un administrador. Se llama en el layout de /admin y AL INICIO de cada
 * Server Action del panel (proxy.ts es solo la primera barrera).
 */
export async function requireAdmin(): Promise<AdminSession> {
  const check = await checkSession();
  if (check.status === "admin") return check.session;
  redirect(check.status === "forbidden" ? "/login?error=sin-acceso" : "/login");
}
