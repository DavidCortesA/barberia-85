"use server";

import { revalidatePath } from "next/cache";
import { dbErrorMessage, failure, validationFailure, type ActionResult } from "@/features/admin/result";
import { idSchema } from "@/features/admin/schemas";
import { requireAdmin } from "@/features/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { createUserSchema, passwordChangeSchema, roleChangeSchema } from "./schemas";

/*
 * Gestión de cuentas del panel. Crear, borrar o cambiar contraseñas en Supabase
 * Auth exige la clave secreta (createAdminClient): por eso TODA acción empieza
 * con requireAdmin() y valida con Zod antes de llamar a Auth. El rol vive en
 * `profiles` y se cambia con la sesión del admin (RLS).
 */

const SELF = "No puedes cambiar ni eliminar tu propia cuenta desde aquí (evita quedarte sin acceso).";

export async function createUserAction(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const v = parsed.data;

  const { data, error } = await createAdminClient().auth.admin.createUser({
    email: v.email,
    password: v.password,
    email_confirm: true,
    user_metadata: { full_name: v.fullName },
  });
  if (error || !data.user) {
    if (error?.code === "email_exists" || /already/i.test(error?.message ?? "")) {
      return failure("Ya existe una cuenta con ese correo.", { email: "Ya existe una cuenta con ese correo." });
    }
    if (error?.code === "weak_password") return failure("La contraseña es demasiado débil.", { password: "Elige una contraseña más segura." });
    console.error("[users] createUser", error?.code);
    return failure("No se pudo crear la cuenta. Inténtalo de nuevo.");
  }

  // El trigger de Auth crea el perfil como staff; aquí se fija rol y nombre.
  const { error: pErr } = await supabase
    .from("profiles")
    .update({ role: v.role, full_name: v.fullName })
    .eq("id", data.user.id)
    .select("id")
    .single();
  if (pErr) return failure(dbErrorMessage(pErr));

  revalidatePath("/admin/users");
  return { ok: true, message: "Cuenta creada. Comparte la contraseña en persona, no por chat." };
}

export async function changeRoleAction(input: unknown): Promise<ActionResult> {
  const { supabase, userId } = await requireAdmin();
  const parsed = roleChangeSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  if (parsed.data.id === userId) return failure(SELF);

  const { error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.id)
    .select("id")
    .single();
  if (error) return failure(dbErrorMessage(error));

  revalidatePath("/admin/users");
  return { ok: true, message: "Rol actualizado." };
}

export async function setPasswordAction(input: unknown): Promise<ActionResult> {
  const { userId } = await requireAdmin();
  const parsed = passwordChangeSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  if (parsed.data.id === userId) return failure(SELF);

  const { error } = await createAdminClient().auth.admin.updateUserById(parsed.data.id, { password: parsed.data.password });
  if (error) {
    console.error("[users] updateUser", error.code);
    return failure(error.code === "weak_password" ? "La contraseña es demasiado débil." : "No se pudo cambiar la contraseña.");
  }
  return { ok: true, message: "Contraseña actualizada." };
}

export async function deleteUserAction(input: unknown): Promise<ActionResult> {
  const { userId } = await requireAdmin();
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  if (parsed.data.id === userId) return failure(SELF);

  // El perfil se borra en cascada; el historial de citas conserva el id del autor.
  const { error } = await createAdminClient().auth.admin.deleteUser(parsed.data.id);
  if (error) {
    console.error("[users] deleteUser", error.code);
    return failure("No se pudo eliminar la cuenta.");
  }
  revalidatePath("/admin/users");
  return { ok: true, message: "Cuenta eliminada." };
}
