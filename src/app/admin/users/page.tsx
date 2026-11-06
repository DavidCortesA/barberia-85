import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { UsersManager, type PanelUser } from "@/components/admin/users/users-manager";
import { requireAdmin } from "@/features/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Usuarios" };

export default async function UsersAdminPage() {
  const { supabase, userId } = await requireAdmin();

  // Rol y nombre desde profiles (RLS: el admin ve todos); correo y último acceso desde Auth.
  const [profilesRes, authRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, created_at").order("created_at"),
    createAdminClient().auth.admin.listUsers({ perPage: 200 }),
  ]);
  if (profilesRes.error) throw new Error(profilesRes.error.message);
  if (authRes.error) throw new Error(authRes.error.message);

  const authById = new Map(authRes.data.users.map((u) => [u.id, u]));
  const users: PanelUser[] = (profilesRes.data ?? []).map((p) => ({
    id: p.id,
    name: p.full_name,
    email: authById.get(p.id)?.email ?? null,
    role: p.role,
    lastSignIn: authById.get(p.id)?.last_sign_in_at ?? null,
    isSelf: p.id === userId,
  }));

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Cuentas con acceso al panel. Recepción atiende citas, calendario y bloqueos; Administración además edita servicios, horarios, contenido, configuración y usuarios."
      />
      <UsersManager users={users} />
    </>
  );
}
