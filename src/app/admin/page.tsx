import type { Metadata } from "next";
import { Dashboard } from "@/components/admin/dashboard/dashboard";
import { PageHeader } from "@/components/admin/page-header";
import { getDashboardData } from "@/features/appointments/admin-queries";
import { formatDateLong } from "@/features/appointments/format";
import { requirePanel } from "@/features/auth/dal";

// La plantilla "%s · Panel" del layout no aplica a la página de su mismo segmento.
export const metadata: Metadata = { title: { absolute: "Inicio · Panel" } };

export default async function AdminDashboardPage(props: PageProps<"/admin">) {
  const { supabase } = await requirePanel();
  const { aviso } = await props.searchParams;
  const data = await getDashboardData(supabase);

  return (
    <>
      <PageHeader title="Inicio" description={formatDateLong(data.today)} />
      {aviso === "sin-permiso" && (
        <p role="status" className="border-st-pending/40 bg-st-pending/10 mb-6 rounded-[3px] border p-3 text-sm">
          Esa sección es solo para la administración. Si necesitas un cambio ahí, pídeselo a quien administra el panel.
        </p>
      )}
      <Dashboard data={data} />
    </>
  );
}
