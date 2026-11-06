import type { Metadata } from "next";
import { AppointmentsFilters } from "@/components/admin/appointments/appointments-filters";
import { AppointmentsTable } from "@/components/admin/appointments/appointments-table";
import { PageHeader } from "@/components/admin/page-header";
import { listAppointments, PAGE_SIZE, parseAppointmentFilters } from "@/features/appointments/admin-queries";
import { requirePanel } from "@/features/auth/dal";

export const metadata: Metadata = { title: "Citas" };

export default async function AppointmentsPage(props: PageProps<"/admin/appointments">) {
  const { supabase } = await requirePanel();
  const filters = parseAppointmentFilters(await props.searchParams);
  const { rows, total } = await listAppointments(supabase, filters);

  return (
    <>
      <PageHeader
        title="Citas"
        description="Confirma, rechaza, cancela o completa citas. Al confirmar puedes avisar al cliente por WhatsApp."
      />
      <AppointmentsFilters filters={filters} />
      <AppointmentsTable
        rows={rows}
        total={total}
        page={filters.page}
        pageSize={PAGE_SIZE}
        filtered={filters.status !== "all" || !!filters.date || !!filters.q}
      />
    </>
  );
}
