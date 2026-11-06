import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { ServicesManager } from "@/components/admin/services/services-manager";
import { requireAdmin } from "@/features/auth/dal";

export const metadata: Metadata = { title: "Servicios" };

export default async function ServicesAdminPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("services").select("*").order("sort_order").order("name");
  if (error) throw new Error(error.message);

  return (
    <>
      <PageHeader
        title="Servicios"
        description="Lo que aparece en el sitio y en la reserva. Si un servicio ya tiene citas, desactívalo en lugar de eliminarlo."
      />
      <ServicesManager services={(data ?? []).map((s) => ({ ...s, price: Number(s.price) }))} />
    </>
  );
}
