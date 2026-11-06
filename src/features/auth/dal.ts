import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/types";

export type PanelRole = Enums<"user_role">;

export type PanelSession = {
  /** Cliente con la sesión del usuario: RLS sigue activo y la BD vuelve a validar el rol. */
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  email: string | null;
  name: string | null;
  role: PanelRole;
};

/** Compatibilidad: una sesión de admin es una PanelSession con role "admin". */
export type AdminSession = PanelSession;

export type SessionCheck =
  | { status: "ok"; session: PanelSession }
  | { status: "anonymous" }
  | { status: "forbidden" };

/**
 * Data Access Layer de autenticación. Verifica la sesión con getClaims() (firma
 * del JWT validada) y lee el rol de `profiles` (nunca de los metadatos del
 * usuario, que él mismo puede editar). Se memoriza por petición.
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

  if (error || !profile || (profile.role !== "admin" && profile.role !== "staff")) return { status: "forbidden" };

  return {
    status: "ok",
    session: {
      supabase,
      userId: claims.sub,
      email: typeof claims.email === "string" ? claims.email : null,
      name: profile.full_name,
      role: profile.role,
    },
  };
});

/** Sesión con alguno de los roles o null, sin redirigir (para Route Handlers que responden 401). */
export async function getPanelSession(roles: readonly PanelRole[] = ["admin", "staff"]): Promise<PanelSession | null> {
  const check = await checkSession();
  return check.status === "ok" && roles.includes(check.session.role) ? check.session : null;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  return getPanelSession(["admin"]);
}

/**
 * Exige uno de los roles. Se llama en el layout de /admin, en cada página y
 * AL INICIO de cada Server Action (proxy.ts es solo la primera barrera).
 *  · Sin sesión → /login
 *  · Sesión sin rol de panel → /login?error=sin-acceso
 *  · Rol de panel insuficiente (staff en una pantalla de admin) → /admin
 */
export async function requireRole(roles: readonly PanelRole[]): Promise<PanelSession> {
  const check = await checkSession();
  if (check.status === "ok") {
    if (roles.includes(check.session.role)) return check.session;
    redirect("/admin?aviso=sin-permiso");
  }
  redirect(check.status === "forbidden" ? "/login?error=sin-acceso" : "/login");
}

/** Cualquier usuario del panel (admin o staff). */
export function requirePanel(): Promise<PanelSession> {
  return requireRole(["admin", "staff"]);
}

/** Solo administradores (servicios, contenido, configuración, usuarios…). */
export function requireAdmin(): Promise<AdminSession> {
  return requireRole(["admin"]);
}
