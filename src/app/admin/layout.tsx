import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/features/auth/dal";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Segunda barrera (la primera es proxy.ts): sesión válida Y rol admin.
  const admin = await requireAdmin();

  return <AdminShell userLabel={admin.name || admin.email || "Administrador"}>{children}</AdminShell>;
}
