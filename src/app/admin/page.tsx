import type { Metadata } from "next";
import { Dashboard } from "@/components/admin/dashboard/dashboard";
import { PageHeader } from "@/components/admin/page-header";
import { getDashboardData } from "@/features/appointments/admin-queries";
import { formatDateLong } from "@/features/appointments/format";
import { requireAdmin } from "@/features/auth/dal";

// La plantilla "%s · Panel" del layout no aplica a la página de su mismo segmento.
export const metadata: Metadata = { title: { absolute: "Inicio · Panel" } };

export default async function AdminDashboardPage() {
  const { supabase } = await requireAdmin();
  const data = await getDashboardData(supabase);

  return (
    <>
      <PageHeader title="Inicio" description={formatDateLong(data.today)} />
      <Dashboard data={data} />
    </>
  );
}
