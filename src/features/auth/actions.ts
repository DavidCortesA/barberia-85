"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, safeAdminPath } from "./schemas";

export type LoginResult = { ok: false; message: string };

const INVALID = "Correo o contraseña incorrectos.";

/**
 * Inicia sesión. Los mensajes son genéricos: nunca revelan si el correo existe.
 * Una cuenta sin rol admin se cierra de inmediato y no entra al panel.
 */
export async function loginAction(input: unknown, next?: string): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: INVALID };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    if (error && error.status !== 400) console.error("[auth] login", error.status, error.code);
    return { ok: false, message: error?.status === 429 ? "Demasiados intentos. Espera unos minutos." : INVALID };
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    return { ok: false, message: "Esta cuenta no tiene acceso al panel." };
  }

  redirect(safeAdminPath(next));
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
