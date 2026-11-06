import type { Metadata } from "next";
import { BarbersManager } from "@/components/admin/barbers/barbers-manager";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/features/auth/dal";

export const metadata: Metadata = { title: "Barberos" };

export default async function BarbersAdminPage() {
  const { supabase } = await requireAdmin();
  const [barbersRes, hoursRes, shopRes] = await Promise.all([
    supabase.from("barbers").select("*").order("is_active", { ascending: false }).order("name"),
    supabase.from("barber_hours").select("barber_id, day_of_week, opening_time, closing_time"),
    supabase.from("business_hours").select("*"),
  ]);
  for (const r of [barbersRes, hoursRes, shopRes]) if (r.error) throw new Error(r.error.message);

  const barbers = (barbersRes.data ?? []).map((b) => ({
    ...b,
    hours: (hoursRes.data ?? [])
      .filter((h) => h.barber_id === b.id)
      .map(({ day_of_week, opening_time, closing_time }) => ({ day_of_week, opening_time, closing_time })),
  }));

  return (
    <>
      <PageHeader
        title="Barberos"
        description="Equipo de la barbería. Hoy la agenda funciona como un solo recurso: los clientes no eligen barbero al reservar."
      />
      <BarbersManager barbers={barbers} shopHours={shopRes.data ?? []} />
    </>
  );
}
