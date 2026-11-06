import type { Metadata } from "next";
import { CalendarView } from "@/components/admin/calendar/calendar-view";
import { PageHeader } from "@/components/admin/page-header";
import { requirePanel } from "@/features/auth/dal";

export const metadata: Metadata = { title: "Calendario" };

export default async function CalendarPage() {
  const { supabase } = await requirePanel();
  const { data: hours, error } = await supabase
    .from("business_hours")
    .select("day_of_week, opening_time, closing_time, is_closed");
  if (error) throw new Error(error.message);

  return (
    <>
      <PageHeader title="Calendario" description="Vista por mes, semana o día. Toca una cita para ver el detalle." />
      <CalendarView
        businessHours={(hours ?? [])
          .filter((h) => !h.is_closed && h.opening_time && h.closing_time)
          .map((h) => ({ day: h.day_of_week, open: h.opening_time!.slice(0, 5), close: h.closing_time!.slice(0, 5) }))}
      />
    </>
  );
}
