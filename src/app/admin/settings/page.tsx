import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings/settings-form";
import { requireAdmin } from "@/features/auth/dal";

export const metadata: Metadata = { title: "Configuración" };

export default async function SettingsAdminPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("business_settings").select("*").eq("id", true).single();
  if (error) throw new Error(error.message);

  return (
    <>
      <PageHeader
        title="Configuración"
        description="Datos de contacto que se muestran en el sitio y reglas de la reserva en línea."
      />
      <SettingsForm settings={data} />
    </>
  );
}
