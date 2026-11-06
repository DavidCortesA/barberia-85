import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { requirePanel } from "@/features/auth/dal";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Segunda barrera (la primera es proxy.ts): sesión válida y rol de panel.
  // Cada página y cada acción vuelven a exigir su rol (admin o staff).
  const user = await requirePanel();

  return (
    <AdminShell userLabel={user.name || user.email || "Usuario"} role={user.role}>
      {children}
    </AdminShell>
  );
}
